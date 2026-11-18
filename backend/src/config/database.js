/**
 * Acceso a datos: Supabase (PostgreSQL) mediante su API. No hay SQL en el código del backend.
 */
import { supabase } from './supabase.js';

/** Comprueba que la API de Supabase responde y que la tabla de colaboradores es accesible. */
export async function verificarConexion() {
  try {
    const { error } = await supabase.from('colaboradores').select('id', { head: true, count: 'exact' });
    return !error;
  } catch {
    return false;
  }
}

export { supabase };
