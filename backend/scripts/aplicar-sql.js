/**
 * Aplica archivos SQL a la base configurada en DATABASE_URL (backend/.env).
 * Uso (desde backend/):  node scripts/aplicar-sql.js ../database/migrations/002_volumen_y_campos.sql ../database/seeds/002_datos_simulados.sql
 *
 * Cada archivo se ejecuta tal cual. Las migraciones y seeds de este proyecto son idempotentes.
 * El script imprime solo conteos, nunca credenciales.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import pg from 'pg';

const archivos = process.argv.slice(2);
if (archivos.length === 0) {
  console.error('Indica al menos un archivo SQL.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en backend/.env');
  process.exit(1);
}

const cliente = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});

await cliente.connect();
try {
  for (const archivo of archivos) {
    const sql = readFileSync(archivo, 'utf8');
    await cliente.query(sql);
    console.log(`OK  ${basename(archivo)}`);
  }
} catch (error) {
  console.error(`FALLO: ${error.message}`);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
