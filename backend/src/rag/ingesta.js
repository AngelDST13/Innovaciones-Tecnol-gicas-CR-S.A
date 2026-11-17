/**
 * Ingesta incremental de las políticas desde Drive a la base vectorial.
 *
 * - Nuevo: se extrae, fragmenta, vectoriza e inserta.
 * - Editado (modifiedTime distinto): se reemplazan sus fragmentos.
 * - Sin cambios: no se toca.
 * - Borrado (ya no está en la carpeta): se marca eliminado y se quitan sus fragmentos.
 * La fecha de modificación se guarda al final, así una ingesta interrumpida se reintenta completa en la siguiente.
 */
import { createHash } from 'node:crypto';
import { query } from '../config/database.js';
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

async function reemplazarFragmentos(documentoId, fragmentos) {
  await query('DELETE FROM fragmentos_politica WHERE documento_id = $1', [documentoId]);
  for (let i = 0; i < fragmentos.length; i += LOTE_EMBEDDINGS) {
    const lote = fragmentos.slice(i, i + LOTE_EMBEDDINGS);
    const vectores = await vectorizarFragmentos(lote.map(textoParaEmbedding));
    for (let j = 0; j < lote.length; j++) {
      const f = lote[j];
      await query(
        `INSERT INTO fragmentos_politica
           (documento_id, codigo, version, tipo_fragmento, seccion, seccion_titulo, punto, orden,
            metadatos_documento, contenido, por_validar, hash_contenido, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::vector)`,
        [
          documentoId, f.codigo, f.version, f.tipo_fragmento, f.seccion, f.seccion_titulo, f.punto, f.orden,
          f.metadatos_documento, f.contenido, f.por_validar, sha256(textoParaEmbedding(f)),
          aTextoVector(vectores[j]),
        ],
      );
    }
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

  const { rows: existentes } = await query(
    'SELECT id, drive_file_id, fecha_modificacion, eliminado FROM documentos_politica',
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

    const { rows } = await query(
      `INSERT INTO documentos_politica (drive_file_id, titulo, version, enlace, fecha_modificacion, eliminado)
            VALUES ($1, $2, $3, $4, $5, FALSE)
       ON CONFLICT (drive_file_id) DO UPDATE
              SET titulo = EXCLUDED.titulo, version = EXCLUDED.version, enlace = EXCLUDED.enlace, eliminado = FALSE
       RETURNING id`,
      [archivo.id, archivo.name.replace(/\.pdf$/i, ''), version ?? '—', `https://drive.google.com/file/d/${archivo.id}/view`, modificado],
    );
    const documentoId = rows[0].id;

    const { texto } = await extraerTexto(archivo, drive);
    const base = { codigo, version, drive_file_id: archivo.id };
    const fragmentos = codigo === 'POL-CAL' ? fragmentosCalendario(texto, base) : fragmentosPolitica(texto, base);

    await reemplazarFragmentos(documentoId, fragmentos);
    await query('UPDATE documentos_politica SET fecha_modificacion = $2, indexado_en = now() WHERE id = $1', [documentoId, modificado]);

    if (previo) resumen.actualizados += 1; else resumen.nuevos += 1;
    resumen.fragmentos += fragmentos.length;
    registrar.info(`Indexado ${codigo} (${fragmentos.length} fragmentos)`);
  }

  // Documentos que ya no están en la carpeta: se marcan como eliminados y se quitan sus fragmentos
  const idsEnDrive = new Set(archivos.map((a) => a.id));
  for (const doc of existentes) {
    if (!doc.eliminado && !idsEnDrive.has(doc.drive_file_id)) {
      await query('DELETE FROM fragmentos_politica WHERE documento_id = $1', [doc.id]);
      await query('UPDATE documentos_politica SET eliminado = TRUE WHERE id = $1', [doc.id]);
      resumen.eliminados += 1;
    }
  }

  await query('UPDATE sync_drive_estado SET ultima_sync = now() WHERE id = 1');
  return resumen;
}
