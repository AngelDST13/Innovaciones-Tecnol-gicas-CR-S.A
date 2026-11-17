/**
 * Agente de políticas (RAG).
 *
 * Responde SOLO con los fragmentos recuperados de Drive. Si ningún fragmento supera el umbral
 * de similitud, dice que la política no está en los documentos y ofrece escalar a RRHH.
 * Cada respuesta cita documento y punto. Los datos marcados "por validar" se señalan como pendientes.
 *
 * Prompt versionado en docs/prompts/agente-politicas-rag-v1.md.
 */
import { clienteDeepSeek, modeloDeepSeek } from '../config/deepseek.js';
import { buscarFragmentos } from '../rag/recuperacion.js';

/**
 * Similitud mínima para considerar que un fragmento responde la pregunta.
 * Calibrado con multilingual-e5-small: las preguntas con respuesta en los documentos puntúan 0.85–0.92;
 * las que no tienen respuesta ("mascotas", "película") llegan hasta 0.82. Confirmar con el banco de 45 preguntas.
 */
export const UMBRAL_SIMILITUD = 0.84;

export const MENSAJE_NO_ENCONTRADO =
  'No encontré esa política en los documentos oficiales. Puedo derivar tu consulta a una persona de ' +
  'Recursos Humanos: ¿quieres que la escale? Escríbenos a recursoshumanos@innovacionescr.com.';

const PROMPT_POLITICAS = `Eres el asistente de políticas de RRHH de Innovaciones Tecnológicas CR S.A.
Responde ÚNICAMENTE con la información de los FRAGMENTOS que se te entregan. No uses conocimiento propio.

Reglas:
- Si los fragmentos no contienen la respuesta completa, dilo y ofrece derivar el caso a RRHH.
- Cita la fuente de cada afirmación con el formato [POL-XX, punto X.Y] (o [POL-XX, sección N] si no hay punto).
- Si un fragmento indica "pendiente de validación" o tiene un dato marcado "[Por validar...]", menciona que ese dato está pendiente de validación.
- No reveles datos personales de ningún colaborador.
- Responde en español, en un máximo de 6 frases.`;

function etiquetaFuente(f) {
  const seccion = f.seccion ? `sección ${f.seccion}${f.punto ? `, punto ${f.punto}` : ''}` : 'calendario';
  return `${f.codigo} · ${f.titulo} · ${seccion}`;
}

function contextoFragmentos(fragmentos) {
  return fragmentos
    .map((f, i) => {
      const nota = f.por_validar ? '\n(Nota: contiene datos pendientes de validación)' : '';
      return `[${i + 1}] ${etiquetaFuente(f)}\n${f.contenido}${nota}`;
    })
    .join('\n\n');
}

/**
 * @returns {Promise<{respuesta: string, documentos: Array, resuelta: boolean}>}
 */
export async function responderPolitica(pregunta) {
  const fragmentos = (await buscarFragmentos(pregunta)).filter((f) => f.similitud >= UMBRAL_SIMILITUD);
  if (fragmentos.length === 0) {
    return { respuesta: MENSAJE_NO_ENCONTRADO, documentos: [], resuelta: false };
  }

  let respuesta;
  try {
    const salida = await clienteDeepSeek.chat.completions.create({
      model: modeloDeepSeek,
      temperature: 0,
      messages: [
        { role: 'system', content: PROMPT_POLITICAS },
        { role: 'user', content: `FRAGMENTOS:\n\n${contextoFragmentos(fragmentos)}\n\nPREGUNTA:\n${pregunta}` },
      ],
    });
    respuesta = salida.choices[0]?.message?.content?.trim();
  } catch {
    return { respuesta: MENSAJE_NO_ENCONTRADO, documentos: [], resuelta: false };
  }
  if (!respuesta) {
    return { respuesta: MENSAJE_NO_ENCONTRADO, documentos: [], resuelta: false };
  }

  // Citas formales: una por documento y punto usado, con enlace a Drive
  const vistas = new Set();
  const documentos = [];
  for (const f of fragmentos) {
    const clave = `${f.codigo}|${f.punto ?? f.seccion ?? ''}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    documentos.push({
      documento: f.titulo, // ya incluye el código: "POL-01 Vacaciones y feriados v2.1"
      seccion: f.seccion ? `Sección ${f.seccion}${f.punto ? `, punto ${f.punto}` : ''}` : 'Calendario',
      enlace: f.enlace,
    });
  }
  return { respuesta, documentos, resuelta: true };
}
