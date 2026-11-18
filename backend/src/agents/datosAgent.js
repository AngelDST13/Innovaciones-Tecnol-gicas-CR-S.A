/**
 * Agente de Datos del colaborador.
 *
 * Seguridad: solo lee (select) y cada consulta filtra por el id del usuario autenticado; nunca por un id
 * que llegue en el mensaje. El modelo no genera consultas: recibe los datos de ese usuario y debe
 * responder solo con ellos.
 */
import { supabase } from '../config/database.js';
import { clienteDeepSeek, modeloDeepSeek } from '../config/deepseek.js';

export class DatosNoDisponibles extends Error {}

async function leerDatos(colaboradorId) {
  const [saldos, solicitudes, incapacidades] = await Promise.all([
    supabase
      .from('saldos_vacaciones')
      .select('periodo, dias_asignados, dias_tomados, dias_disponibles')
      .eq('colaborador_id', colaboradorId)
      .order('periodo', { ascending: false }),
    supabase
      .from('solicitudes')
      .select('tipo, fecha_inicio, fecha_fin, estado')
      .eq('colaborador_id', colaboradorId)
      .order('creada_en', { ascending: false })
      .limit(10),
    supabase
      .from('incapacidades')
      .select('tipo, fecha_inicio, dias, entidad')
      .eq('colaborador_id', colaboradorId)
      .order('fecha_inicio', { ascending: false })
      .limit(10),
  ]);
  for (const resultado of [saldos, solicitudes, incapacidades]) {
    if (resultado.error) throw resultado.error;
  }

  return {
    saldos_vacaciones: saldos.data.map((s) => ({
      periodo: s.periodo,
      dias_asignados: Number(s.dias_asignados),
      dias_tomados: Number(s.dias_tomados),
      dias_disponibles: Number(s.dias_disponibles),
    })),
    solicitudes: solicitudes.data,
    incapacidades: incapacidades.data,
  };
}

const PROMPT_DATOS = `Eres el asistente de RRHH de Innovaciones Tecnológicas CR S.A.
Responde la pregunta del colaborador usando EXCLUSIVAMENTE el JSON de sus datos que se te entrega.
Si la respuesta no está en esos datos, dilo explícitamente; no inventes cifras ni fechas.
Responde en español, de forma breve y clara.`;

export async function consultarDatosPersonales(colaboradorId, pregunta) {
  const datos = await leerDatos(colaboradorId);

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
