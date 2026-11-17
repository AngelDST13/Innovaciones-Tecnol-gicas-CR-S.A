/**
 * Manejo centralizado de errores.
 * - Los controllers lanzan ErrorHttp con un mensaje pensado para el usuario.
 * - Fallos de conexión con la base de datos o con DeepSeek se traducen a 503 (servicio no disponible),
 *   no a 500: el problema es de infraestructura, no un fallo interno del código.
 * - Cualquier otro error se registra en el servidor y responde 500 sin detalles internos.
 */

export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.status = status;
  }
}

const CODIGOS_CONEXION = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH']);

export function esErrorDeConexion(error) {
  if (CODIGOS_CONEXION.has(error?.code)) return true;
  // Errores de pg sin código de red (p. ej. el servidor cerró la conexión)
  return error?.name === 'Error' && /connection|connect|terminat/i.test(error?.message ?? '') && !error.status;
}

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(error, req, res, next) {
  // JSON mal formado en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición es demasiado grande.' });
  }

  if (error instanceof ErrorHttp) {
    return res.status(error.status).json({ error: error.message });
  }

  if (esErrorDeConexion(error)) {
    console.error('Servicio no disponible (conexión):', error.message);
    return res.status(503).json({
      error: 'No podemos conectarnos a la base de datos en este momento. Intenta de nuevo en unos minutos.',
    });
  }

  console.error('Error no controlado:', error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}
