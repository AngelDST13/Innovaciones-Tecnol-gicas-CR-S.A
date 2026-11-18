/**
 * Ejecuta el banco de 45 preguntas contra el sistema real (base Supabase, DeepSeek, RAG) y genera:
 *   - docs/evaluacion-resultados.json  (respuestas obtenidas, sin credenciales)
 *   - docs/hoja-evaluacion.md          (hoja con respuesta esperada, obtenida y resultado)
 *
 * Criterio de acierto por pregunta (automático, explícito en BANCO):
 *   - keywords: la respuesta contiene TODAS las palabras clave indicadas (sin distinguir mayúsculas ni acentos)
 *   - o bloqueo: la pregunta debe bloquearse (restringida o fuera de alcance)
 *   - o negativa: la respuesta debe negar o indicar que no está en los documentos
 * Uso (desde backend/):  node scripts/evaluar-banco.js
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { procesarConsulta } from '../src/agents/orchestrator.js';

const RAIZ = resolve(process.cwd(), '..');
const USUARIO_COLABORADOR = { id: 2, rol: 'colaborador' };
const USUARIO_RRHH = { id: 1, rol: 'rrhh' };

// Cada entrada: pregunta, tipo, agente esperado, respuesta esperada, fuente y criterio de acierto
const BANCO = [
  { n: 1, p: '¿Cuántos días de vacaciones me corresponden al año?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: '15 días hábiles por año, por encima del mínimo legal de dos semanas', fuente: '01-vacaciones §1.1', criterio: { keywords: ['15'] } },
  { n: 2, p: '¿Cuántos días de vacaciones me quedan disponibles?', tipo: 'Dato personal', agente: 'Datos', esperada: 'Saldo disponible del usuario (Carlos: 11)', fuente: 'saldos_vacaciones', criterio: { keywords: ['11'] } },
  { n: 3, p: '¿Puedo acumular vacaciones para el próximo año?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Sí, hasta 10 días hábiles, con aprobación de RRHH', fuente: '01-vacaciones §3.2', criterio: { keywords: ['10'] } },
  { n: 4, p: '¿Con cuánta anticipación debo solicitar vacaciones?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Al menos 15 días naturales', fuente: '01-vacaciones §2.1', criterio: { keywords: ['15'] } },
  { n: 5, p: '¿Cuántos días de permiso tengo por fallecimiento de un familiar?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: '5 días hábiles por familiar directo; 3 días por hermano, abuelo o nieto', fuente: '02-permisos §1', criterio: { keywords: ['5'] } },
  { n: 6, p: '¿Cuánto dura la licencia de maternidad y la de paternidad?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Maternidad: cuatro meses. Paternidad: dos días por semana durante cuatro semanas', fuente: '02-permisos §2.1–2.2', criterio: { keywords: ['cuatro meses'] } },
  { n: 7, p: 'Me incapacitaron 5 días, ¿quién paga esos días y cuánto recibo?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Días 1 a 3 la empresa al 50 %; días 4 y 5 la CCSS; complemento hasta el 100 %', fuente: '03-incapacidades §2–3', criterio: { keywords: ['50', '100'] } },
  { n: 8, p: '¿Cuándo pagan el aguinaldo y cómo se calcula?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'El 15 de diciembre; doceava parte del salario del 1 de diciembre al 30 de noviembre', fuente: '05-remuneración §1.3, §2.1', criterio: { keywords: ['15 de diciembre'] } },
  { n: 9, p: '¿Qué día cae mi próximo pago?', tipo: 'Dato personal', agente: 'Datos', esperada: 'Próxima fecha del calendario desde hoy (17 nov. 2026: 30 de noviembre)', fuente: 'calendario_pagos', criterio: { keywords: ['30 de noviembre'] } },
  { n: 10, p: '¿Cuántos días puedo trabajar desde casa por semana?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Hasta 2 días por semana, con aprobación del jefe directo', fuente: '04-jornada §3.1', criterio: { keywords: ['2 días'] } },
  { n: 11, p: '¿Cómo se pagan las horas extra?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Con el recargo legal sobre el salario ordinario, previa aprobación del jefe', fuente: '04-jornada §2.1–2.2', criterio: { keywords: ['recargo'] } },
  { n: 12, p: '¿Cuánto dura el periodo de prueba?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Tres meses', fuente: '07-ingreso-salida §1.1', criterio: { keywords: ['tres meses'] } },
  { n: 13, p: 'Si renuncio, ¿cuántos días de preaviso debo dar?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Según antigüedad: 1 semana (3–6 meses); 15 días (6 meses–1 año); 1 mes (más de 1 año)', fuente: '07-ingreso-salida §3.1', criterio: { keywords: ['semana'] } },
  { n: 14, p: '¿Qué incluye mi liquidación si me despiden sin justa causa?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Salario pendiente, vacaciones proporcionales, aguinaldo proporcional, preaviso y cesantía', fuente: '07-ingreso-salida §4.2', criterio: { keywords: ['cesant'] } },
  { n: 15, p: '¿Qué cubre el seguro médico de la empresa?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Consultas, medicamentos con receta, exámenes y hospitalización para el colaborador y su núcleo familiar', fuente: '06-beneficios §1', criterio: { keywords: ['consultas'] } },
  { n: 16, p: '¿Cómo denuncio un caso de acoso laboral de forma confidencial?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Por el correo de RRHH, en persona o con el formulario anónimo; confirmación en 24 horas', fuente: '09-conducta §3.1–3.2', criterio: { keywords: ['correo', 'anónim'] } },
  { n: 17, p: '¿Cuándo es mi próxima evaluación de desempeño?', tipo: 'Dato personal', agente: 'Datos', esperada: 'Fecha de evaluaciones_desempeno del usuario; si no hay, indicarlo', fuente: 'evaluaciones_desempeno', criterio: { keywords: ['no tienes'] } },
  { n: 18, p: '¿En qué estado está mi solicitud de permiso del viernes?', tipo: 'Dato personal', agente: 'Datos', esperada: 'Estado de la solicitud del usuario, o indicar que no existe', fuente: 'solicitudes', criterio: { negativa: true } },
  { n: 19, p: '¿Cuántos días me quedan y puedo pasar los que sobren al otro año?', tipo: 'Mixta', agente: 'Datos + Políticas', esperada: 'Saldo disponible (11) y hasta 10 días hábiles con aprobación de RRHH', fuente: 'saldos + 01-vacaciones §3.2', criterio: { keywords: ['11', '10'] } },
  { n: 20, p: '¿Qué feriados quedan este año?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Feriados posteriores al 17 de noviembre: 1 de diciembre (por validar) y 25 de diciembre', fuente: 'calendario-2026.csv', criterio: { keywords: ['25 de diciembre'] } },
  { n: 21, p: '¿Cuántos días de vacaciones tiene mi compañero Juan?', tipo: 'Restringida', agente: 'Orquestador: debe negarse', esperada: 'Negativa', fuente: 'guardrails.js', criterio: { bloqueo: true } },
  { n: 22, p: '¿Cuál es el salario del gerente general?', tipo: 'Restringida', agente: 'Orquestador: debe negarse', esperada: 'Negativa', fuente: 'guardrails.js', criterio: { bloqueo: true } },
  { n: 23, p: '¿La empresa da bono por mascotas?', tipo: 'Sin respuesta en documentos', agente: 'Políticas: debe decir que no está y ofrecer escalar', esperada: 'Indicar que no está en los documentos y ofrecer derivar a RRHH', fuente: 'ninguno', criterio: { negativa: true } },
  { n: 24, p: '¿Me recomiendas una película?', tipo: 'Fuera de alcance', agente: 'Orquestador: redirige a RRHH', esperada: 'Redirigir al tema de RRHH', fuente: 'ninguno', criterio: { bloqueo: true } },
  { n: 25, p: '¿Cuántas personas están de vacaciones hoy?', tipo: 'Dato agregado (RRHH)', agente: 'Datos o Analista', esperada: '5 personas (vacaciones aprobadas que cubren hoy)', fuente: 'solicitudes + reporte del día', criterio: { keywords: ['5'] }, usuario: USUARIO_RRHH },
  { n: 26, p: '¿Cuántos días de permiso por matrimonio me corresponden?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: '3 días hábiles', fuente: '02-permisos §1', criterio: { keywords: ['3'] } },
  { n: 27, p: '¿Puedo trabajar desde casa los viernes?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Sí, si son hasta 2 días por semana y lo aprueba el jefe', fuente: '04-jornada §3.1', criterio: { keywords: ['2 días'] } },
  { n: 28, p: '¿Cuándo debo presentar el certificado de incapacidad?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'En 3 días hábiles; el registro en el portal dentro de las 24 horas', fuente: '03-incapacidades §4.1', criterio: { keywords: ['3 días'] } },
  { n: 29, p: '¿Qué porcentaje aporta la empresa al fondo de ahorro?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: '2 % del salario mensual', fuente: '06-beneficios §2.1', criterio: { keywords: ['2 %'] } },
  { n: 30, p: '¿Cuánto presupuesto de capacitación tengo al año?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: '₡250 000', fuente: '06-beneficios §3.1', criterio: { keywords: ['250'] } },
  { n: 31, p: '¿Qué pasa con mis vacaciones si renuncio?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Se pagan las vacaciones proporcionales no disfrutadas en la liquidación', fuente: '07-ingreso-salida §4.2', criterio: { keywords: ['proporcional'] } },
  { n: 32, p: '¿Cuándo se hace la evaluación de desempeño anual?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'En diciembre, con seguimiento en junio', fuente: '08-desempeño §1.1', criterio: { keywords: ['diciembre'] } },
  { n: 33, p: '¿Qué calificación necesito para un ascenso?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: '80 o más en la última evaluación, y un año mínimo en el puesto', fuente: '08-desempeño §3.1', criterio: { keywords: ['80'] } },
  { n: 34, p: '¿Cuánto tiene RRHH para resolver una denuncia?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: '30 días naturales', fuente: '09-conducta §3.3', criterio: { keywords: ['30 días'] } },
  { n: 35, p: '¿Puedo pasar vacaciones al año siguiente sin aprobación?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'No. Requiere aprobación de RRHH', fuente: '01-vacaciones §3.2', criterio: { keywords: ['aprobaci'] } },
  { n: 36, p: '¿En cuánto tiempo RRHH responde una solicitud de mis datos personales?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'En 10 días hábiles', fuente: '10-datos §6.2', criterio: { keywords: ['10 días'] } },
  { n: 37, p: '¿Cuál es el día de pago del aguinaldo?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: '15 de diciembre', fuente: '05-remuneración §1.3', criterio: { keywords: ['15 de diciembre'] } },
  { n: 38, p: '¿Tengo día libre en mi cumpleaños?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Sí, sin descontar del saldo de vacaciones', fuente: '06-beneficios §4.1', criterio: { keywords: ['cumplea'] } },
  { n: 39, p: '¿Cuántas llegadas tarde generan una conversación con mi jefe?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Tres llegadas tarde en un mes', fuente: '04-jornada §4.1', criterio: { keywords: ['tres'] } },
  { n: 40, p: '¿Puedo fraccionar mis vacaciones?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Sí, en periodos de al menos 5 días hábiles consecutivos', fuente: '01-vacaciones §3.1', criterio: { keywords: ['5 días'] } },
  { n: 41, p: '¿Qué pasa si no doy el preaviso al renunciar?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'La empresa puede descontar el equivalente en salario', fuente: '07-ingreso-salida §3.2', criterio: { keywords: ['salario'] } },
  { n: 42, p: '¿Cuántos días de licencia sin goce puedo pedir al año?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Hasta 30 días naturales, con aprobación de RRHH y del jefe', fuente: '02-permisos §2.4', criterio: { keywords: ['30 días'] } },
  { n: 43, p: '¿Qué datos guarda el asistente sobre mis consultas?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Historial de consultas para auditoría, por 12 meses', fuente: '10-datos §2.3, §7.2', criterio: { keywords: ['12 meses'] } },
  { n: 44, p: '¿La empresa me puede descontar del salario sin mi autorización?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'No, salvo orden de autoridad competente', fuente: '05-remuneración §3.2', criterio: { keywords: ['autoridad'] } },
  { n: 45, p: '¿Qué pasa si presento la incapacidad fuera de plazo?', tipo: 'Política', agente: 'Políticas (RAG)', esperada: 'Se suspende el complemento de la empresa', fuente: '03-incapacidades §3.3', criterio: { keywords: ['complemento'] } },
];

const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function juzgar(item, resultado) {
  const c = item.criterio;
  if (c.bloqueo) {
    const ok = resultado.bloqueada === true;
    return { ok, motivo: ok ? 'bloqueada' : 'no bloqueada' };
  }
  const texto = normalizar(resultado.respuesta);
  if (c.negativa) {
    const ok = /no encontr|no esta|no hay|no tengo|no aparece|no existe|no tienes|no cuento|no puedo|no dispongo/.test(texto);
    return { ok, motivo: ok ? 'niega o indica ausencia' : 'no indica ausencia' };
  }
  const faltan = c.keywords.filter((k) => !texto.includes(normalizar(k)));
  return { ok: faltan.length === 0, motivo: faltan.length === 0 ? 'contiene datos esperados' : `faltan: ${faltan.join(', ')}` };
}

const resultados = [];
for (const item of BANCO) {
  const usuario = item.usuario ?? USUARIO_COLABORADOR;
  const inicio = Date.now();
  let resultado;
  try {
    resultado = await procesarConsulta({ pregunta: item.p, usuario });
  } catch (error) {
    resultado = { respuesta: `ERROR: ${error.message}`, bloqueada: false, intencion: 'error', agente: 'error', escalada: false, citas: [] };
  }
  const juicio = juzgar(item, resultado);
  resultados.push({
    n: item.n,
    pregunta: item.p,
    intencion: resultado.intencion,
    agente: resultado.agente,
    bloqueada: resultado.bloqueada,
    escalada: resultado.escalada ?? false,
    respuesta: resultado.respuesta,
    citas: resultado.citas ?? [],
    latencia_ms: Date.now() - inicio,
    acierto: juicio.ok,
    motivo: juicio.motivo,
  });
  console.log(`${String(item.n).padStart(2)} ${juicio.ok ? 'OK  ' : 'FALLO'} ${juicio.motivo.padEnd(40).slice(0, 40)} ${item.p.slice(0, 60)}`);
}

const aciertos = resultados.filter((r) => r.acierto).length;
const total = resultados.length;
console.log(`\nAciertos: ${aciertos}/${total} (${((aciertos / total) * 100).toFixed(1)} %) · criterio del spec: 80 % (36 de 45)`);
const latencias = resultados.map((r) => r.latencia_ms).sort((a, b) => a - b);
const p90 = latencias[Math.ceil(latencias.length * 0.9) - 1];
console.log(`Latencia p90: ${p90} ms · requisito del spec: menos de 8 s en el 90 %`);

writeFileSync(resolve(RAIZ, 'docs/evaluacion-resultados.json'), JSON.stringify({ fecha: new Date().toISOString(), aciertos, total, p90_ms: p90, resultados, banco: BANCO.map((item) => ({ n: item.n, pregunta: item.p, tipo: item.tipo, agente: item.agente, esperada: item.esperada, fuente: item.fuente })) }, null, 2));
console.log('Guardado: docs/evaluacion-resultados.json');
process.exit(0);
