import { beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { cargarApp, db, resetearMocks } from '../helpers/mocks.js';

const app = await cargarApp();

describe('middlewares de seguridad y operación', () => {
  beforeEach(() => resetearMocks());

  it('CORS: habilita el origen del frontend en la lista blanca', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('CORS: no habilita orígenes fuera de la lista blanca', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://sitio-ajeno.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('latencia: cada respuesta incluye X-Latencia-Ms en milisegundos', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-latencia-ms']).toBeDefined();
    expect(Number(res.headers['x-latencia-ms'])).toBeGreaterThanOrEqual(0);
  });

  it('latencia: también se expone en respuestas de error', async () => {
    const res = await request(app).get('/ruta-que-no-existe');
    expect(res.headers['x-latencia-ms']).toBeDefined();
  });

  it('health: responde 200 cuando la base de datos responde', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('health: responde 503 cuando la base de datos no responde', async () => {
    db.errorSiguiente = { message: 'base no disponible' };
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degradado');
  });

  it('404 para rutas inexistentes, con respuesta JSON', async () => {
    const res = await request(app).get('/api/v1/no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Ruta no encontrada.' });
  });

  it('error no controlado: responde 500 genérico sin filtrar detalles internos', async () => {
    // La primera consulta (autenticación) funciona; la segunda (KPIs) falla.
    // La primera operación (autenticación) funciona; la segunda (KPIs del dashboard) falla
    db.erroresEnCola = [null, { message: 'detalle interno secreto' }];

    const res = await request(app).get('/api/v1/dashboard/resumen').set('X-User-Id', '1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error interno del servidor.' });
    expect(JSON.stringify(res.body)).not.toContain('secreto');
  });

  it('login con la base de datos caída responde 503 amigable, no 500', async () => {
    const errorRed = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
    db.errorSiguiente = errorRed;

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana.gutierrez@innovacionescr.com' });

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/base de datos/);
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });

  it('rechaza cuerpos mayores al límite (413)', async () => {
    const pregunta = 'a'.repeat(20_000);
    const res = await request(app)
      .post('/api/v1/chat/mensajes')
      .set('X-User-Id', '2')
      .send({ pregunta });

    expect(res.status).toBe(413);
  });
});
