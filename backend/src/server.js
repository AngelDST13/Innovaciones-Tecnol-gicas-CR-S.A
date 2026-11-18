/**
 * Punto de entrada: arranca el servidor HTTP.
 * Ejecución: npm run dev   (desde backend/)
 */
import { app } from './app.js';
import { env } from './config/env.js';
import { iniciarProgramadorReporte, ponerseAlDia } from './jobs/programadorReporte.js';
import { existeReporte } from './services/reportesService.js';

app.listen(env.port, () => {
  console.log(`API de RRHH escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
  if (env.reporteAutomatico) {
    iniciarProgramadorReporte();
    console.log('Reporte diario automático programado para las 7:00 a. m. (hora de Costa Rica).');
    ponerseAlDia({ existeReporte }).catch((error) => console.error('No se pudo generar el reporte al arrancar:', error.message));
  }
});
