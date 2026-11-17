/**
 * Controller de autenticación. Versión de desarrollo: identifica al colaborador por correo, sin contraseña.
 *
 * Códigos de respuesta:
 *  - 400: el correo tiene formato inválido.
 *  - 404: no existe un colaborador activo con ese correo.
 *  - 503: la base de datos no está disponible (lo resuelve el manejador global de errores).
 *
 * Antes de producción: verificar contraseña (hash) o SSO, y emitir un JWT firmado.
 * Con 404 se puede deducir si un correo está registrado; en producción conviene responder 401 genérico.
 */
import { buscarColaboradorActivoPorEmail } from '../services/authService.js';
import { ErrorHttp } from '../middlewares/errorHandler.js';

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LONGITUD_MAX_EMAIL = 160;

/** POST /api/v1/auth/login */
export async function login(req, res) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!PATRON_EMAIL.test(email) || email.length > LONGITUD_MAX_EMAIL) {
    throw new ErrorHttp(400, 'Ingresa un correo corporativo válido, por ejemplo nombre@innovacionescr.com.');
  }

  const usuario = await buscarColaboradorActivoPorEmail(email);
  if (!usuario) {
    throw new ErrorHttp(404, 'Usuario no encontrado. Verifica que tu correo corporativo esté escrito correctamente.');
  }
  return res.json(usuario);
}

/** GET /api/v1/auth/sesion — el middleware ya validó la identidad. */
export function sesion(req, res) {
  return res.json(req.usuario);
}
