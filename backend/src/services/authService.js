/** Acceso a datos de identidad. Solo consultas; sin reglas HTTP. */
import { query } from '../config/database.js';

export async function buscarColaboradorActivoPorId(id) {
  const { rows } = await query(
    `SELECT id, nombre, rol::text AS rol
       FROM colaboradores
      WHERE id = $1 AND estado = 'activo'`,
    [id],
  );
  return rows[0] ?? null;
}

export async function buscarColaboradorActivoPorEmail(email) {
  const { rows } = await query(
    `SELECT id, nombre, rol::text AS rol
       FROM colaboradores
      WHERE lower(email) = lower($1) AND estado = 'activo'`,
    [email],
  );
  return rows[0] ?? null;
}
