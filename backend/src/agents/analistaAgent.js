/**
 * Agente Analista de reportes.
 *
 * Las métricas llegan ya calculadas desde la base de datos. El modelo solo redacta el resumen.
 * Si el resumen contiene una cifra que no está en las métricas, se descarta y se usa una plantilla
 * determinista: así el reporte nunca publica números inventados.
 */
import { clienteDeepSeek, modeloDeepSeek } from '../config/deepseek.js';

const PROMPT_ANALISTA = `Eres el analista de RRHH de Innovaciones Tecnológicas CR S.A.
Redacta un resumen ejecutivo de 3 a 5 frases en español, a partir del JSON de métricas que recibes.

Significado exacto de los campos (no los reinterpretes):
- ausentes_hoy.total: personas ausentes hoy por vacaciones, permiso, licencia o incapacidad.
- solicitudes.pendientes_mas_3_dias: solicitudes pendientes con más de 3 días sin respuesta.
- incapacidades.activas: incapacidades vigentes hoy. dias_acumulados_mes: días de incapacidad del mes.
- colaboradores_mas_20_dias: saldos de vacaciones DISPONIBLES mayores a 20 días (riesgo de pasivo). NO son ausencias.
- tasa_rotacion_30d: porcentaje de salidas de los últimos 30 días.
- chat_dia_anterior: consultas del chat del día anterior, con su porcentaje resuelto sin escalar.

Reglas estrictas:
- Usa únicamente las cifras que aparecen en el JSON. No calcules, no redondees y no inventes cifras.
- No menciones fechas ni cifras que no estén en el JSON.
- Destaca lo que requiere atención de RRHH (solicitudes pendientes, incapacidades, rotación, riesgo de pasivo).
- Responde solo con el texto del resumen, sin títulos ni encabezados.`;

/** Números que aparecen en el texto (enteros o decimales, con punto o coma). */
function extraerCifras(texto) {
  return texto.match(/\d+(?:[.,]\d+)?/g) ?? [];
}

/** Conjunto de cifras permitidas: las que aparecen en las métricas y en la fecha del reporte. */
function cifrasPermitidas(metricas) {
  const fuente = `${JSON.stringify(metricas)} ${metricas.fecha.split('-').join(' ')}`;
  return new Set(extraerCifras(fuente).map((cifra) => cifra.replace(',', '.')));
}

export function cifrasVerificadas(texto, metricas) {
  const permitidas = cifrasPermitidas(metricas);
  return extraerCifras(texto).every((cifra) => permitidas.has(cifra.replace(',', '.')));
}

export function resumenDeterministico(m) {
  const ausentes = m.ausentes_hoy?.total ?? '—';
  const pendientesViejas = m.solicitudes?.pendientes_mas_3_dias ?? '—';
  const chat = m.chat_dia_anterior;
  const frase =
    `Hoy hay ${ausentes} personas ausentes. ` +
    `Hay ${m.solicitudes_pendientes} solicitudes pendientes de aprobación, ${pendientesViejas} de ellas sin respuesta hace más de 3 días. ` +
    `Hay ${m.incapacidades_activas} incapacidades activas. ` +
    `La rotación de los últimos ${m.ventana_rotacion_dias} días es de ${m.tasa_rotacion_30d}%.`;
  const chatFrase = chat
    ? ` El chat tuvo ${chat.consultas} consultas el día anterior, con ${chat.pct_resuelto_sin_escalar}% resueltas sin escalar.`
    : ` El chat registró ${m.consultas_chat_dia} consultas.`;
  return frase + chatFrase;
}

/** @returns {Promise<{resumen_texto: string, generado_por: string}>} */
export async function generarResumenEjecutivo(metricas) {
  try {
    const respuesta = await clienteDeepSeek.chat.completions.create({
      model: modeloDeepSeek,
      temperature: 0,
      messages: [
        { role: 'system', content: PROMPT_ANALISTA },
        { role: 'user', content: JSON.stringify(metricas) },
      ],
    });
    const texto = respuesta.choices[0]?.message?.content?.trim() ?? '';
    if (texto && cifrasVerificadas(texto, metricas)) {
      return { resumen_texto: texto, generado_por: 'agente_analista' };
    }
    console.warn('Resumen del analista descartado: contenía cifras no verificables.');
  } catch (error) {
    console.error('Fallo del analista con DeepSeek, se usa plantilla:', error.message);
  }
  return { resumen_texto: resumenDeterministico(metricas), generado_por: 'plantilla_determinista' };
}
