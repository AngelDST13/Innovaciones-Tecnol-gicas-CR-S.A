/**
 * Conexión a Supabase (PostgreSQL) con el cliente oficial `pg`.
 * Todas las consultas pasan por `query()` con parámetros ($1, $2...), nunca por concatenación de texto.
 */
import pg from 'pg';
import { env } from './env.js';

// Tipos de PostgreSQL que `pg` devuelve como texto o Date por defecto:
pg.types.setTypeParser(20, (valor) => Number.parseInt(valor, 10)); // BIGINT / COUNT(*) -> number
pg.types.setTypeParser(1082, (valor) => valor); // DATE -> 'YYYY-MM-DD' (sin desfase de zona horaria)

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: env.dbSslRejectUnauthorized }, // Supabase exige TLS
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (error) => {
  console.error('Error inesperado en el pool de PostgreSQL:', error.message);
});

export function query(texto, valores = []) {
  return pool.query(texto, valores);
}

/**
 * Pool del rol de solo lectura (agente_lectura). Lo usa el agente de datos: aunque una consulta
 * tuviera un error, este rol no puede modificar ninguna tabla.
 * Si DATABASE_URL_LECTURA no está definida, se usa el pool principal y se avisa en el log.
 */
const poolLectura = env.databaseUrlLectura
  ? new pg.Pool({
      connectionString: env.databaseUrlLectura,
      ssl: { rejectUnauthorized: env.dbSslRejectUnauthorized },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

if (!poolLectura) {
  console.warn('DATABASE_URL_LECTURA no definida: el agente de datos usa el rol principal (no recomendado).');
}

export function queryLectura(texto, valores = []) {
  return (poolLectura ?? pool).query(texto, valores);
}

export async function verificarConexion() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export default pool;
