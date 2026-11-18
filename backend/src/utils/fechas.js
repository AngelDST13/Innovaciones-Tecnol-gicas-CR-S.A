/**
 * Fechas en hora de Costa Rica (UTC-6, sin horario de verano).
 * Toda la lógica de "hoy", "mes" y "últimos N días" se calcula con estas funciones.
 */
const ZONA = 'America/Costa_Rica';
const FORMATO = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA });

/** Fecha YYYY-MM-DD en Costa Rica para un instante dado. */
export function fechaCR(instante = new Date()) {
  return FORMATO.format(instante);
}

/** Fecha YYYY-MM-DD desplazada `dias` respecto a `base` (en Costa Rica). */
export function desplazarFecha(fecha, dias) {
  const [a, m, d] = fecha.split('-').map(Number);
  const utc = new Date(Date.UTC(a, m - 1, d + dias));
  return utc.toISOString().slice(0, 10);
}

/** Inicio de un día (YYYY-MM-DD) en Costa Rica, como ISO con desfase -06:00. */
export function inicioDiaCR(fecha) {
  return `${fecha}T00:00:00-06:00`;
}

/** Primer día del mes de `fecha` (YYYY-MM-DD). */
export function inicioMes(fecha) {
  return `${fecha.slice(0, 7)}-01`;
}

/** Día (YYYY-MM-DD) en Costa Rica de un timestamp de la base. */
export function diaCR(timestamp) {
  return fechaCR(new Date(timestamp));
}
