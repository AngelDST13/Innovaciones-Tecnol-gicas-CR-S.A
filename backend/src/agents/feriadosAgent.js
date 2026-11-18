/**
 * Agente de feriados (pregunta 20: "¿Qué feriados quedan este año?").
 * Lee las filas del calendario oficial (POL-CAL) de la base vectorial y filtra las fechas futuras.
 * Responde sin modelo: las fechas son datos del calendario, no una redacción.
 */
import { supabase } from '../config/database.js';
import { fechaCR } from '../utils/fechas.js';

/** Formato de cada fila del calendario: "2026-12-25 · feriado · Navidad · estado: confirmado". */
const PATRON_FILA = /^(\d{4}-\d{2}-\d{2}) · feriado · (.+?) · estado: (.+)$/;

const FORMATO_FECHA = { day: 'numeric', month: 'long', timeZone: 'UTC' };

function formatearFecha(fechaIso) {
  return new Date(`${fechaIso}T12:00:00Z`).toLocaleDateString('es-CR', FORMATO_FECHA);
}

/** Lee los feriados del calendario a partir de `hoy` (YYYY-MM-DD, hora de Costa Rica). */
export async function responderFeriados(hoy = fechaCR()) {
  const [filas, documentos] = await Promise.all([
    supabase.from('fragmentos_politica').select('contenido, documento_id').eq('codigo', 'POL-CAL').ilike('contenido', '%· feriado ·%'),
    supabase.from('documentos_politica').select('id, titulo, enlace').eq('eliminado', false),
  ]);
  if (filas.error) throw filas.error;
  if (documentos.error) throw documentos.error;

  // Solo filas de calendarios vigentes (un documento eliminado no cuenta)
  const vigentes = new Map(documentos.data.map((d) => [d.id, d]));
  const delCalendario = filas.data.filter((f) => vigentes.has(f.documento_id));
  const documento = vigentes.get(delCalendario[0]?.documento_id);
  const cita = {
    documento: documento?.titulo ?? 'POL-CAL Calendario de feriados y pagos 2026',
    seccion: 'Calendario',
    enlace: documento?.enlace ?? null,
  };

  const proximos = delCalendario
    .map((f) => PATRON_FILA.exec(f.contenido))
    .filter((m) => m && m[1] >= hoy)
    .sort((a, b) => (a[1] < b[1] ? -1 : 1));

  if (proximos.length === 0) {
    return { respuesta: 'No quedan feriados en el calendario de este año.', citas: [cita], resuelta: true };
  }

  const lineas = proximos.map(([, fecha, nombre, estado]) => {
    const pendiente = estado.toLowerCase().includes('validar') ? ' (pendiente de validar)' : '';
    return `- ${formatearFecha(fecha)}: ${nombre}${pendiente}`;
  });
  return {
    respuesta: `Los feriados que quedan este año son:\n${lineas.join('\n')}\n\nFuente: calendario oficial de feriados.`,
    citas: [cita],
    resuelta: true,
  };
}
