import { beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

// Token de programación de prueba: se fija antes de cargar la aplicación
process.env.REPORTE_CRON_TOKEN = 'token-de-prueba-cron';
const { cargarApp, resetearMocks } = await import('../helpers/mocks.js');
const app = await cargarApp();

describe('POST /api/v1/reportes/automatico (programador externo)', () => {
  beforeEach(() => resetearMocks());

  it('sin la cabecera X-Token-Cron responde 401 y no genera nada', async () => {
    const res = await request(app).post('/api/v1/reportes/automatico');
    expect(res.status).toBe(401);
  });

  it('con un token incorrecto responde 401', async () => {
    const res = await request(app).post('/api/v1/reportes/automatico').set('X-Token-Cron', 'otro-token');
    expect(res.status).toBe(401);
  });

  it('con el token correcto genera el reporte de hoy una sola vez', async () => {
    const primera = await request(app).post('/api/v1/reportes/automatico').set('X-Token-Cron', 'token-de-prueba-cron');
    expect(primera.status).toBe(200);
    expect(primera.body).toMatchObject({ generado: true });

    const segunda = await request(app).post('/api/v1/reportes/automatico').set('X-Token-Cron', 'token-de-prueba-cron');
    expect(segunda.body).toMatchObject({ generado: false, motivo: 'ya existía' });
  });
});
