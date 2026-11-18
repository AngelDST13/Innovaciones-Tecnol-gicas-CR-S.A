/**
 * Genera el reporte diario de hoy (hora de Costa Rica) sin levantar el servidor.
 * Pensado para el programador del sistema (Programador de tareas de Windows, cron o similar) a las 7:00 a. m.
 * Si el reporte de hoy ya existe, no lo vuelve a generar.
 * Uso (desde backend/):  npm run reporte:diario
 */
import 'dotenv/config';
import { fechaHoyCR, generarReporteDelDia } from '../src/jobs/generarReporte.js';
import { existeReporte } from '../src/services/reportesService.js';

const hoy = fechaHoyCR();
if (await existeReporte(hoy)) {
  console.log(`El reporte de ${hoy} ya existe; no se generó de nuevo.`);
} else {
  const reporte = await generarReporteDelDia(hoy);
  console.log(`Reporte de ${hoy} generado (id ${reporte.id}).`);
}
process.exit(0);
