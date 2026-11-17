/**
 * Agente de Datos del colaborador.
 *
 * Seguridad: las consultas SQL son fijas y parametrizadas, y todas filtran por el id del
 * usuario autenticado (nunca por un id que llegue en el mensaje). El modelo no genera SQL.
 * Solo recibe los datos de ese usuario y debe responder usando únicamente esos datos.
 */
import { queryLectura as query } from '../config/database.js';
import { clienteDeepSeek, modeloDeepSeek } from '../config/deepseek.js';

export class DatosNoDisponibles extends Error {}

async function obtenerDatosDelColaborador(colaboradorId) {
  const [saldos, solicitudes, incapacidades] = await Promise.all([
    query(
      `SELECT periodo, dias_asignados, dias_tomados, dias_disponibles
         FROM saldos_vacaciones
        WHERE colaborador_id = $1
        ORDER BY periodo DESC`,
      [colaboradorId],
    ),
    query(
      `SELECT tipo::text AS tipo, fecha_inicio, fecha_fin, estado::text AS estado
         FROM solicitudes
        WHERE colaborador_id = $1
        ORDER BY creada_en DESC
        LIMIT 10`,
      [colaboradorId],
    ),
    query(
      `SELECT tipo::text AS tipo, fecha_inicio, dias, entidad
         FROM incapacidades
        WHERE colaborador_id = $1
        ORDER BY fecha_inicio DESC
        LIMIT 10`,
      [colaboradorId],
    ),
  ]);

  return {
    saldos_vacaciones: saldos.rows.map((fila) => ({
      periodo: fila.periodo,
      dias_asignados: Number(fila.dias_asignados),
      dias_tomados: Number(fila.dias_tomados),
      dias_disponibles: Number(fila.dias_disponibles),
    })),
    solicitudes: solicitudes.rows,
    incapacidades: incapacidades.rows,
  };
}

const PROMPT_DATOS = `Eres el asistente de RRHH de Innovaciones Tecnológicas CR S.A.
Responde la pregunta del colaborador usando EXCLUSIVAMENTE el JSON de sus datos que se te entrega.
Si la respuesta no está en esos datos, dilo explícitamente; no inventes cifras ni fechas.
Responde en español, de forma breve y clara.`;

export async function consultarDatosPersonales(colaboradorId, pregunta) {
  const datos = await obtenerDatosDelColaborador(colaboradorId);

  let respuesta;
  try {
    respuesta = await clienteDeepSeek.chat.completions.create({
      model: modeloDeepSeek,
      temperature: 0,
      messages: [
        { role: 'system', content: PROMPT_DATOS },
        {
          role: 'user',
          content: `Datos del colaborador (JSON):\n${JSON.stringify(datos)}\n\nPregunta:\n${pregunta}`,
        },
      ],
    });
  } catch (error) {
    throw new DatosNoDisponibles(error.message);
  }

  return respuesta.choices[0]?.message?.content?.trim() || 'No pude generar una respuesta con tus datos.';
}
