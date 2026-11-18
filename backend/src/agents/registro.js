/**
 * Registro de los agentes del sistema. Es la referencia de qué hace cada uno y dónde vive.
 * Cinco obligatorios del spec, dos opcionales del spec y tres propuestos por el equipo.
 */
export const AGENTES = Object.freeze([
  { id: 'orquestador', nombre: 'Orquestador', origen: 'spec (obligatorio)', funcion: 'Clasifica la intención y enruta la consulta', archivo: 'agents/orchestrator.js' },
  { id: 'politicas', nombre: 'Políticas (RAG)', origen: 'spec (obligatorio)', funcion: 'Responde con fragmentos de Drive y cita documento y punto', archivo: 'agents/politicasAgent.js' },
  { id: 'datos', nombre: 'Datos del colaborador', origen: 'spec (obligatorio)', funcion: 'Responde datos propios: saldo, solicitudes, incapacidades', archivo: 'agents/datosAgent.js' },
  { id: 'analista', nombre: 'Analista de reportes', origen: 'spec (obligatorio)', funcion: 'Calcula el reporte diario y redacta el resumen', archivo: 'agents/analistaAgent.js' },
  { id: 'ingesta', nombre: 'Ingesta y sincronización con Drive', origen: 'spec (obligatorio)', funcion: 'Mantiene la base vectorial al día con Drive', archivo: 'rag/ingesta.js' },
  { id: 'validador', nombre: 'Validador de respuestas', origen: 'spec (opcional)', funcion: 'Verifica que cada cita venga de un documento recuperado', archivo: 'agents/validadorAgent.js' },
  { id: 'escalamiento', nombre: 'Escalamiento a RRHH', origen: 'spec (opcional)', funcion: 'Crea un ticket cuando la política no está en los documentos', archivo: 'agents/escalamientoAgent.js' },
  { id: 'pagos', nombre: 'Pagos y calendario', origen: 'equipo', funcion: 'Responde la fecha del próximo pago', archivo: 'agents/pagosAgent.js' },
  { id: 'desempeno', nombre: 'Desempeño', origen: 'equipo', funcion: 'Responde la fecha de la próxima evaluación', archivo: 'agents/desempenoAgent.js' },
  { id: 'guardrails', nombre: 'Guardrails de seguridad', origen: 'equipo', funcion: 'Bloquea consultas restringidas antes de llamar al modelo', archivo: 'agents/guardrails.js' },
]);
