/**
 * Autenticación y control de roles (colaborador | rrhh).
 *
 * Autenticación de desarrollo: el cliente envía la cabecera `X-User-Id`.
 * Cualquiera puede suplantar un id, así que esto NO es seguro en producción.
 * Antes de desplegar, reemplazar `requiereAutenticacion` por verificación de un JWT firmado.
 */
import { buscarColaboradorActivoPorId } from '../services/authService.js';

export async function requiereAutenticacion(req, res, next) {
  const id = Number(req.get('X-User-Id'));
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(401).json({ error: 'Cabecera X-User-Id requerida.' });
  }

  const usuario = await buscarColaboradorActivoPorId(id);
  if (!usuario) {
    return res.status(401).json({ error: 'Usuario no válido o inactivo.' });
  }

  req.usuario = usuario;
  return next();
}

export function requiereRol(...rolesPermitidos) {
  return function verificarRol(req, res, next) {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Acceso no autorizado para este rol.' });
    }
    return next();
  };
}
