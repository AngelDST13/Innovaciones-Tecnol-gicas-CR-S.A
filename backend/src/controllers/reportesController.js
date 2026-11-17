/**
 * Controller de reportes diarios (Agente Analista). Exclusivo de rrhh.
 */
import { ErrorHttp } from '../middlewares/errorHandler.js';
import { fechaHoyCR, generarReporteDelDia } from '../jobs/generarReporte.js';
import { listarReportes } from '../services/reportesService.js';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** POST /api/v1/reportes/generar  Body opcional: { fecha: 'YYYY-MM-DD' } */
export async function generar(req, res) {
  const fecha = req.body?.fecha ?? fechaHoyCR();
  if (typeof fecha !== 'string' || !PATRON_FECHA.test(fecha) || Number.isNaN(Date.parse(fecha))) {
    throw new ErrorHttp(400, 'La fecha debe tener formato YYYY-MM-DD.');
  }
  return res.json(await generarReporteDelDia(fecha));
}

/** GET /api/v1/reportes — historial de reportes, más reciente primero. */
export async function historial(_req, res) {
  return res.json(await listarReportes());
}
