/**
 * Agente validador: revisa cada respuesta de política antes de enviarla.
 * - Toda cita [POL-XX ...] debe corresponder a un documento que realmente se recuperó.
 * - Toda respuesta de política incluye al menos una fuente (si el modelo no la puso, se agrega).
 */
const RE_CITA = /\[(POL-(?:\d{2}|CAL))\b/g;

function codigoDe(documento) {
  return documento.match(/^(POL-(?:\d{2}|CAL))\b/)?.[1] ?? null;
}

/**
 * @returns {{valida: boolean, respuesta: string|null, motivo?: string}}
 */
export function validarRespuesta({ respuesta, documentos }) {
  const permitidos = new Set(documentos.map((d) => codigoDe(d.documento)).filter(Boolean));
  const citados = [...respuesta.matchAll(RE_CITA)].map((m) => m[1]);

  if (citados.some((codigo) => !permitidos.has(codigo))) {
    return { valida: false, respuesta: null, motivo: 'cita_no_recuperada' };
  }
  if (citados.length > 0) {
    return { valida: true, respuesta };
  }
  const fuente = documentos[0]?.documento ?? 'documentos de RRHH';
  return { valida: true, respuesta: `${respuesta}\n\nFuente: ${fuente}.` };
}
