/**
 * Agente de desempeño (pregunta 17: "¿Cuándo es mi próxima evaluación de desempeño?").
 * Solo lee las evaluaciones del propio colaborador (filtro por id autenticado).
 */
import { supabase } from '../config/database.js';
import { fechaCR } from '../utils/fechas.js';
import { formatearFecha } from './pagosAgent.js';

export async function responderDesempeno(colaboradorId, hoy = fechaCR()) {
  const { data, error } = await supabase
    .from('evaluaciones_desempeno')
    .select('fecha_programada, estado')
    .eq('colaborador_id', colaboradorId)
    .eq('estado', 'programada')
    .gte('fecha_programada', hoy)
    .order('fecha_programada', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  const cita = { documento: 'POL-08 Desempeño y carrera v1.0', seccion: 'Sección 1, punto 1.1', enlace: null };
  if (!data) {
    return {
      respuesta: 'No tienes una evaluación de desempeño programada a partir de hoy. Si crees que debería existir, escribe a Recursos Humanos.',
      citas: [cita],
      resuelta: true,
    };
  }
  return {
    respuesta: `Tu próxima evaluación de desempeño está programada para el ${formatearFecha(data.fecha_programada)}.`,
    citas: [cita],
    resuelta: true,
  };
}
