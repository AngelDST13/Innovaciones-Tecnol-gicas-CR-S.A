/** Persistencia y consulta de las conversaciones del chat (tabla consultas_chat). */
import { supabase } from '../config/database.js';

const LIMITE_HISTORIAL = 50;

export async function registrarConsulta({ colaboradorId, pregunta, resultado, latenciaMs }) {
  const { data, error } = await supabase
    .from('consultas_chat')
    .insert({
      colaborador_id: colaboradorId,
      pregunta,
      intencion: resultado.intencion,
      agente: resultado.agente,
      resuelta: resultado.resuelta,
      escalada: false,
      latencia_ms: latenciaMs,
      documentos_citados: resultado.citas ?? [],
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function obtenerHistorial(colaboradorId) {
  const { data, error } = await supabase
    .from('consultas_chat')
    .select('id, pregunta, intencion, agente, resuelta, latencia_ms, fecha')
    .eq('colaborador_id', colaboradorId)
    .order('fecha', { ascending: false })
    .limit(LIMITE_HISTORIAL);
  if (error) throw error;
  return data;
}
