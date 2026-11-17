/**
 * Embeddings locales con Xenova/multilingual-e5-small (384 dimensiones).
 * El modelo se descarga una vez y se reutiliza en el proceso. No requiere clave ni tiene costo por uso.
 *
 * El modelo E5 espera prefijos: "passage: " para los fragmentos y "query: " para las preguntas.
 */
import { pipeline } from '@huggingface/transformers';

export const MODELO_EMBEDDINGS = 'Xenova/multilingual-e5-small';
export const DIMENSIONES = 384;

let extractor = null;

async function obtenerExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', MODELO_EMBEDDINGS, { dtype: 'q8' });
  }
  return extractor;
}

async function vectorizar(textos) {
  const modelo = await obtenerExtractor();
  const salida = await modelo(textos, { pooling: 'mean', normalize: true });
  const datos = Array.from(salida.data);
  return textos.map((_, i) => datos.slice(i * DIMENSIONES, (i + 1) * DIMENSIONES));
}

/** Vectores para fragmentos de política (prefijo "passage: "). */
export function vectorizarFragmentos(textos) {
  return vectorizar(textos.map((t) => `passage: ${t}`));
}

/** Vector para una pregunta (prefijo "query: "). */
export async function vectorizarPregunta(pregunta) {
  const [vector] = await vectorizar([`query: ${pregunta}`]);
  return vector;
}

/** Formato de pgvector: "[0.1,0.2,...]". */
export function aTextoVector(vector) {
  return `[${vector.join(',')}]`;
}
