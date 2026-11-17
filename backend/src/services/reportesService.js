/**
 * Métricas agregadas y persistencia de reportes diarios (tabla reportes_diarios).
 * Regla del spec: las cifras salen de SQL. El LLM solo redacta el resumen.
 *
 * Estructura de las métricas (los 8 elementos del reporte del spec, p. 9):
 *   1. ausentes_hoy            ausencias del día por tipo y departamento
 *   2. solicitudes             pendientes y cuántas llevan más de 3 días
 *   3. incapacidades           activas hoy y días acumulados en el mes
 *   4. movimientos_mes         ingresos, salidas y rotación acumulada
 *   5. colaboradores_mas_20_dias   riesgo de pasivo por vacaciones
 *   6. chat_dia_anterior       consultas, % resuelto sin escalar y latencia promedio
 *   7. top5_temas              temas más consultados (30 días) y preguntas sin respuesta
 *   8. (resumen ejecutivo)     lo redacta el agente analista a partir de este JSON
 */
import { query } from '../config/database.js';

const LIMITE_HISTORIAL_REPORTES = 30;
const TZ = 'America/Costa_Rica';

const SQL_METRICAS_DIA = `
  SELECT
    (SELECT COUNT(*) FROM solicitudes WHERE estado = 'pendiente')                                   AS solicitudes_pendientes,
    (SELECT COUNT(*) FROM solicitudes WHERE estado = 'aprobada'
        AND (creada_en AT TIME ZONE '${TZ}')::date = $1::date)                                      AS solicitudes_aprobadas_dia,
    (SELECT COUNT(*) FROM solicitudes WHERE estado = 'rechazada'
        AND (creada_en AT TIME ZONE '${TZ}')::date = $1::date)                                      AS solicitudes_rechazadas_dia,
    (SELECT COUNT(*) FROM colaboradores WHERE estado = 'activo')                                    AS colaboradores_activos,
    (SELECT COUNT(*) FROM colaboradores WHERE estado = 'inactivo')                                  AS colaboradores_inactivos,
    (SELECT COUNT(*) FROM incapacidades
        WHERE $1::date BETWEEN fecha_inicio AND fecha_inicio + (dias - 1))                          AS incapacidades_activas,
    (SELECT COUNT(*) FROM consultas_chat
        WHERE (fecha AT TIME ZONE '${TZ}')::date = $1::date)                                        AS consultas_chat_dia,
    (SELECT COUNT(*) FROM consultas_chat
        WHERE resuelta AND (fecha AT TIME ZONE '${TZ}')::date = $1::date)                           AS consultas_resueltas_dia`;

const SQL_AUSENTES_SOLICITUDES = `
  SELECT s.tipo::text AS tipo, c.departamento, COUNT(*)::int AS n
    FROM solicitudes s
    JOIN colaboradores c ON c.id = s.colaborador_id
   WHERE s.estado = 'aprobada'
     AND s.tipo IN ('vacaciones', 'permiso', 'licencia')
     AND $1::date BETWEEN s.fecha_inicio AND s.fecha_fin
   GROUP BY s.tipo, c.departamento`;

const SQL_AUSENTES_INCAPACIDADES = `
  SELECT c.departamento, COUNT(*)::int AS n
    FROM incapacidades i
    JOIN colaboradores c ON c.id = i.colaborador_id
   WHERE $1::date BETWEEN i.fecha_inicio AND i.fecha_inicio + (i.dias - 1)
   GROUP BY c.departamento`;

const SQL_SOLICITUDES_PENDIENTES = `
  SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE creada_en < ($1::date - 3)::timestamptz)::int AS mas_de_3_dias
    FROM solicitudes
   WHERE estado = 'pendiente'`;

const SQL_INCAPACIDADES = `
  SELECT COUNT(*) FILTER (WHERE $1::date BETWEEN fecha_inicio AND fecha_inicio + (dias - 1))::int AS activas,
         COALESCE(SUM(dias) FILTER (WHERE fecha_inicio >= date_trunc('month', $1::date)::date
                                     AND fecha_inicio <= $1::date), 0)::int                    AS dias_mes
    FROM incapacidades`;

const SQL_MOVIMIENTOS = `
  SELECT COUNT(*) FILTER (WHERE tipo = 'ingreso' AND fecha >= date_trunc('month', $1::date)::date AND fecha <= $1::date)::int AS ingresos_mes,
         COUNT(*) FILTER (WHERE tipo = 'salida'  AND fecha >= date_trunc('month', $1::date)::date AND fecha <= $1::date)::int AS salidas_mes,
         COUNT(*) FILTER (WHERE tipo = 'salida'  AND fecha > $1::date - 30 AND fecha <= $1::date)::int                      AS salidas_30_dias,
         COUNT(*) FILTER (WHERE tipo = 'salida'  AND fecha > $1::date - 90 AND fecha <= $1::date)::int                      AS salidas_90_dias
    FROM movimientos_personal`;

const SQL_SALDOS_RIESGO = `
  SELECT COUNT(*) FILTER (WHERE dias_disponibles > 20)::int AS mas_de_20_dias
    FROM saldos_vacaciones`;

const SQL_CHAT_DIA_ANTERIOR = `
  SELECT COUNT(*)::int AS consultas,
         COUNT(*) FILTER (WHERE resuelta AND NOT escalada)::int AS resueltas_sin_escalar,
         ROUND(AVG(latencia_ms))::int AS latencia_promedio_ms
    FROM consultas_chat
   WHERE (fecha AT TIME ZONE '${TZ}')::date = $1::date - 1`;

const SQL_SIN_RESPUESTA = `
  SELECT COUNT(*) OVER ()::int AS total, pregunta
    FROM consultas_chat
   WHERE NOT resuelta
     AND intencion IN ('politica', 'mixta')
     AND (fecha AT TIME ZONE '${TZ}')::date = $1::date - 1
   ORDER BY fecha
   LIMIT 5`;

const SQL_TOP_TEMAS = `
  SELECT tema, COUNT(*)::int AS consultas
    FROM consultas_chat
   WHERE tema IS NOT NULL
     AND tema NOT IN ('seguridad', 'fuera_de_alcance')  -- categorías internas, no temas consultados
     AND fecha >= ($1::date - 30)::timestamptz
   GROUP BY tema
   ORDER BY consultas DESC, tema
   LIMIT 5`;

const SQL_DEPARTAMENTOS = `
  SELECT departamento FROM colaboradores WHERE estado = 'activo' GROUP BY departamento ORDER BY departamento`;

/** Primera fila o un objeto vacío: evita fallos si una consulta no devuelve filas. */
function primera(resultado) {
  return resultado?.rows?.[0] ?? {};
}

function sumarPorDepartamento(acumulado, departamento, n) {
  acumulado[departamento] = (acumulado[departamento] ?? 0) + Number(n);
}

function porcentaje(parte, total) {
  return total === 0 ? 0 : Number(((parte / total) * 100).toFixed(1));
}

/** Devuelve todas las métricas de un día (YYYY-MM-DD). Todas las cifras son calculadas por SQL. */
export async function obtenerMetricasDelDia(fecha) {
  const [
    principal,
    ausSolicitudes,
    ausIncapacidades,
    pendientes,
    incapacidades,
    movimientos,
    riesgo,
    chat,
    sinRespuesta,
    temas,
    departamentos,
  ] = await Promise.all([
    query(SQL_METRICAS_DIA, [fecha]),
    query(SQL_AUSENTES_SOLICITUDES, [fecha]),
    query(SQL_AUSENTES_INCAPACIDADES, [fecha]),
    query(SQL_SOLICITUDES_PENDIENTES, [fecha]),
    query(SQL_INCAPACIDADES, [fecha]),
    query(SQL_MOVIMIENTOS, [fecha]),
    query(SQL_SALDOS_RIESGO),
    query(SQL_CHAT_DIA_ANTERIOR, [fecha]),
    query(SQL_SIN_RESPUESTA, [fecha]),
    query(SQL_TOP_TEMAS, [fecha]),
    query(SQL_DEPARTAMENTOS),
  ]);

  const m = primera(principal);
  const activos = Number(m.colaboradores_activos ?? 0);
  const mov = primera(movimientos);
  const salidas30 = Number(mov.salidas_30_dias ?? 0);
  const salidas90 = Number(mov.salidas_90_dias ?? 0);

  // 1. Ausentes hoy
  const porTipo = { vacaciones: 0, permiso: 0, licencia: 0, incapacidad: 0 };
  const porDepartamento = {};
  for (const fila of ausSolicitudes.rows ?? []) {
    const tipo = fila.tipo === 'vacaciones' ? 'vacaciones' : fila.tipo === 'licencia' ? 'licencia' : 'permiso';
    porTipo[tipo] += Number(fila.n);
    sumarPorDepartamento(porDepartamento, fila.departamento, fila.n);
  }
  for (const fila of ausIncapacidades.rows ?? []) {
    porTipo.incapacidad += Number(fila.n);
    sumarPorDepartamento(porDepartamento, fila.departamento, fila.n);
  }
  // Departamentos sin ausentes aparecen con 0 para que el reporte sea completo
  for (const fila of departamentos.rows ?? []) {
    porDepartamento[fila.departamento] ??= 0;
  }
  const ausentesTotal = Object.values(porTipo).reduce((a, b) => a + b, 0);

  const pendientesDatos = primera(pendientes);
  const inc = primera(incapacidades);
  const chatDatos = primera(chat);
  const sinRespuestaDatos = primera(sinRespuesta);

  return {
    fecha,
    ventana_rotacion_dias: 30,
    // Campos de compatibilidad con el dashboard y las pruebas
    solicitudes_pendientes: Number(m.solicitudes_pendientes ?? 0),
    solicitudes_aprobadas_dia: Number(m.solicitudes_aprobadas_dia ?? 0),
    solicitudes_rechazadas_dia: Number(m.solicitudes_rechazadas_dia ?? 0),
    colaboradores_activos: Number(m.colaboradores_activos ?? 0),
    colaboradores_inactivos: Number(m.colaboradores_inactivos ?? 0),
    incapacidades_activas: Number(m.incapacidades_activas ?? 0),
    consultas_chat_dia: Number(m.consultas_chat_dia ?? 0),
    consultas_resueltas_dia: Number(m.consultas_resueltas_dia ?? 0),
    tasa_rotacion_30d: porcentaje(salidas30, activos + salidas30),

    // 1. Ausentes hoy por tipo y departamento
    ausentes_hoy: { total: ausentesTotal, por_tipo: porTipo, por_departamento: porDepartamento },

    // 2. Solicitudes pendientes y antigüedad
    solicitudes: {
      pendientes_total: Number(pendientesDatos.total ?? 0),
      pendientes_mas_3_dias: Number(pendientesDatos.mas_de_3_dias ?? 0),
    },

    // 3. Incapacidades activas y días acumulados en el mes
    incapacidades: {
      activas: Number(inc.activas ?? 0),
      dias_acumulados_mes: Number(inc.dias_mes ?? 0),
    },

    // 4. Ingresos, salidas y rotación acumulada (90 días)
    movimientos_mes: {
      ingresos: Number(mov.ingresos_mes ?? 0),
      salidas: Number(mov.salidas_mes ?? 0),
      tasa_rotacion_90_dias_pct: porcentaje(salidas90, activos + salidas90),
    },

    // 5. Riesgo de pasivo: saldos de vacaciones con más de 20 días disponibles
    colaboradores_mas_20_dias: Number(primera(riesgo).mas_de_20_dias ?? 0),

    // 6. Uso del chatbot, día anterior
    chat_dia_anterior: {
      consultas: Number(chatDatos.consultas ?? 0),
      pct_resuelto_sin_escalar: porcentaje(Number(chatDatos.resueltas_sin_escalar ?? 0), Number(chatDatos.consultas ?? 0)),
      latencia_promedio_ms: chatDatos.latencia_promedio_ms == null ? null : Number(chatDatos.latencia_promedio_ms),
      sin_respuesta: {
        total: Number(sinRespuestaDatos.total ?? 0),
        ejemplos: (sinRespuesta.rows ?? []).map((f) => f.pregunta),
      },
    },

    // 7. Top 5 temas de los últimos 30 días
    top5_temas: (temas.rows ?? []).map((f) => ({ tema: f.tema, consultas: Number(f.consultas) })),
  };
}

export async function guardarReporte({ fecha, datos, resumenTexto, generadoPor }) {
  const { rows } = await query(
    `INSERT INTO reportes_diarios (fecha, datos_json, resumen_texto, generado_por)
          VALUES ($1, $2::jsonb, $3, $4)
     ON CONFLICT (fecha) DO UPDATE
            SET datos_json = EXCLUDED.datos_json,
                resumen_texto = EXCLUDED.resumen_texto,
                generado_por = EXCLUDED.generado_por
    RETURNING id, fecha, datos_json, resumen_texto, generado_por`,
    [fecha, JSON.stringify(datos), resumenTexto, generadoPor],
  );
  return rows[0];
}

export async function listarReportes() {
  const { rows } = await query(
    `SELECT id, fecha, datos_json, resumen_texto, generado_por
       FROM reportes_diarios
      ORDER BY fecha DESC
      LIMIT $1`,
    [LIMITE_HISTORIAL_REPORTES],
  );
  return rows;
}
