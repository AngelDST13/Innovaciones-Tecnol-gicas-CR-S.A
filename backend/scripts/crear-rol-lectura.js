/**
 * Crea el rol de solo lectura "agente_lectura" en Supabase y guarda su URL de conexión en backend/.env
 * como DATABASE_URL_LECTURA. La contraseña se genera aquí, no se muestra en pantalla y no se versiona.
 *
 * Uso (desde backend/):  node scripts/crear-rol-lectura.js
 *
 * Idempotente: si se vuelve a ejecutar, rota la contraseña del rol y actualiza .env.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const DIR = dirname(fileURLToPath(import.meta.url));
const RAIZ_BACKEND = resolve(DIR, '..');
const RUTA_ENV = resolve(RAIZ_BACKEND, '.env');
const PLANTILLA = resolve(RAIZ_BACKEND, '../database/security/rol_solo_lectura.sql');
const ROL = 'agente_lectura';

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en backend/.env');
  process.exit(1);
}

// Solo caracteres seguros para URL y SQL: letras, números, guion y guion bajo.
const contrasena = randomBytes(24).toString('base64url');

const url = new URL(process.env.DATABASE_URL);
const usuarioOwner = decodeURIComponent(url.username); // p. ej. postgres.<ref>
const referencia = usuarioOwner.includes('.') ? usuarioOwner.split('.').slice(1).join('.') : null;
const usuarioLectura = referencia ? `${ROL}.${referencia}` : ROL;

// 1. Crear o actualizar el rol en la base
const sql = readFileSync(PLANTILLA, 'utf8').replaceAll('__PASSWORD__', contrasena);
const owner = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});
await owner.connect();
try {
  const existe = await owner.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [ROL]);
  if (existe.rowCount === 0) {
    await owner.query(`CREATE ROLE ${ROL}`);
  }
  await owner.query(sql);

  // Política de lectura en cada tabla de public (RLS activo). Drop + create la hace idempotente.
  const tablas = await owner.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  for (const { tablename } of tablas.rows) {
    const tabla = `public.${owner.escapeIdentifier(tablename)}`;
    await owner.query(`DROP POLICY IF EXISTS lectura_agente_datos ON ${tabla}`);
    await owner.query(
      `CREATE POLICY lectura_agente_datos ON ${tabla} FOR SELECT TO ${ROL} USING (true)`,
    );
  }
  console.log(`OK  rol "${ROL}" creado o actualizado; políticas de lectura en ${tablas.rowCount} tablas`);
} finally {
  await owner.end();
}

// 2. Guardar la URL del rol en backend/.env (sin mostrar la contraseña)
const urlLectura = new URL(process.env.DATABASE_URL);
urlLectura.username = usuarioLectura;
urlLectura.password = contrasena;
const lineaLectura = `DATABASE_URL_LECTURA=${urlLectura.toString()}`;

let contenido = existsSync(RUTA_ENV) ? readFileSync(RUTA_ENV, 'utf8') : '';
const lineas = contenido.split(/\r?\n/).filter((l) => l.length > 0 && !l.startsWith('DATABASE_URL_LECTURA='));
lineas.push(lineaLectura);
writeFileSync(RUTA_ENV, lineas.join('\n') + '\n');
console.log('OK  DATABASE_URL_LECTURA guardada en backend/.env');

// 3. Verificar: lectura permitida, escritura denegada
// El pooler de Supabase puede tardar unos segundos en aceptar la contraseña nueva.
// Un cliente que falló al conectar no se reutiliza: cada intento usa un cliente nuevo.
async function conectarLector() {
  for (let intento = 1; ; intento++) {
    const cliente = new pg.Client({
      connectionString: urlLectura.toString(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15_000,
    });
    try {
      await cliente.connect();
      return cliente;
    } catch (error) {
      await cliente.end().catch(() => {});
      if (intento >= 6) throw error;
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }
}
const lector = await conectarLector();
try {
  const lectura = await lector.query('SELECT COUNT(*)::int AS n FROM colaboradores');
  console.log(`OK  lectura: colaboradores visibles = ${lectura.rows[0].n}`);
  try {
    await lector.query("UPDATE colaboradores SET nombre = nombre WHERE false");
    console.log('FALLO escritura: el rol pudo ejecutar UPDATE');
    process.exitCode = 1;
  } catch (error) {
    console.log(`OK  escritura denegada: ${error.message}`);
  }
} finally {
  await lector.end();
}
