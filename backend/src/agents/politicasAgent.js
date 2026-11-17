/**
 * Agente de Políticas (RAG).
 *
 * PENDIENTE: la base vectorial de documentos de política aún no existe.
 * Mientras tanto no responde con conocimiento propio del modelo: devuelve un estado no resuelto,
 * para que el chat no invente políticas ni citas formales.
 *
 * Próximo paso: recuperar fragmentos de la base vectorial, responder solo con ellos
 * y devolver las citas (documento y sección) en `documentos`.
 */

export async function responderPolitica(_pregunta) {
  return {
    respuesta:
      'La consulta de políticas aún no está disponible en el asistente. ' +
      'Mientras tanto, consulta el manual de políticas de RRHH o escribe a recursoshumanos@innovacionescr.com.',
    documentos: [],
    resuelta: false,
  };
}
