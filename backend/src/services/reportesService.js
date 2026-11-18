/**
 * Métricas agregadas y persistencia de reportes diarios (tabla reportes_diarios).
 * Regla del spec: las cifras salen de datos de la base, nunca del LLM.
 *
 * Las filas se leen con supabase-js y las agregaciones se calculan aquí, en JavaScript.
 *   1. ausentes_hoy                 ausencias del día por tipo y departamento
 *   2. solicitudes                  pendientes y cuántas llevan más de 3 días
 *   3. incapacidades                activas hoy y días acumulados en el mes
 *   4. movimientos_mes              ingresos, salidas y rotación acumulada
 *   5. colaboradores_mas_20_dias    saldos disponibles mayores a 20 días (riesgo de pasivo)
 *   6. chat_dia_anterior            consultas, % resuelto sin escalar y latencia promedio
 *   7. top5_temas                   temas más consultados (30 días)
 */
import { supabase } from '../config/database.js';
import { desplazarFecha, diaCR, fechaCR, inicioDiaCR, inicioMes } from '../utils/fechas.js';

const LIMITE_HISTORIAL_REPORTES = 30;
const TEMAS_EXCLUIDOS = new Set(['seguridad', 'fuera_de_alcance']);
const TIPOS_AUSENCIA_SOLICITUD = new Set(['vacaciones', 'permiso', 'licencia']);

function porcentaje(parte, total) {
  return total === 0 ? 0 : Number(((parte / total) * 100).toFixed(1));
}

async function leer(consulta) {
  const { data, error } = await consulta;
  if (error) throw error;
  return data ?? [];
}

async function leerDatosDelPeriodo(fecha) {
  const [colaboradores, solicitudes, incapacidades, movimientos, saldos, chat] = await Promise.all([
    leer(supabase.from('colaboradores').select('id, departamento, estado')),
    leer(supabase.from('solicitudes').select('colaborador_id, tipo, estado, fecha_inicio, fecha_fin, creada_en')),
    leer(supabase.from('incapacidades').select('colaborador_id, fecha_inicio, dias')),
    leer(supabase.from('movimientos_personal').select('tipo, fecha')),
    leer(supabase.from('saldos_vacaciones').select('dias_disponibles')),
    leer(
      supabase
        .from('consultas_chat')
        .select('fecha, pregunta, tema, intencion, resuelta, escalada, latencia_ms')
        .gte('fecha', inicioDiaCR(desplazarFecha(fecha, -31))),
    ),
  ]);
  return { colaboradores, solicitudes, incapacidades, movimientos, saldos, chat };
}

/** Métricas de un día (YYYY-MM-DD). Todas se calculan con datos de la base. */
export async function obtenerMetricasDelDia(fecha = fechaCR()) {
  const datos = await leerDatosDelPeriodo(fecha);
  const ayer = desplazarFecha(fecha, -1);
  const hace30 = desplazarFecha(fecha, -30);
  const hace90 = desplazarFecha(fecha, -90);
  const mes = inicioMes(fecha);

  const departamentoDe = new Map(datos.colaboradores.map((c) => [c.id, c.departamento]));
  const activos = datos.colaboradores.filter((c) => c.estado === 'activo').length;
  const inactivos = datos.colaboradores.filter((c) => c.estado === 'inactivo').length;

  // 1. Ausentes hoy: solicitudes aprobadas que cubren el día, más incapacidades activas
  const porTipo = { vacaciones: 0, permiso: 0, licencia: 0, incapacidad: 0 };
  const porDepartamento = Object.fromEntries(
    [...new Set(datos.colaboradores.map((c) => c.departamento))].map((d) => [d, 0]),
  );
  for (const s of datos.solicitudes) {
    if (s.estado !== 'aprobada' || !TIPOS_AUSENCIA_SOLICITUD.has(s.tipo)) continue;
    if (s.fecha_inicio <= fecha && fecha <= s.fecha_fin) {
      const tipo = s.tipo === 'vacaciones' ? 'vacaciones' : s.tipo === 'licencia' ? 'licencia' : 'permiso';
      porTipo[tipo] += 1;
      const depto = departamentoDe.get(s.colaborador_id);
      if (depto) porDepartamento[depto] = (porDepartamento[depto] ?? 0) + 1;
    }
  }
  const incapacidadesActivas = datos.incapacidades.filter((i) => i.fecha_inicio <= fecha && fecha <= desplazarFecha(i.fecha_inicio, i.dias - 1));
  for (const i of incapacidadesActivas) {
    porTipo.incapacidad += 1;
    const depto = departamentoDe.get(i.colaborador_id);
    if (depto) porDepartamento[depto] = (porDepartamento[depto] ?? 0) + 1;
  }
  const ausentesTotal = Object.values(porTipo).reduce((a, b) => a + b, 0);

  // 2. Solicitudes
  const pendientes = datos.solicitudes.filter((s) => s.estado === 'pendiente');
  const pendientesMas3 = pendientes.filter((s) => diaCR(s.creada_en) < desplazarFecha(fecha, -3)).length;
  const aprobadasDia = datos.solicitudes.filter((s) => s.estado === 'aprobada' && diaCR(s.creada_en) === fecha).length;
  const rechazadasDia = datos.solicitudes.filter((s) => s.estado === 'rechazada' && diaCR(s.creada_en) === fecha).length;

  // 3. Incapacidades del mes
  const diasMes = datos.incapacidades
    .filter((i) => i.fecha_inicio >= mes && i.fecha_inicio <= fecha)
    .reduce((total, i) => total + Number(i.dias), 0);

  // 4. Movimientos y rotación
  const movs = datos.movimientos;
  const ingresosMes = movs.filter((m) => m.tipo === 'ingreso' && m.fecha >= mes && m.fecha <= fecha).length;
  const salidasMes = movs.filter((m) => m.tipo === 'salida' && m.fecha >= mes && m.fecha <= fecha).length;
  const salidas30 = movs.filter((m) => m.tipo === 'salida' && m.fecha > hace30 && m.fecha <= fecha).length;
  const salidas90 = movs.filter((m) => m.tipo === 'salida' && m.fecha > hace90 && m.fecha <= fecha).length;

  // 5. Riesgo de pasivo
  const masDe20 = datos.saldos.filter((s) => Number(s.dias_disponibles) > 20).length;

  // 6. Chat del día anterior
  const delDiaAnterior = datos.chat.filter((c) => diaCR(c.fecha) === ayer);
  const resueltasSinEscalar = delDiaAnterior.filter((c) => c.resuelta && !c.escalada).length;
  const latencias = delDiaAnterior.map((c) => c.latencia_ms).filter((l) => l !== null);
  const sinRespuesta = delDiaAnterior
    .filter((c) => !c.resuelta && (c.intencion === 'politica' || c.intencion === 'mixta'))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  // Consultas del día del reporte (campos de compatibilidad)
  const delDia = datos.chat.filter((c) => diaCR(c.fecha) === fecha);

  // 7. Top 5 temas de 30 días
  const conteoTemas = new Map();
  for (const c of datos.chat) {
    if (!c.tema || TEMAS_EXCLUIDOS.has(c.tema) || diaCR(c.fecha) <= hace30) continue;
    conteoTemas.set(c.tema, (conteoTemas.get(c.tema) ?? 0) + 1);
  }
  const topTemas = [...conteoTemas.entries()]
    .sort(([ta, na], [tb, nb]) => nb - na || (ta < tb ? -1 : 1))
    .slice(0, 5)
    .map(([tema, consultas]) => ({ tema, consultas }));

  return {
    fecha,
    ventana_rotacion_dias: 30,
    // Campos de compatibilidad con el dashboard y el analista
    solicitudes_pendientes: pendientes.length,
    solicitudes_aprobadas_dia: aprobadasDia,
    solicitudes_rechazadas_dia: rechazadasDia,
    colaboradores_activos: activos,
    colaboradores_inactivos: inactivos,
    incapacidades_activas: incapacidadesActivas.length,
    consultas_chat_dia: delDia.length,
    consultas_resueltas_dia: delDia.filter((c) => c.resuelta).length,
    tasa_rotacion_30d: porcentaje(salidas30, activos + salidas30),

    ausentes_hoy: { total: ausentesTotal, por_tipo: porTipo, por_departamento: porDepartamento },
    solicitudes: { pendientes_total: pendientes.length, pendientes_mas_3_dias: pendientesMas3 },
    incapacidades: { activas: incapacidadesActivas.length, dias_acumulados_mes: diasMes },
    movimientos_mes: {
      ingresos: ingresosMes,
      salidas: salidasMes,
      tasa_rotacion_90_dias_pct: porcentaje(salidas90, activos + salidas90),
    },
    colaboradores_mas_20_dias: masDe20,
    chat_dia_anterior: {
      consultas: delDiaAnterior.length,
      pct_resuelto_sin_escalar: porcentaje(resueltasSinEscalar, delDiaAnterior.length),
      latencia_promedio_ms: latencias.length ? Math.round(latencias.reduce((a, b) => a + b, 0) / latencias.length) : null,
      sin_respuesta: { total: sinRespuesta.length, ejemplos: sinRespuesta.slice(0, 5).map((c) => c.pregunta) },
    },
    top5_temas: topTemas,
  };
}

export async function guardarReporte({ fecha, datos, resumenTexto, generadoPor }) {
  const { data, error } = await supabase
    .from('reportes_diarios')
    .upsert(
      { fecha, datos_json: datos, resumen_texto: resumenTexto, generado_por: generadoPor },
      { onConflict: 'fecha' },
    )
    .select('id, fecha, datos_json, resumen_texto, generado_por')
    .single();
  if (error) throw error;
  return data;
}

export async function listarReportes() {
  const { data, error } = await supabase
    .from('reportes_diarios')
    .select('id, fecha, datos_json, resumen_texto, generado_por')
    .order('fecha', { ascending: false })
    .limit(LIMITE_HISTORIAL_REPORTES);
  if (error) throw error;
  return data;
}
