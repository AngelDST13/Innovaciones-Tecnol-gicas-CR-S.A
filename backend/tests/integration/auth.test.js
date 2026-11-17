import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { cargarApp, resetearMocks } from '../helpers/mocks.js';

const app = await cargarApp();

describe('API de autenticación', () => {
  beforeAll(() => resetearMocks());
  beforeEach(() => resetearMocks());

  it('inicia sesión con un correo activo y devuelve el rol', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana.gutierrez@innovacionescr.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, nombre: 'Ana Gutiérrez Rojas', rol: 'rrhh' });
  });

  it('responde 404 con mensaje amigable si el correo no existe', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'nadie@innovacionescr.com' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Usuario no encontrado/);
  });

  it('responde 404 si el colaborador está inactivo (no se considera un usuario activo)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'luis.quesada@innovacionescr.com' });
    expect(res.status).toBe(404);
  });

  it('responde 400 con mensaje amigable si falta el correo', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/correo corporativo válido/);
  });

  it('rechaza un correo con formato inválido (400)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'no-es-correo' });
    expect(res.status).toBe(400);
  });

  it('rechaza un cuerpo JSON mal formado (400)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JSON/);
  });

  it('GET /sesion sin cabecera X-User-Id responde 401', async () => {
    const res = await request(app).get('/api/v1/auth/sesion');
    expect(res.status).toBe(401);
  });

  it('GET /sesion con un id no numérico responde 401', async () => {
    const res = await request(app).get('/api/v1/auth/sesion').set('X-User-Id', 'abc');
    expect(res.status).toBe(401);
  });

  it('GET /sesion con un colaborador válido devuelve su identidad', async () => {
    const res = await request(app).get('/api/v1/auth/sesion').set('X-User-Id', '2');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 2, rol: 'colaborador' });
  });
});
