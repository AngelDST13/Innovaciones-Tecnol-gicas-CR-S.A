/**
 * Agregados de RRHH (pregunta 25: "¿Cuántas personas están de vacaciones hoy?").
 * Solo para el rol rrhh: entrega conteos, nunca nombres ni datos individuales.
 * Las cifras salen de las mismas métricas del reporte diario, así el chat y el reporte coinciden.
 */
import { obtenerMetricasDelDia } from '../services/reportesService.js';
import { fechaCR } from '../utils/fechas.js';

export const PATRON_AGREGADO_AUSENCIAS =
  /\bcu[aá]ntas?\s+personas\b.*\b(vacaciones|ausentes|ausencias|incapacitad\w*|permisos?|licencias?)\b|\bcu[aá]ntos?\s+(colaboradores|empleados)\b.*\b(vacaciones|ausentes|ausencias|incapacitad\w*|permisos?|licencias?)\b/i;

const plural = (n, singular, plurales) => `${n} ${n === 1 ? singular : plurales}`;

export async function responderAgregadoAusencias(hoy = fechaCR()) {
  const metricas = await obtenerMetricasDelDia(hoy);
  const { vacaciones, permiso, licencia, incapacidad } = metricas.ausentes_hoy.por_tipo;

  const otras = [
    permiso && `${permiso} con permiso`,
    licencia && `${licencia} con licencia`,
    incapacidad && `${incapacidad} con incapacidad activa`,
  ].filter(Boolean);
  const detalle = otras.length ? ` Además hay ${otras.join(', ')}.` : '';

  return {
    respuesta: `Hoy (${hoy}) ${plural(vacaciones, 'persona está', 'personas están')} de vacaciones aprobadas.${detalle}`,
    citas: [],
    resuelta: true,
  };
}
