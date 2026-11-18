/**
 * Agente de pagos y calendario (pregunta 9: "¿Qué día cae mi próximo pago?").
 * Responde desde la tabla calendario_pagos. No usa el modelo: la fecha es un dato, no una redacción.
 */
import { supabase } from '../config/database.js';
import { fechaCR } from '../utils/fechas.js';

const FORMATO_FECHA = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Costa_Rica' };

export function formatearFecha(fechaIso) {
  return new Date(`${fechaIso}T12:00:00-06:00`).toLocaleDateString('es-CR', FORMATO_FECHA);
}

export async function responderPagos(hoy = fechaCR()) {
  const { data, error } = await supabase
    .from('calendario_pagos')
    .select('fecha_pago, tipo, descripcion')
    .gte('fecha_pago', hoy)
    .order('fecha_pago', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  const cita = { documento: 'POL-05 Remuneración y pagos v2.0', seccion: 'Sección 1, punto 1.1', enlace: null };
  if (!data) {
    return { respuesta: 'No hay un pago programado en el calendario a partir de hoy.', citas: [cita], resuelta: true };
  }
  return {
    respuesta: `Tu próximo pago es el ${formatearFecha(data.fecha_pago)}: ${data.descripcion}.`,
    citas: [cita],
    resuelta: true,
  };
}
