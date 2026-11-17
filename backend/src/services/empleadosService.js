/** Consultas de colaboradores. Las funciones de perfil propio reciben siempre el id autenticado. */
import { query } from '../config/database.js';

export async function listarColaboradores() {
  const { rows } = await query(
    `SELECT c.id, c.nombre, c.email, c.departamento, c.puesto,
            c.fecha_ingreso, c.rol::text AS rol, c.estado::text AS estado,
            j.nombre AS jefe
       FROM colaboradores c
       LEFT JOIN colaboradores j ON j.id = c.jefe_id
      ORDER BY c.departamento, c.nombre`,
  );
  return rows;
}

export async function obtenerPerfilPropio(colaboradorId) {
  const [colaborador, saldos] = await Promise.all([
    query(
      `SELECT id, nombre, departamento, puesto, fecha_ingreso, rol::text AS rol
         FROM colaboradores
        WHERE id = $1`,
      [colaboradorId],
    ),
    query(
      `SELECT periodo, dias_asignados, dias_tomados, dias_disponibles
         FROM saldos_vacaciones
        WHERE colaborador_id = $1
        ORDER BY periodo DESC`,
      [colaboradorId],
    ),
  ]);

  return {
    ...colaborador.rows[0],
    saldos_vacaciones: saldos.rows.map((fila) => ({
      ...fila,
      dias_asignados: Number(fila.dias_asignados),
      dias_tomados: Number(fila.dias_tomados),
      dias_disponibles: Number(fila.dias_disponibles),
    })),
  };
}
