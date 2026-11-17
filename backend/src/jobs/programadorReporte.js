/**
 * Programador del reporte diario a las 7:00 a. m. (hora de Costa Rica).
 *
 * Costa Rica usa UTC-6 todo el año (sin horario de verano), así que la hora UTC es fija.
 * Usa setTimeout en lugar de un cron externo: el proceso del backend debe estar encendido.
 * Para un despliegue serio conviene un scheduler externo (Cloud Scheduler, n8n o cron del sistema).
 */
import { fechaHoyCR, generarReporteDelDia } from './generarReporte.js';

const HORA_CR = 7;
const DESPLAZAMIENTO_CR_UTC = 6; // UTC-6

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
