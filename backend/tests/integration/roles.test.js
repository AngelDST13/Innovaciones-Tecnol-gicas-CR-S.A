import { beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { cargarApp, deepseekCreate, respuestaModelo, resetearMocks } from '../helpers/mocks.js';

const app = await cargarApp();
const RRHH = '1';
const COLABORADOR = '2';

describe('control de roles', () => {
  beforeEach(() => resetearMocks());

  describe('colaborador (rol colaborador)', () => {
    it.each([
      ['GET', '/api/v1/dashboard/resumen'],
      ['GET', '/api/v1/empleados'],
      ['GET', '/api/v1/reportes'],
      ['POST', '/api/v1/reportes/generar'],
    ])('%s %s responde 403', async (metodo, ruta) => {
      const res = await request(app)[metodo.toLowerCase()](ruta).set('X-User-Id', COLABORADOR).send({});
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/no autorizado/);
    });

    it('puede consultar su propio perfil con saldos', async () => {
      const res = await request(app).get('/api/v1/empleados/mi-perfil').set('X-User-Id', COLABORADOR);

      expect(res.status).toBe(200);
      expect(res.body.saldos_vacaciones[0]).toMatchObject({ dias_asignados: 15, dias_disponibles: 11 });
    });
  });

  describe('sin autenticación', () => {
    it('el dashboard responde 401', async () => {
      const res = await request(app).get('/api/v1/dashboard/resumen');
      expect(res.status).toBe(401);
    });
  });

  describe('rrhh', () => {
    it('ve el dashboard con KPIs, tendencia de 30 días y solicitudes pendientes', async () => {
      const res = await request(app).get('/api/v1/dashboard/resumen').set('X-User-Id', RRHH);

      expect(res.status).toBe(200);
      expect(Object.keys(res.body.kpis)).toEqual(expect.arrayContaining([
        'solicitudes_pendientes',
        'colaboradores_activos',
        'incapacidades_mes',
        'consultas_hoy',
        'tasa_resolucion_30d',
      ]));
      expect(res.body.kpis.tasa_resolucion_30d).toBe(66.7);
      // La tendencia es relativa a la fecha actual: se valida la forma de los datos, no una fecha fija
      expect(Array.isArray(res.body.tendencia_chat_30d)).toBe(true);
      for (const punto of res.body.tendencia_chat_30d) {
        expect(punto).toEqual({ dia: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), total: expect.any(Number) });
      }
      expect(res.body.solicitudes_pendientes[0]).toHaveProperty('colaborador');
    });

    it('lista los colaboradores', async () => {
      const res = await request(app).get('/api/v1/empleados').set('X-User-Id', RRHH);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5); // los 5 colaboradores de los datos de prueba
    });

    it('consulta el historial de reportes', async () => {
      const res = await request(app).get('/api/v1/reportes').set('X-User-Id', RRHH);

      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({ fecha: '2026-11-16', generado_por: 'agente_analista' });
    });

    it('genera el reporte diario con resumen verificado', async () => {
      deepseekCreate.mockResolvedValueOnce(
        respuestaModelo('Hay 3 solicitudes pendientes y 1 salida en 30 días.'),
      );

      const res = await request(app)
        .post('/api/v1/reportes/generar')
        .set('X-User-Id', RRHH)
        .send({ fecha: '2026-11-16' });

      expect(res.status).toBe(200);
      expect(res.body.generado_por).toBe('agente_analista');
      expect(res.body.resumen_texto).toMatch(/3 solicitudes/);
    });

    it('rechaza una fecha de reporte con formato inválido (400)', async () => {
      const res = await request(app)
        .post('/api/v1/reportes/generar')
        .set('X-User-Id', RRHH)
        .send({ fecha: '16/11/2026' });

      expect(res.status).toBe(400);
    });
  });
});
