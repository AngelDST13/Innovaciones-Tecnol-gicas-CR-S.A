/**
 * Conector de Google Drive (solo lectura) para la fuente de políticas.
 *
 * - Autenticación con la cuenta de servicio, con el scope drive.readonly (nada más amplio).
 * - Lista la carpeta con paginación y soporte de unidades compartidas.
 * - Extrae texto según el tipo: Google Doc -> Markdown (o texto plano), PDF -> texto, hoja -> CSV.
 * - Nunca escribe en Drive ni registra el contenido de la llave.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { google } from 'googleapis';
// Importación directa: el index.js de pdf-parse ejecuta código de prueba al cargarse desde ESM.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export const SCOPE_SOLO_LECTURA = 'https://www.googleapis.com/auth/drive.readonly';

const TIPO_DOC = 'application/vnd.google-apps.document';
const TIPO_HOJA = 'application/vnd.google-apps.spreadsheet';
const TIPO_PDF = 'application/pdf';

/** Ruta absoluta de la llave, validada al arrancar. Falla con un mensaje claro si no existe. */
export function rutaLlave() {
  const relativa = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!relativa) {
    throw new Error('Falta GOOGLE_APPLICATION_CREDENTIALS en backend/.env (ruta a la llave de la cuenta de servicio).');
  }
  const ruta = resolve(process.cwd(), relativa);
  if (!existsSync(ruta)) {
    throw new Error(`No se encuentra la llave de la cuenta de servicio en "${ruta}". Revisa GOOGLE_APPLICATION_CREDENTIALS.`);
  }
  return ruta;
}

let clienteDrive = null;

/** Cliente de Drive v3 de solo lectura (una sola instancia por proceso). */
export function clienteDriveSoloLectura() {
  if (!clienteDrive) {
    const auth = new google.auth.GoogleAuth({ keyFile: rutaLlave(), scopes: [SCOPE_SOLO_LECTURA] });
    clienteDrive = google.drive({ version: 'v3', auth });
  }
  return clienteDrive;
}

/** Lista todos los archivos vivos (no en la papelera) de la carpeta, con paginación. */
export async function listarCarpeta(carpetaId, drive = clienteDriveSoloLectura()) {
  const archivos = [];
  let pageToken;
  do {
    const respuesta = await drive.files.list({
      q: `'${carpetaId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    archivos.push(...(respuesta.data.files ?? []));
    pageToken = respuesta.data.nextPageToken ?? undefined;
  } while (pageToken);
  return archivos;
}

/**
 * Token de cambios (changes.getStartPageToken): a partir de él, changes.list devuelve solo lo nuevo.
 * Se pide ANTES de listar la carpeta, así un cambio hecho durante la sincronización no se pierde.
 */
export async function tokenInicialDeCambios(drive = clienteDriveSoloLectura()) {
  const respuesta = await drive.changes.getStartPageToken({ supportsAllDrives: true });
  return respuesta.data.startPageToken;
}

/**
 * Cambios desde un token (changes.list), con paginación. Incluye borrados (removed) y archivos en la papelera.
 * @returns {Promise<{cambios: Array, nuevoToken: string}>} nuevoToken se guarda para la siguiente sincronización
 */
export async function listarCambios(pageToken, drive = clienteDriveSoloLectura()) {
  const cambios = [];
  let token = pageToken;
  let nuevoToken = pageToken;
  do {
    const respuesta = await drive.changes.list({
      pageToken: token,
      spaces: 'drive',
      includeRemoved: true,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 100,
      fields: 'nextPageToken, newStartPageToken, changes(fileId, removed, file(id, name, mimeType, modifiedTime, trashed, parents))',
    });
    cambios.push(...(respuesta.data.changes ?? []));
    token = respuesta.data.nextPageToken ?? undefined;
    if (!token) nuevoToken = respuesta.data.newStartPageToken ?? nuevoToken;
  } while (token);
  return { cambios, nuevoToken };
}

/** Extrae el texto de un archivo según su tipo. */
export async function extraerTexto(archivo, drive = clienteDriveSoloLectura()) {
  if (archivo.mimeType === TIPO_DOC) {
    try {
      const r = await drive.files.export({ fileId: archivo.id, mimeType: 'text/markdown' }, { responseType: 'text' });
      return { texto: String(r.data), formato: 'markdown' };
    } catch {
      const r = await drive.files.export({ fileId: archivo.id, mimeType: 'text/plain' }, { responseType: 'text' });
      return { texto: String(r.data), formato: 'texto' };
    }
  }

  if (archivo.mimeType === TIPO_HOJA) {
    const r = await drive.files.export({ fileId: archivo.id, mimeType: 'text/csv' }, { responseType: 'text' });
    return { texto: String(r.data), formato: 'csv' };
  }

  if (archivo.mimeType === TIPO_PDF) {
    const r = await drive.files.get({ fileId: archivo.id, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
    const pdf = await pdfParse(Buffer.from(r.data));
    return { texto: pdf.text, formato: 'pdf' };
  }

  throw new Error(`Tipo de archivo no soportado: ${archivo.mimeType} (${archivo.name})`);
}

/**
 * Obtiene código y versión del nombre del archivo.
 * "POL-01 Vacaciones y feriados v2.1.pdf" -> { codigo: "POL-01", version: "2.1" }
 * "POL-CAL Calendario de feriados y pagos 2026" -> { codigo: "POL-CAL", version: null }
 */
export function metadatosDesdeNombre(nombre) {
  const sinExtension = nombre.replace(/\.pdf$/i, '');
  const codigo = sinExtension.match(/^(POL-CAL|POL-\d{2})\b/)?.[1] ?? null;
  const version = sinExtension.match(/\sv(\d+(?:\.\d+)?)\s*$/)?.[1] ?? null;
  return { codigo, version };
}
