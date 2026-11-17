/**
 * Prueba de ingesta: extrae el texto de los documentos de Drive y los fragmenta.
 * No escribe en la base de datos ni en Drive. Uso (desde backend/): node scripts/drive-ingesta-prueba.js
 */
import 'dotenv/config';
import { clienteDriveSoloLectura, extraerTexto, listarCarpeta, metadatosDesdeNombre } from '../src/drive/conector.js';
import { fragmentosCalendario, fragmentosPolitica } from '../src/rag/fragmentador.js';

const drive = clienteDriveSoloLectura();
const archivos = await listarCarpeta(process.env.DRIVE_FOLDER_ID, drive);

let total = 0;
for (const archivo of archivos.sort((a, b) => a.name.localeCompare(b.name))) {
  const { codigo, version } = metadatosDesdeNombre(archivo.name);
  const { texto, formato } = await extraerTexto(archivo, drive);
  const base = { codigo, version, drive_file_id: archivo.id, nombre: archivo.name, modificado: archivo.modifiedTime };
  const fragmentos = codigo === 'POL-CAL' ? fragmentosCalendario(texto, base) : fragmentosPolitica(texto, base);
  total += fragmentos.length;
  const porValidar = fragmentos.filter((f) => f.por_validar).length;
  console.log(
    `${(codigo ?? '?').padEnd(8)} v${(version ?? '-').padEnd(4)} ${formato.padEnd(8)} ` +
      `${String(texto.length).padStart(6)} car. · ${String(fragmentos.length).padStart(3)} fragmentos · ${porValidar} con "por validar"`,
  );
}
console.log(`\nTotal de fragmentos: ${total}`);
