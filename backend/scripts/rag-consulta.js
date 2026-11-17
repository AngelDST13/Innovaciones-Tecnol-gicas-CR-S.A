/**
 * Muestra los fragmentos que recupera el RAG para una o más preguntas (sin llamar al modelo de respuesta).
 * Uso (desde backend/):  node scripts/rag-consulta.js "¿Cuántos días de vacaciones me corresponden?" ...
 */
import 'dotenv/config';
import { buscarFragmentos } from '../src/rag/recuperacion.js';

const preguntas = process.argv.slice(2);
for (const pregunta of preguntas) {
  const fragmentos = await buscarFragmentos(pregunta, 3);
  console.log(`\nQ: ${pregunta}`);
  for (const f of fragmentos) {
    const ubicacion = f.punto ? `punto ${f.punto}` : f.seccion ? `sección ${f.seccion}` : 'calendario';
    console.log(`  ${f.similitud.toFixed(3)}  ${f.codigo} ${ubicacion}  ${f.contenido.slice(0, 70)}`);
  }
}
process.exit(0);
