/**
 * Programador del reporte diario a las 7:00 a. m. (hora de Costa Rica).
 *
 * Costa Rica usa UTC-6 todo el año (sin horario de verano), así que la hora UTC es fija.
 * Tres mecanismos, para que el reporte del día no dependa de que el proceso esté encendido a las 7:00:
 *   1. iniciarProgramadorReporte: temporizador dentro del proceso (corre mientras el backend esté arriba).
 *   2. ponerseAlDia: al arrancar, si ya pasaron las 7:00 y no existe el reporte de hoy, lo genera.
 *   3. POST /api/v1/reportes/automatico (X-Token-Cron) y `npm run reporte:diario`, para un programador externo.
 */
import { fechaHoyCR, generarReporteDelDia } from './generarReporte.js';

const HORA_CR = 7;
const DESPLAZAMIENTO_CR_UTC = 6; // UTC-6
const ZONA_CR = 'America/Costa_Rica';

/** Hora (0-23) en Costa Rica de un instante. */
export function horaCR(ahora = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: ZONA_CR, hour: 'numeric', hourCycle: 'h23' }).format(ahora));
}

/**
 * Genera el reporte de hoy si ya pasaron las 7:00 y no existe. Pensado para el arranque del backend.
 * @returns {Promise<boolean>} true si lo generó
 */
export async function ponerseAlDia({
  existeReporte,
  ejecutar = () => generarReporteDelDia(fechaHoyCR()),
  ahora = new Date(),
  registrar = console,
} = {}) {
  if (horaCR(ahora) < HORA_CR) return false;
  if (await existeReporte(fechaHoyCR(ahora))) return false;
  await ejecutar();
  registrar.info(`Reporte de ${fechaHoyCR(ahora)} generado al arrancar (el programador de las 7:00 no se ejecutó).`);
  return true;
}

/** Milisegundos hasta la próxima ejecución de las 7:00 CR. */
export function milisegundosHastaProximaEjecucion(ahora = new Date()) {
  const proxima = new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), HORA_CR + DESPLAZAMIENTO_CR_UTC),
  );
  if (proxima <= ahora) proxima.setUTCDate(proxima.getUTCDate() + 1);
  return proxima - ahora;
}

/**
 * Inicia el programador. Devuelve una función para detenerlo.
 * `ejecutar` se inyecta para poder probarlo sin esperar a las 7:00.
 */
export function iniciarProgramadorReporte({ ejecutar = () => generarReporteDelDia(fechaHoyCR()), registrar = console } = {}) {
  let temporizador = null;
  let detenido = false;

  const programar = () => {
    if (detenido) return;
    temporizador = setTimeout(async () => {
      try {
        await ejecutar();
        registrar.info(`Reporte diario generado (${fechaHoyCR()})`);
      } catch (error) {
        registrar.error('Fallo el reporte diario automático:', error.message);
      } finally {
        programar();
      }
    }, milisegundosHastaProximaEjecucion());
    temporizador.unref?.();
  };

  programar();
  return () => {
    detenido = true;
    clearTimeout(temporizador);
  };
}
