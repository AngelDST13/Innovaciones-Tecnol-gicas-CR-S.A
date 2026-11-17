/**
 * Servicio HTTP hacia el backend de Node.js (Express).
 * Centraliza URL base, cabeceras de identidad y errores. Ningún componente hace fetch directo.
 *
 * La identidad viaja en la cabecera X-User-Id (autenticación de desarrollo).
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function peticion(ruta, { metodo = 'GET', cuerpo, usuarioId, signal } = {}) {
  const cabeceras = { 'Content-Type': 'application/json' };
  if (usuarioId) cabeceras['X-User-Id'] = String(usuarioId);

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión o intenta de nuevo en unos minutos.');
  }

  // Respuesta no JSON (p. ej. una página de error de un proxy)
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje =
      datos?.error ??
      (respuesta.status >= 500
        ? 'El servicio no está disponible en este momento. Intenta de nuevo más tarde.'
        : 'Ocurrió un error inesperado. Intenta de nuevo.');
    throw new ApiError(respuesta.status, mensaje);
  }
  if (datos === null) {
    throw new ApiError(respuesta.status, 'La respuesta del servidor no es válida.');
  }
  return datos;
}

export const api = {
  // Autenticación
  login: (email) => peticion('/api/v1/auth/login', { metodo: 'POST', cuerpo: { email } }),
  sesion: (usuarioId) => peticion('/api/v1/auth/sesion', { usuarioId }),

  // Chat (colaborador y rrhh)
  enviarMensaje: (usuarioId, pregunta) =>
    peticion('/api/v1/chat/mensajes', { metodo: 'POST', cuerpo: { pregunta }, usuarioId }),
  historialChat: (usuarioId) => peticion('/api/v1/chat/historial', { usuarioId }),

  // Perfil propio (colaborador y rrhh)
  miPerfil: (usuarioId) => peticion('/api/v1/empleados/mi-perfil', { usuarioId }),

  // Solo rrhh
  dashboard: (usuarioId, signal) => peticion('/api/v1/dashboard/resumen', { usuarioId, signal }),
  empleados: (usuarioId) => peticion('/api/v1/empleados', { usuarioId }),
  historialReportes: (usuarioId) => peticion('/api/v1/reportes', { usuarioId }),
  generarReporte: (usuarioId, fecha) =>
    peticion('/api/v1/reportes/generar', { metodo: 'POST', cuerpo: fecha ? { fecha } : {}, usuarioId }),
};
