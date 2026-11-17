/**
 * Verifica que la cuenta de servicio ve exactamente los 11 documentos de política en la carpeta.
 * Uso (desde backend/):  npm run drive:verify
 *
 * Solo lectura. Si la API responde 403 o 404, muestra el mensaje exacto y termina.
 */
import 'dotenv/config';
import { clienteDriveSoloLectura, listarCarpeta, rutaLlave } from '../src/drive/conector.js';

const CARPETA = process.env.DRIVE_FOLDER_ID;
if (!CARPETA) {
  console.error('Falta DRIVE_FOLDER_ID en backend/.env');
  process.exit(1);
}

const ESPERADOS = [
  { nombre: 'POL-01 Vacaciones y feriados v2.1.pdf', formato: 'PDF', id: '1IMmOkpYcLfFw4FhDORz4ATjLTchwC95o' },
  { nombre: 'POL-02 Permisos y licencias v1.4', formato: 'Google Doc', id: '1PC-JTbZhi_RrWVMKZINBfS1gaspHeYs36p6N77OKFTg' },
  { nombre: 'POL-03 Incapacidades v1.2', formato: 'Google Doc', id: '1BCKBwHElBzZz4a9IkRC_x96HMfSC3U1aJ13OCZBOcIo' },
  { nombre: 'POL-04 Jornada y asistencia v1.3.pdf', formato: 'PDF', id: '1B_o6F0sM6zVVrxY9ARR50fHafQvR1MO8' },
  { nombre: 'POL-05 Remuneración y pagos v2.0', formato: 'Google Doc', id: '1so5QujLykAzQEUOCAlBFIQwHmcDA7x7HEbcE9Zt0kx0' },
  { nombre: 'POL-06 Beneficios v1.1.pdf', formato: 'PDF', id: '1usnriUASEs3vx65Sq-hXKME44teWxrey' },
  { nombre: 'POL-07 Ingreso y salida v1.2', formato: 'Google Doc', id: '1w_eoVdWgKrItgUidC15xJbbWFfS1oB7lclUj_EsXhjs' },
  { nombre: 'POL-08 Desempeño y carrera v1.0', formato: 'Google Doc', id: '1872tThuFsLuqlDSQw-SKiX9yeY-F-xVS3rXbczZK6_s' },
  { nombre: 'POL-09 Conducta y convivencia v1.1', formato: 'Google Doc', id: '1s8TeCkwpwFbjXz0AxRdRwDDM6ky1KDOODGieJOGbUUc' },
  { nombre: 'POL-10 Datos y privacidad v1.0', formato: 'Google Doc', id: '1AiyEGZVZ3XX2fEEWPR9s4rFDx8A4V1circA8rSKjZi8' },
  { nombre: 'POL-CAL Calendario de feriados y pagos 2026', formato: 'Google Sheets', id: '1OE-D3EULn2dmRcu_zMC_TX6ZJSyYg7CfngbTKPcxe3o' },
];

try {
  rutaLlave();
  const drive = clienteDriveSoloLectura();
  const encontrados = await listarCarpeta(CARPETA, drive);
  const porId = new Map(encontrados.map((a) => [a.id, a]));

  let faltan = 0;
  for (const esperado of ESPERADOS) {
    const hallado = porId.get(esperado.id);
    if (hallado) {
      console.log(`OK     ${esperado.nombre}`);
    } else {
      faltan += 1;
      console.log(`FALTA  ${esperado.nombre} (${esperado.id})`);
    }
  }
  const extra = encontrados.filter((a) => !ESPERADOS.some((e) => e.id === a.id));
  for (const a of extra) console.log(`EXTRA  ${a.name} (${a.id})`);

  console.log(`\nEsperados: ${ESPERADOS.length} · Encontrados: ${ESPERADOS.length - faltan} · Extra: ${extra.length}`);
  process.exitCode = faltan === 0 && extra.length === 0 ? 0 : 1;
} catch (error) {
  const codigo = error?.code ?? error?.response?.status;
  console.error(`ERROR${codigo ? ` ${codigo}` : ''}: ${error.message}`);
  if (codigo === 403 || codigo === 404) {
    console.error('Revisa que la carpeta esté compartida con la cuenta de servicio (Lector) y que la Drive API esté habilitada.');
  }
  process.exitCode = 1;
}
