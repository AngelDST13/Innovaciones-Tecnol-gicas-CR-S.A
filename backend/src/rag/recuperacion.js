/**
 * Búsqueda de fragmentos de política por similitud coseno.
 * La consulta vectorial vive en la base (función buscar_fragmentos_politica, migración 004);
 * aquí solo se llama por RPC.
 */
import { supabase } from '../config/database.js';
import { aTextoVector, vectorizarPregunta } from './embeddings.js';

/** Fragmentos más parecidos a la pregunta, de documentos vigentes (no eliminados). */
export async function buscarFragmentos(pregunta, limite = 5) {
  const vector = aTextoVector(await vectorizarPregunta(pregunta));
  const { data, error } = await supabase.rpc('buscar_fragmentos_politica', { consulta: vector, cantidad: limite });
  if (error) throw error;
  return data.map((r) => ({ ...r, similitud: Number(r.similitud) }));
}
