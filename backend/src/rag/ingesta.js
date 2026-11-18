/**
 * Ingesta incremental de las políticas desde Drive a la base vectorial (vía supabase-js).
 *
 * - Nuevo: se extrae, fragmenta, vectoriza e inserta.
 * - Editado (modifiedTime distinto): se reemplazan sus fragmentos.
 * - Sin cambios: no se toca.
 * - Borrado (ya no está en la carpeta): se marca eliminado y se quitan sus fragmentos.
 * La fecha de modificación se guarda al final: una ingesta interrumpida se reintenta completa.
 */
import { createHash } from 'node:crypto';
import { supabase } from '../config/database.js';
import { env } from '../config/env.js';
import { clienteDriveSoloLectura, extraerTexto, listarCarpeta, metadatosDesdeNombre } from '../drive/conector.js';
import { fragmentosCalendario, fragmentosPolitica } from './fragmentador.js';
import { aTextoVector, vectorizarFragmentos } from './embeddings.js';

const LOTE_EMBEDDINGS = 16;

const sha256 = (texto) => createHash('sha256').update(texto).digest('hex');

/** Texto que se vectoriza: incluye código y sección para que la búsqueda entienda el contexto. */
function textoParaEmbedding(f) {
  const ubicacion = [
    f.codigo,
    f.seccion ? `sección ${f.seccion} ${f.seccion_titulo ?? ''}`.trim() : null,
    f.punto ? `punto ${f.punto}` : null,
  ].filter(Boolean).join(' · ');
  return `${ubicacion}: ${f.contenido}`;
}

async function verificar(resultado) {
  if (resultado.error) throw resultado.error;
  return resultado.data;
}

async function reemplazarFragmentos(documentoId, fragmentos) {
  await verificar(await supabase.from('fragmentos_politica').delete().eq('documento_id', documentoId));
  for (let i = 0; i < fragmentos.length; i += LOTE_EMBEDDINGS) {
    const lote = fragmentos.slice(i, i + LOTE_EMBEDDINGS);
    const vectores = await vectorizarFragmentos(lote.map(textoParaEmbedding));
    const filas = lote.map((f, j) => ({
      documento_id: documentoId,
      codigo: f.codigo,
      version: f.version,
      tipo_fragmento: f.tipo_fragmento,
      seccion: f.seccion,
      seccion_titulo: f.seccion_titulo,
      punto: f.punto,
      orden: f.orden,
      metadatos_documento: f.metadatos_documento,
      contenido: f.contenido,
      por_validar: f.por_validar,
      hash_contenido: sha256(textoParaEmbedding(f)),
      embedding: aTextoVector(vectores[j]),
    }));
    await verificar(await supabase.from('fragmentos_politica').insert(filas));
  }
}

/**
 * Sincroniza la carpeta de Drive con la base vectorial.
 * @returns {Promise<{nuevos:number, actualizados:number, sinCambios:number, eliminados:number, fragmentos:number}>}
 */
export async function sincronizarPoliticas({ registrar = console } = {}) {
  const drive = clienteDriveSoloLectura();
  const archivos = (await listarCarpeta(env.driveFolderId, drive))
    .filter((a) => metadatosDesdeNombre(a.name).codigo !== null);

  const existentes = await verificar(
    await supabase.from('documentos_politica').select('id, drive_file_id, fecha_modificacion, eliminado'),
  );
  const porDriveId = new Map(existentes.map((d) => [d.drive_file_id, d]));
  const resumen = { nuevos: 0, actualizados: 0, sinCambios: 0, eliminados: 0, fragmentos: 0 };

  for (const archivo of archivos) {
    const { codigo, version } = metadatosDesdeNombre(archivo.name);
    const previo = porDriveId.get(archivo.id);
    const modificado = new Date(archivo.modifiedTime).toISOString();

    if (previo && !previo.eliminado && new Date(previo.fecha_modificacion).toISOString() === modificado) {
      resumen.sinCambios += 1;
      continue;
    }

    const documento = await verificar(
      await supabase
        .from('documentos_politica')
        .upsert(
          {
            drive_file_id: archivo.id,
            titulo: archivo.name.replace(/\.pdf$/i, ''),
            version: version ?? '—',
            enlace: `https://drive.google.com/file/d/${archivo.id}/view`,
            fecha_modificacion: modificado,
            eliminado: false,
          },
          { onConflict: 'drive_file_id' },
        )
        .select('id')
        .single(),
    );

    const { texto } = await extraerTexto(archivo, drive);
    const base = { codigo, version, drive_file_id: archivo.id };
    const fragmentos = codigo === 'POL-CAL' ? fragmentosCalendario(texto, base) : fragmentosPolitica(texto, base);

    await reemplazarFragmentos(documento.id, fragmentos);
    await verificar(
      await supabase
        .from('documentos_politica')
        .update({ fecha_modificacion: modificado, indexado_en: new Date().toISOString() })
        .eq('id', documento.id),
    );

    if (previo) resumen.actualizados += 1; else resumen.nuevos += 1;
    resumen.fragmentos += fragmentos.length;
    registrar.info(`Indexado ${codigo} (${fragmentos.length} fragmentos)`);
  }

  // Documentos que ya no están en la carpeta: se marcan como eliminados y se quitan sus fragmentos
  const idsEnDrive = new Set(archivos.map((a) => a.id));
  for (const doc of existentes) {
    if (!doc.eliminado && !idsEnDrive.has(doc.drive_file_id)) {
      await verificar(await supabase.from('fragmentos_politica').delete().eq('documento_id', doc.id));
      await verificar(await supabase.from('documentos_politica').update({ eliminado: true }).eq('id', doc.id));
      resumen.eliminados += 1;
    }
  }

  await verificar(await supabase.from('sync_drive_estado').update({ ultima_sync: new Date().toISOString() }).eq('id', 1));
  return resumen;
}
