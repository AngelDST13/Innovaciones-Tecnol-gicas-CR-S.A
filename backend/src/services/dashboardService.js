/** Indicadores del dashboard ejecutivo de RRHH (lectura con supabase-js; agregaciones en JavaScript). */
import { supabase } from '../config/database.js';
import { desplazarFecha, diaCR, fechaCR, inicioDiaCR, inicioMes } from '../utils/fechas.js';

const DIAS_TENDENCIA = 30;

async function contar(tabla, filtros = (q) => q) {
  const { count, error } = await filtros(supabase.from(tabla).select('*', { count: 'exact', head: true }));
  if (error) throw error;
  return count ?? 0;
}

export async function obtenerResumen(hoy = fechaCR()) {
  const hace30 = desplazarFecha(hoy, -30);
  const [pendientes, activos, incapacidadesMes, consultasHoy, consultas30, resueltas30, consultas30Filas, solicitudesPendientes, colaboradores] =
    await Promise.all([
      contar('solicitudes', (q) => q.eq('estado', 'pendiente')),
      contar('colaboradores', (q) => q.eq('estado', 'activo')),
      contar('incapacidades', (q) => q.gte('fecha_inicio', inicioMes(hoy))),
      contar('consultas_chat', (q) => q.gte('fecha', inicioDiaCR(hoy))),
      contar('consultas_chat', (q) => q.gte('fecha', inicioDiaCR(hace30))),
      contar('consultas_chat', (q) => q.gte('fecha', inicioDiaCR(hace30)).eq('resuelta', true)),
      supabase.from('consultas_chat').select('fecha').gte('fecha', inicioDiaCR(desplazarFecha(hoy, -(DIAS_TENDENCIA - 1)))),
      supabase.from('solicitudes').select('id, colaborador_id, tipo, fecha_inicio, fecha_fin, creada_en').eq('estado', 'pendiente').order('creada_en', { ascending: true }).limit(20),
      supabase.from('colaboradores').select('id, nombre'),
    ]);

  if (consultas30Filas.error) throw consultas30Filas.error;
  if (solicitudesPendientes.error) throw solicitudesPendientes.error;
  if (colaboradores.error) throw colaboradores.error;

  // Tendencia de 30 días, agrupada por día de Costa Rica
  const porDia = new Map();
  for (const fila of consultas30Filas.data) {
    const dia = diaCR(fila.fecha);
    porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
  }
  const tendencia = [...porDia.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([dia, total]) => ({ dia, total }));

  const nombres = new Map(colaboradores.data.map((c) => [c.id, c.nombre]));

  return {
    kpis: {
      solicitudes_pendientes: pendientes,
      colaboradores_activos: activos,
      incapacidades_mes: incapacidadesMes,
      consultas_hoy: consultasHoy,
      tasa_resolucion_30d: consultas30 === 0 ? null : Number(((resueltas30 / consultas30) * 100).toFixed(1)),
    },
    tendencia_chat_30d: tendencia,
    solicitudes_pendientes: solicitudesPendientes.data.map((s) => ({
      id: s.id,
      colaborador: nombres.get(s.colaborador_id) ?? 'Colaborador',
      tipo: s.tipo,
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
    })),
  };
}
