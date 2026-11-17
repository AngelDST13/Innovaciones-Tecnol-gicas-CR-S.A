/**
 * Controller del chat. Valida la entrada, invoca al orquestador, registra la consulta
 * y devuelve la respuesta con sus citas. No contiene SQL ni lógica de IA.
 */
import { ErrorHttp } from '../middlewares/errorHandler.js';
import { OrquestadorNoDisponible, procesarConsulta } from '../agents/orchestrator.js';
import { obtenerHistorial, registrarConsulta } from '../services/chatService.js';

const LONGITUD_MIN = 3;
const LONGITUD_MAX = 1000;

/** POST /api/v1/chat/mensajes */
export async function enviarMensaje(req, res) {
  const pregunta = typeof req.body?.pregunta === 'string' ? req.body.pregunta.trim() : '';
  if (pregunta.length < LONGITUD_MIN || pregunta.length > LONGITUD_MAX) {
    throw new ErrorHttp(400, `La pregunta debe tener entre ${LONGITUD_MIN} y ${LONGITUD_MAX} caracteres.`);
  }

  const inicio = process.hrtime.bigint();
  let resultado;
  try {
    resultado = await procesarConsulta({ pregunta, usuario: req.usuario });
  } catch (error) {
    if (error instanceof OrquestadorNoDisponible) {
      throw new ErrorHttp(503, 'El servicio de IA no está disponible. Intenta de nuevo en unos minutos.');
    }
    throw error;
  }
  const latenciaMs = Math.round(Number(process.hrtime.bigint() - inicio) / 1_000_000);

  const consultaId = await registrarConsulta({
    colaboradorId: req.usuario.id,
    pregunta,
    resultado,
    latenciaMs,
  });

  return res.json({
    consulta_id: consultaId,
    intencion: resultado.intencion,
    agente: resultado.agente,
    bloqueada: resultado.bloqueada,
    respuesta: resultado.respuesta,
    citas: resultado.citas,
    latencia_ms: latenciaMs,
  });
}

/** GET /api/v1/chat/historial — solo las consultas del propio usuario. */
export async function historial(req, res) {
  return res.json(await obtenerHistorial(req.usuario.id));
}
