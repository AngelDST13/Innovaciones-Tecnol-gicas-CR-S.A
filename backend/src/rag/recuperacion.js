/**
 * Búsqueda de fragmentos de política por similitud coseno (pgvector).
 */
import { query } from '../config/database.js';
import { aTextoVector, vectorizarPregunta } from './embeddings.js';

/** Fragmentos más parecidos a la pregunta, de documentos vigentes (no eliminados). */
export async function buscarFragmentos(pregunta, limite = 5) {
  const vector = aTextoVector(await vectorizarPregunta(pregunta));
  const { rows } = await query(
    `SELECT f.codigo, f.version, f.seccion, f.seccion_titulo, f.punto, f.contenido, f.por_validar,
            d.titulo, d.enlace,
            1 - (f.embedding <=> $1::vector) AS similitud
       FROM fragmentos_politica f
       JOIN documentos_politica d ON d.id = f.documento_id
      WHERE d.eliminado = FALSE
      ORDER BY f.embedding <=> $1::vector
      LIMIT $2`,
    [vector, limite],
  );
  return rows.map((r) => ({ ...r, similitud: Number(r.similitud) }));
}
