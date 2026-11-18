/**
 * Controller de reportes diarios (Agente Analista). Exclusivo de rrhh.
 */
import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { ErrorHttp } from '../middlewares/errorHandler.js';
import { fechaHoyCR, generarReporteDelDia } from '../jobs/generarReporte.js';
import { existeReporte, listarReportes } from '../services/reportesService.js';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Comparación en tiempo constante: el token no se filtra por el tiempo de respuesta. */
function tokenCorrecto(enviado, esperado) {
  const a = Buffer.from(enviado);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/v1/reportes/automatico  Cabecera: X-Token-Cron
 * Para programadores externos. Si el reporte de hoy ya existe, no lo vuelve a generar.
 */
export async function automatico(req, res) {
  if (!env.reporteToken) throw new ErrorHttp(404, 'Recurso no encontrado.');
  if (!tokenCorrecto(req.get('X-Token-Cron') ?? '', env.reporteToken)) {
    throw new ErrorHttp(401, 'Token de programación no válido.');
  }
  const fecha = fechaHoyCR();
  if (await existeReporte(fecha)) return res.json({ fecha, generado: false, motivo: 'ya existía' });
  const reporte = await generarReporteDelDia(fecha);
  return res.json({ fecha, generado: true, reporte_id: reporte.id });
}

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
