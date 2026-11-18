/**
 * Búsqueda de fragmentos de política por similitud coseno.
 * La consulta vectorial vive en la base (función buscar_fragmentos_politica, migración 004);
 * aquí solo se llama por RPC.
 *
 * Se buscan dos versiones de la pregunta: la original y una reformulación en lenguaje de política.
 * Cada fragmento conserva la mayor similitud obtenida entre ambas búsquedas.
 */
import { supabase } from '../config/database.js';
import { aTextoVector, vectorizarPregunta } from './embeddings.js';
import { reformularConsulta } from './reformulacion.js';

/** Candidatos por cada versión de la pregunta; el agente aplica el umbral sobre ellos. */
const CANDIDATOS_POR_CONSULTA = 8;

async function buscarPorVector(texto) {
  const vector = aTextoVector(await vectorizarPregunta(texto));
  const { data, error } = await supabase.rpc('buscar_fragmentos_politica', {
    consulta: vector,
    cantidad: CANDIDATOS_POR_CONSULTA,
  });
  if (error) throw error;
  return data.map((r) => ({ ...r, similitud: Number(r.similitud) }));
}

/** Fragmentos más parecidos a la pregunta, de documentos vigentes (no eliminados). */
export async function buscarFragmentos(pregunta, limite = 5) {
  const reformulada = await reformularConsulta(pregunta);
  const consultas = [pregunta, reformulada].filter((texto, i, lista) => texto && lista.indexOf(texto) === i);

  const mejorPorFragmento = new Map();
  for (const texto of consultas) {
    for (const fragmento of await buscarPorVector(texto)) {
      const clave = `${fragmento.codigo}|${fragmento.seccion}|${fragmento.punto}|${fragmento.contenido}`;
      const previo = mejorPorFragmento.get(clave);
      if (!previo || fragmento.similitud > previo.similitud) mejorPorFragmento.set(clave, fragmento);
    }
  }

  return [...mejorPorFragmento.values()]
    .sort((a, b) => b.similitud - a.similitud)
    .slice(0, limite);
}
