/**
 * Cliente de Supabase (API de datos). Toda la lectura y escritura del backend pasa por aquí.
 * Usa la clave service_role: solo existe en el servidor y nunca se expone al frontend.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
