/**
 * Punto de entrada: arranca el servidor HTTP.
 * Ejecución: npm run dev   (desde backend/)
 */
import { app } from './app.js';
import { env } from './config/env.js';
import { iniciarProgramadorReporte } from './jobs/programadorReporte.js';

app.listen(env.port, () => {
  console.log(`API de RRHH escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
  if (env.reporteAutomatico) {
    iniciarProgramadorReporte();
    console.log('Reporte diario automático programado para las 7:00 a. m. (hora de Costa Rica).');
  }
});
