/**
 * Reformulación de la pregunta en el lenguaje formal de las políticas (una llamada a DeepSeek).
 *
 * Las preguntas coloquiales ("¿cuánto tiene RRHH para resolver una denuncia?") no siempre se parecen
 * al texto de la política ("plazo máximo de la investigación"). La versión reformulada se busca
 * junto con la original y el RAG conserva la mejor similitud de cada fragmento.
 * Si el modelo falla o no responde, se usa solo la pregunta original.
 */
import { clienteDeepSeek, modeloDeepSeek } from '../config/deepseek.js';

const PROMPT_REFORMULACION = `Reescribe la pregunta del colaborador como una sola frase en el lenguaje formal de las
políticas de Recursos Humanos de una empresa costarricense (vacaciones, permisos, incapacidades, salarios,
conducta, desempeño, datos personales). Usa los términos que aparecerían en el reglamento.
Responde solo con la frase reescrita, sin comillas ni explicaciones.`;

/** @returns {Promise<string|null>} la pregunta reformulada, o null si no se pudo reformular */
export async function reformularConsulta(pregunta) {
  try {
    const salida = await clienteDeepSeek.chat.completions.create({
      model: modeloDeepSeek,
      temperature: 0,
      max_tokens: 80,
      messages: [
        { role: 'system', content: PROMPT_REFORMULACION },
        { role: 'user', content: pregunta },
      ],
    });
    const texto = salida.choices[0]?.message?.content?.trim();
    return texto && texto.length <= 300 ? texto : null;
  } catch {
    return null;
  }
}
