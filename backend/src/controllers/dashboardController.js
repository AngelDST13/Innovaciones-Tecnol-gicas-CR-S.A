/** Controller del dashboard ejecutivo de RRHH. Las rutas ya garantizan el rol `rrhh`. */
import { obtenerResumen } from '../services/dashboardService.js';

/** GET /api/v1/dashboard/resumen */
export async function resumen(_req, res) {
  return res.json(await obtenerResumen());
}
