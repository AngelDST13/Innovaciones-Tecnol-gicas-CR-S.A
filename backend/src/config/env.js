/**
 * Carga y valida las variables de entorno. Falla al arrancar si falta algo crítico.
 */
import 'dotenv/config';

function requerir(nombre) {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === '') {
    throw new Error(`Falta la variable de entorno obligatoria: ${nombre}`);
  }
  return valor.trim();
}

function numero(nombre, porDefecto) {
  const valor = process.env[nombre];
  return valor === undefined || valor === '' ? porDefecto : Number(valor);
}

function booleano(nombre, porDefecto) {
  const valor = process.env[nombre];
  return valor === undefined || valor === '' ? porDefecto : valor.toLowerCase() === 'true';
}

export const env = Object.freeze({
  port: numero('PORT', 8000),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  databaseUrl: requerir('DATABASE_URL'),
  // Rol de solo lectura para el agente de datos (ver scripts/crear-rol-lectura.js)
  databaseUrlLectura: process.env.DATABASE_URL_LECTURA?.trim() || null,
  dbSslRejectUnauthorized: booleano('DB_SSL_REJECT_UNAUTHORIZED', false),

  deepseekApiKey: requerir('DEEPSEEK_API_KEY'),
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
  deepseekModel: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
  deepseekTimeoutMs: numero('DEEPSEEK_TIMEOUT_MS', 30000),

  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),

  latencyWarningMs: numero('LATENCY_WARNING_MS', 3000),

  // Reporte diario automático a las 7:00 a. m. (hora de Costa Rica). Desactivar con REPORTE_AUTOMATICO=false.
  reporteAutomatico: booleano('REPORTE_AUTOMATICO', true),
});
