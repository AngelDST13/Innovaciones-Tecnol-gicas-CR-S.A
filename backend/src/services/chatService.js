/** Persistencia y consulta de las conversaciones del chat (tabla consultas_chat). */
import { query } from '../config/database.js';

const LIMITE_HISTORIAL = 50;

export async function registrarConsulta({ colaboradorId, pregunta, resultado, latenciaMs }) {
  const { rows } = await query(
    `INSERT INTO consultas_chat
         (colaborador_id, pregunta, intencion, agente, resuelta, escalada, latencia_ms, documentos_citados)
       VALUES ($1, $2, $3::intencion_consulta, $4::agente_consulta, $5, FALSE, $6, $7::jsonb)
    RETURNING id`,
    [
      colaboradorId,
      pregunta,
      resultado.intencion,
      resultado.agente,
      resultado.resuelta,
      latenciaMs,
      JSON.stringify(resultado.citas ?? []),
    ],
  );
  return rows[0].id;
}

export async function obtenerHistorial(colaboradorId) {
  const { rows } = await query(
    `SELECT id, pregunta, intencion::text AS intencion, agente::text AS agente,
            resuelta, latencia_ms, fecha
       FROM consultas_chat
      WHERE colaborador_id = $1
      ORDER BY fecha DESC
      LIMIT $2`,
    [colaboradorId, LIMITE_HISTORIAL],
  );
  return rows;
}
