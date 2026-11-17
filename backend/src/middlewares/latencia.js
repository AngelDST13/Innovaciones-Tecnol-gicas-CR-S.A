/**
 * Mide el tiempo de procesamiento de cada petición.
 * Expone la cabecera X-Latencia-Ms y registra las peticiones que superan LATENCY_WARNING_MS.
 */
import { env } from '../config/env.js';

export function medirLatencia(req, res, next) {
  const inicio = process.hrtime.bigint();

  // La cabecera debe escribirse antes de enviar la respuesta; por eso se intercepta writeHead.
  const writeHeadOriginal = res.writeHead;
  res.writeHead = function writeHeadConLatencia(...argumentos) {
    if (!res.headersSent) {
      res.setHeader('X-Latencia-Ms', calcularMs(inicio).toFixed(2));
    }
    return writeHeadOriginal.apply(this, argumentos);
  };

  res.on('finish', () => {
    const ms = calcularMs(inicio);
    const registro = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(2)} ms`;
    if (ms > env.latencyWarningMs) console.warn(`LENTA ${registro}`);
    else console.info(registro);
  });

  next();
}

function calcularMs(inicio) {
  return Number(process.hrtime.bigint() - inicio) / 1_000_000;
}
