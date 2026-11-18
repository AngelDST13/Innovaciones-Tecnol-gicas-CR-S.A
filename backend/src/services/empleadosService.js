/** Consultas de colaboradores. Las funciones de perfil propio reciben siempre el id autenticado. */
import { supabase } from '../config/database.js';

export async function listarColaboradores() {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('id, nombre, email, departamento, puesto, fecha_ingreso, rol, estado, jefe_id')
    .order('departamento', { ascending: true })
    .order('nombre', { ascending: true });
  if (error) throw error;

  const nombres = new Map(data.map((c) => [c.id, c.nombre]));
  return data.map(({ jefe_id: jefeId, ...c }) => ({ ...c, jefe: jefeId ? (nombres.get(jefeId) ?? null) : null }));
}

export async function obtenerPerfilPropio(colaboradorId) {
  const [colaborador, saldos] = await Promise.all([
    supabase.from('colaboradores').select('id, nombre, departamento, puesto, fecha_ingreso, rol').eq('id', colaboradorId).maybeSingle(),
    supabase
      .from('saldos_vacaciones')
      .select('periodo, dias_asignados, dias_tomados, dias_disponibles')
      .eq('colaborador_id', colaboradorId)
      .order('periodo', { ascending: false }),
  ]);
  if (colaborador.error) throw colaborador.error;
  if (saldos.error) throw saldos.error;

  return {
    ...colaborador.data,
    saldos_vacaciones: saldos.data.map((s) => ({
      ...s,
      dias_asignados: Number(s.dias_asignados),
      dias_tomados: Number(s.dias_tomados),
      dias_disponibles: Number(s.dias_disponibles),
    })),
  };
}
