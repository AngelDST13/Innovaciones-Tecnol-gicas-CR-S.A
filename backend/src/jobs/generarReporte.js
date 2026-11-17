/**
 * Genera y guarda el reporte diario. Lo usan el botón del dashboard y el programador automático.
 * Flujo: métricas por SQL -> resumen del analista (con verificación de cifras) -> persistencia.
 */
import { generarResumenEjecutivo } from '../agents/analistaAgent.js';
import { guardarReporte, obtenerMetricasDelDia } from '../services/reportesService.js';

const ZONA_CR = 'America/Costa_Rica';

/** Fecha de hoy en Costa Rica (YYYY-MM-DD). */
export function fechaHoyCR(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_CR }).format(ahora);
}

export async function generarReporteDelDia(fecha = fechaHoyCR()) {
  const metricas = await obtenerMetricasDelDia(fecha);
  const { resumen_texto, generado_por } = await generarResumenEjecutivo(metricas);
  return guardarReporte({
    fecha,
    datos: metricas,
    resumenTexto: resumen_texto,
    generadoPor: generado_por,
  });
}
