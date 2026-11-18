/**
 * Agente de escalamiento: crea un ticket para RRHH cuando la pregunta no tiene respuesta en los documentos.
 * Tabla tickets_escalamiento (migración 005).
 */
import { supabase } from '../config/database.js';

export const MOTIVOS = Object.freeze({
  SIN_RESPUESTA: 'sin_respuesta_en_documentos',
  SOLICITUD: 'solicitud_del_colaborador',
});

export async function crearTicket({ colaboradorId, pregunta, motivo = MOTIVOS.SIN_RESPUESTA }) {
  const { data, error } = await supabase
    .from('tickets_escalamiento')
    .insert({ colaborador_id: colaboradorId, pregunta, motivo, estado: 'abierto' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}
