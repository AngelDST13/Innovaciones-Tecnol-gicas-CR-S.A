/** Acceso a datos de identidad. Solo consultas; sin reglas HTTP. */
import { supabase } from '../config/database.js';

const CAMPOS = 'id, nombre, rol';

export async function buscarColaboradorActivoPorId(id) {
  const { data, error } = await supabase
    .from('colaboradores')
    .select(CAMPOS)
    .eq('id', id)
    .eq('estado', 'activo')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function buscarColaboradorActivoPorEmail(email) {
  // ilike sin comodines: se escapan % y _ para que el correo se compare literal
  const literal = email.replace(/[%_\\]/g, (c) => `\\${c}`);
  const { data, error } = await supabase
    .from('colaboradores')
    .select(CAMPOS)
    .ilike('email', literal)
    .eq('estado', 'activo')
    .maybeSingle();
  if (error) throw error;
  return data;
}
