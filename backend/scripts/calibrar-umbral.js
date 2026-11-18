/**
 * Calibra el umbral de similitud del RAG con preguntas que SÍ tienen respuesta en los documentos
 * (positivas) y preguntas que NO la tienen (negativas). Imprime la similitud máxima de cada una y
 * el umbral que mejor separa ambos grupos.
 *
 * Uso (desde backend/):  node scripts/calibrar-umbral.js
 */
import 'dotenv/config';
import { buscarFragmentos } from '../src/rag/recuperacion.js';

const POSITIVAS = [
  '¿Cuántos días de vacaciones me corresponden al año?',
  '¿Puedo acumular vacaciones para el próximo año?',
  '¿Con cuánta anticipación debo solicitar vacaciones?',
  '¿Cuántos días de permiso tengo por fallecimiento de un familiar?',
  '¿Cuánto dura la licencia de maternidad y la de paternidad?',
  'Me incapacitaron 5 días, ¿quién paga esos días y cuánto recibo?',
  '¿Cuándo pagan el aguinaldo y cómo se calcula?',
  '¿Cuántos días puedo trabajar desde casa por semana?',
  '¿Cómo se pagan las horas extra?',
  '¿Cuánto dura el periodo de prueba?',
  'Si renuncio, ¿cuántos días de preaviso debo dar?',
  '¿Qué incluye mi liquidación si me despiden sin justa causa?',
  '¿Qué cubre el seguro médico de la empresa?',
  '¿Cómo denuncio un caso de acoso laboral de forma confidencial?',
  '¿Qué feriados quedan este año?',
  '¿Cuántos días de permiso por matrimonio me corresponden?',
  '¿Cuándo debo presentar el certificado de incapacidad?',
  '¿Qué porcentaje aporta la empresa al fondo de ahorro?',
  '¿Cuánto presupuesto de capacitación tengo al año?',
  '¿Qué calificación necesito para un ascenso?',
  '¿Puedo fraccionar mis vacaciones?',
  '¿Cuántos días de licencia sin goce puedo pedir al año?',
];

const NEGATIVAS = [
  '¿La empresa da bono por mascotas?',
  '¿Me recomiendas una película?',
  '¿Cuál es la contraseña del wifi de la oficina?',
  '¿Cómo está el clima hoy en San José?',
  '¿Cómo se prepara un arroz con pollo?',
  '¿Dónde queda el estacionamiento para visitas?',
  '¿Cuántas sucursales tiene la empresa en Liberia?',
  '¿La empresa paga bono de comida o de transporte?',
  '¿Cuál es el plan de telefonía corporativa?',
  '¿Cuándo es el próximo partido de la selección?',
];

async function maximaSimilitud(pregunta) {
  const [mejor] = await buscarFragmentos(pregunta, 1);
  return mejor?.similitud ?? 0;
}

const positivas = [];
for (const p of POSITIVAS) positivas.push({ p, s: await maximaSimilitud(p) });
const negativas = [];
for (const n of NEGATIVAS) negativas.push({ n, s: await maximaSimilitud(n) });

const minPos = Math.min(...positivas.map((x) => x.s));
const maxNeg = Math.max(...negativas.map((x) => x.s));
const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

console.log('Positivas (con respuesta en documentos):');
for (const x of positivas.sort((a, b) => a.s - b.s)) console.log(`  ${x.s.toFixed(3)}  ${x.p}`);
console.log('\nNegativas (sin respuesta en documentos):');
for (const x of negativas.sort((a, b) => b.s - a.s)) console.log(`  ${x.s.toFixed(3)}  ${x.n}`);

console.log(`\nPositivas: mínimo ${minPos.toFixed(3)} · media ${media(positivas.map((x) => x.s)).toFixed(3)}`);
console.log(`Negativas: máximo ${maxNeg.toFixed(3)} · media ${media(negativas.map((x) => x.s)).toFixed(3)}`);

// Umbral que mejor separa: se prueban valores entre ambos grupos y se elige el de mayor exactitud
let mejor = { umbral: 0, aciertos: -1 };
for (let u = 0.75; u <= 0.95; u += 0.001) {
  const aciertos =
    positivas.filter((x) => x.s >= u).length + negativas.filter((x) => x.s < u).length;
  if (aciertos > mejor.aciertos) mejor = { umbral: u, aciertos };
}
const total = positivas.length + negativas.length;
console.log(`\nUmbral sugerido: ${mejor.umbral.toFixed(3)} · exactitud ${mejor.aciertos}/${total} (${((mejor.aciertos / total) * 100).toFixed(1)} %)`);
process.exit(0);
