/**
 * Sincroniza las políticas de Drive con la base vectorial (incremental).
 * Uso (desde backend/):  npm run rag:ingesta
 */
import 'dotenv/config';
import { sincronizarPoliticas } from '../src/rag/ingesta.js';
import { env } from '../src/config/env.js';

if (!env.driveFolderId) {
  console.error('Falta DRIVE_FOLDER_ID en backend/.env');
  process.exit(1);
}

try {
  const resumen = await sincronizarPoliticas();
  console.log('\nIngesta terminada:', resumen);
} catch (error) {
  console.error('Fallo la ingesta:', error.message);
  process.exitCode = 1;
}
process.exit(process.exitCode ?? 0);
