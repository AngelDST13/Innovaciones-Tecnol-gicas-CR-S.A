/** Indicadores del dashboard ejecutivo de RRHH. */
import { query } from '../config/database.js';

const SQL_KPIS = `
  SELECT
    (SELECT COUNT(*) FROM solicitudes WHERE estado = 'pendiente')                  AS solicitudes_pendientes,
    (SELECT COUNT(*) FROM colaboradores WHERE estado = 'activo')                   AS colaboradores_activos,
    (SELECT COUNT(*) FROM incapacidades
        WHERE fecha_inicio >= date_trunc('month', CURRENT_DATE))                   AS incapacidades_mes,
    (SELECT COUNT(*) FROM consultas_chat WHERE fecha >= CURRENT_DATE)              AS consultas_hoy,
    (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE resuelta) / NULLIF(COUNT(*), 0), 1)
       FROM consultas_chat WHERE fecha >= now() - INTERVAL '30 days')              AS tasa_resolucion_30d`;

const SQL_TENDENCIA_30D = `
  SELECT CAST(fecha AT TIME ZONE 'America/Costa_Rica' AS date) AS dia, COUNT(*) AS total
    FROM consultas_chat
   WHERE fecha >= now() - INTERVAL '30 days'
   GROUP BY dia
   ORDER BY dia`;

const SQL_PENDIENTES = `
  SELECT s.id, c.nombre AS colaborador, s.tipo::text AS tipo, s.fecha_inicio, s.fecha_fin
    FROM solicitudes s
    JOIN colaboradores c ON c.id = s.colaborador_id
   WHERE s.estado = 'pendiente'
   ORDER BY s.creada_en
   LIMIT 20`;

export async function obtenerResumen() {
  const [kpis, tendencia, pendientes] = await Promise.all([
    query(SQL_KPIS),
    query(SQL_TENDENCIA_30D),
    query(SQL_PENDIENTES),
  ]);

  const fila = kpis.rows[0];
  return {
    kpis: {
      solicitudes_pendientes: fila.solicitudes_pendientes,
      colaboradores_activos: fila.colaboradores_activos,
      incapacidades_mes: fila.incapacidades_mes,
      consultas_hoy: fila.consultas_hoy,
      // ROUND devuelve NUMERIC (texto en pg); null si no hubo consultas en 30 días
      tasa_resolucion_30d: fila.tasa_resolucion_30d === null ? null : Number(fila.tasa_resolucion_30d),
    },
    tendencia_chat_30d: tendencia.rows,
    solicitudes_pendientes: pendientes.rows,
  };
}
