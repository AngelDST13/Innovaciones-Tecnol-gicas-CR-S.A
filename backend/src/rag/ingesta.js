/**
 * Sincronización de las políticas desde Drive hacia la base vectorial (vía supabase-js).
 *
 * Dos modos, según el estado guardado en sync_drive_estado:
 *   - Por cambios (changes.list): usa el pageToken de la última sincronización y procesa solo lo que
 *     Drive reporta como nuevo, modificado, movido fuera de la carpeta, borrado o en la papelera.
 *   - Completa: sin token (primera vez) o si Drive rechaza el token vencido (HTTP 410). Lista la carpeta
 *     y compara fechas de modificación.
 *
 * Reglas por documento:
 *   - Nuevo o modificado (modifiedTime distinto): se extrae, fragmenta, vectoriza y reemplaza sus fragmentos.
 *   - Sin cambios: no se toca.
 *   - Borrado o fuera de la carpeta: se marca eliminado y se quitan sus fragmentos.
 *
 * El token nuevo se guarda al final: si la ingesta se interrumpe, la siguiente vuelve a procesar los cambios.
 */
import { createHash } from 'node:crypto';
import { supabase } from '../config/database.js';
import { env } from '../config/env.js';
import {
  clienteDriveSoloLectura,
  extraerTexto,
  listarCambios,
  listarCarpeta,
  metadatosDesdeNombre,
  tokenInicialDeCambios,
} from '../drive/conector.js';
import { fragmentosCalendario, fragmentosPolitica } from './fragmentador.js';
import { aTextoVector, vectorizarFragmentos } from './embeddings.js';

const LOTE_EMBEDDINGS = 16;
const HTTP_TOKEN_VENCIDO = 410;

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

async function leerDocumentos() {
  return verificar(await supabase.from('documentos_politica').select('id, drive_file_id, fecha_modificacion, eliminado'));
}

async function leerToken() {
  const estado = await verificar(await supabase.from('sync_drive_estado').select('page_token').eq('id', 1).single());
  return estado.page_token;
}

async function guardarEstado(pageToken) {
  await verificar(
    await supabase
      .from('sync_drive_estado')
      .update({ page_token: pageToken, ultima_sync: new Date().toISOString() })
      .eq('id', 1),
  );
}

/** Indexa un archivo de política (nuevo o modificado). Devuelve cuántos fragmentos generó. */
async function indexarArchivo(archivo, previo, drive, registrar) {
  const { codigo, version } = metadatosDesdeNombre(archivo.name);
  const modificado = new Date(archivo.modifiedTime).toISOString();

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

  registrar.info(`Indexado ${codigo} (${fragmentos.length} fragmentos)${previo ? ' [actualizado]' : ''}`);
  return fragmentos.length;
}

/** Quita un documento que ya no está vigente en Drive: marca eliminado y borra sus fragmentos. */
async function marcarEliminado(documento) {
  await verificar(await supabase.from('fragmentos_politica').delete().eq('documento_id', documento.id));
  await verificar(await supabase.from('documentos_politica').update({ eliminado: true }).eq('id', documento.id));
}

/** Indexa el archivo solo si cambió desde la última vez. Actualiza el resumen. */
async function procesarSiCambio(archivo, previo, drive, resumen, registrar) {
  const modificado = new Date(archivo.modifiedTime).toISOString();
  if (previo && !previo.eliminado && new Date(previo.fecha_modificacion).toISOString() === modificado) {
    resumen.sinCambios += 1;
    return;
  }
  resumen.fragmentos += await indexarArchivo(archivo, previo, drive, registrar);
  if (previo) resumen.actualizados += 1; else resumen.nuevos += 1;
}

function resumenInicial(modo) {
  return { modo, nuevos: 0, actualizados: 0, sinCambios: 0, eliminados: 0, fragmentos: 0 };
}

/** Sincronización completa: lista la carpeta y compara fechas. Guarda el token para las siguientes veces. */
async function sincronizarCompleta(drive, registrar) {
  // El token se pide antes de listar: cualquier cambio posterior queda en la siguiente sincronización
  const tokenInicial = await tokenInicialDeCambios(drive);
  const archivos = (await listarCarpeta(env.driveFolderId, drive))
    .filter((a) => metadatosDesdeNombre(a.name).codigo !== null);

  const existentes = await leerDocumentos();
  const porDriveId = new Map(existentes.map((d) => [d.drive_file_id, d]));
  const resumen = resumenInicial('completa');

  for (const archivo of archivos) {
    await procesarSiCambio(archivo, porDriveId.get(archivo.id), drive, resumen, registrar);
  }

  const idsEnDrive = new Set(archivos.map((a) => a.id));
  for (const doc of existentes) {
    if (!doc.eliminado && !idsEnDrive.has(doc.drive_file_id)) {
      await marcarEliminado(doc);
      resumen.eliminados += 1;
    }
  }

  await guardarEstado(tokenInicial);
  return resumen;
}

/** Sincronización incremental: solo lo que Drive reporta desde el último token. */
async function sincronizarPorCambios(pageToken, drive, registrar) {
  const { cambios, nuevoToken } = await listarCambios(pageToken, drive);
  const porDriveId = new Map((await leerDocumentos()).map((d) => [d.drive_file_id, d]));
  const resumen = resumenInicial('cambios');

  for (const cambio of cambios) {
    const archivo = cambio.file;
    const previo = porDriveId.get(cambio.fileId);
    const enLaCarpeta = Boolean(archivo) && !cambio.removed && !archivo.trashed
      && (archivo.parents ?? []).includes(env.driveFolderId);

    if (!enLaCarpeta) {
      if (previo && !previo.eliminado) {
        await marcarEliminado(previo);
        resumen.eliminados += 1;
      }
      continue;
    }
    if (metadatosDesdeNombre(archivo.name).codigo === null) continue;

    await procesarSiCambio(archivo, previo, drive, resumen, registrar);
  }

  await guardarEstado(nuevoToken);
  return resumen;
}

/**
 * Sincroniza la carpeta de Drive con la base vectorial.
 * @returns {Promise<{modo: string, nuevos:number, actualizados:number, sinCambios:number, eliminados:number, fragmentos:number}>}
 */
export async function sincronizarPoliticas({ registrar = console, drive = clienteDriveSoloLectura() } = {}) {
  const tokenGuardado = await leerToken();
  if (tokenGuardado) {
    try {
      return await sincronizarPorCambios(tokenGuardado, drive, registrar);
    } catch (error) {
      if (error.code !== HTTP_TOKEN_VENCIDO) throw error;
      registrar.warn('El token de cambios de Drive venció; se hace una sincronización completa.');
    }
  }
  return sincronizarCompleta(drive, registrar);
}
