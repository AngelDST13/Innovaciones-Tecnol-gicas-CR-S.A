/**
 * Controller de colaboradores.
 * - Listado completo: solo rrhh (la ruta lo exige).
 * - Perfil propio: cualquier usuario autenticado, siempre con su propio id (nunca un id de la petición).
 */
import { listarColaboradores, obtenerPerfilPropio } from '../services/empleadosService.js';

/** GET /api/v1/empleados */
export async function listar(_req, res) {
  return res.json(await listarColaboradores());
}

/** GET /api/v1/empleados/mi-perfil */
export async function miPerfil(req, res) {
  return res.json(await obtenerPerfilPropio(req.usuario.id));
}
