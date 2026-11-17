/**
 * Filtro determinista previo al modelo: bloquea intentos de acceder a salarios de gerencia,
 * datos de terceros, credenciales o inyección de instrucciones. Se ejecuta antes de llamar a DeepSeek,
 * así que no depende de que el modelo clasifique bien.
 */

const PATRONES_BLOQUEO = [
  // Salarios o sueldos de gerencia / jefatura
  /\b(salario|sueldo|planilla)\w*\b.*\b(gerente|director\w*|presidente|ceo|jefe)\b/i,
  // Datos de terceros: "sueldo de mi compañero", "expediente de otra persona", etc.
  /\b(salario|sueldo|expediente|incapacidad(es)?)\b.*\b(de|del)\s+(mi\s+|su\s+)?(otr[oa]s?|compañer[oa]s?|colega)s?\b/i,
  // Datos de un compañero mencionado en la pregunta (p. ej. pregunta 21: "días de vacaciones de mi compañero Juan")
  /\b(vacaciones|saldo|d[ií]as|salario|sueldo|expediente|incapacidad\w*|solicitud\w*)\b.*\b(compa[ñn]er[oa]s?|colega)\b/i,
  /\b(compa[ñn]er[oa]s?|colega)\b.*\b(vacaciones|saldo|d[ií]as|salario|sueldo|expediente|incapacidad\w*|solicitud\w*)\b/i,
  // Intento de cambiar las instrucciones del sistema
  /\b(ignora|olvida)\b.*\b(instrucciones|reglas|prompt)\b/i,
  // Credenciales
  /\b(contraseña|password|api[_ ]?key|token)\b/i,
];

export const MENSAJES_BLOQUEO = Object.freeze({
  restringida:
    'No puedo proporcionar información sobre datos de otras personas, salarios de gerencia ni credenciales. ' +
    'Si necesitas una consulta de RRHH, escribe a recursoshumanos@innovacionescr.com.',
  fuera_de_alcance: 'Solo puedo responder consultas sobre políticas de RRHH y tus datos laborales.',
});

export function coincideConBloqueo(pregunta) {
  return PATRONES_BLOQUEO.some((patron) => patron.test(pregunta));
}
