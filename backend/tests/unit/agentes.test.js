import { beforeEach, describe, expect, it } from '@jest/globals';
import { AGENTES } from '../../src/agents/registro.js';
import { validarRespuesta } from '../../src/agents/validadorAgent.js';
import { db, deepseekCreate, respuestaModelo, resetearMocks } from '../helpers/mocks.js';

const { responderPagos } = await import('../../src/agents/pagosAgent.js');
const { responderDesempeno } = await import('../../src/agents/desempenoAgent.js');
const { procesarConsulta } = await import('../../src/agents/orchestrator.js');

const usuario = { id: 2, nombre: 'Carlos Mora Jiménez', rol: 'colaborador' };
const clasificar = (intencion) => respuestaModelo(JSON.stringify({ intencion, motivo: 'prueba' }));

describe('registro de agentes', () => {
  it('el sistema tiene 10 agentes: 5 obligatorios, 2 opcionales del spec y 3 propuestos por el equipo', () => {
    expect(AGENTES).toHaveLength(10);
    expect(AGENTES.filter((a) => a.origen === 'spec (obligatorio)')).toHaveLength(5);
    expect(AGENTES.filter((a) => a.origen === 'spec (opcional)')).toHaveLength(2);
    expect(AGENTES.filter((a) => a.origen === 'equipo')).toHaveLength(3);
  });
});

describe('agente de pagos (pregunta 9)', () => {
  beforeEach(() => resetearMocks());

  it('devuelve el próximo pago a partir de hoy desde calendario_pagos', async () => {
    const r = await responderPagos('2026-11-17');
    expect(r.respuesta).toMatch(/30 de noviembre de 2026/);
    expect(r.citas[0].documento).toMatch(/POL-05/);
  });

  it('si no hay pagos futuros lo dice', async () => {
    const r = await responderPagos('2027-01-01');
    expect(r.respuesta).toMatch(/No hay un pago programado/);
  });
});

describe('agente de desempeño (pregunta 17)', () => {
  beforeEach(() => resetearMocks());

  it('devuelve la fecha de la evaluación del propio colaborador', async () => {
    const r = await responderDesempeno(2, '2026-11-17');
    expect(r.respuesta).toMatch(/4 de diciembre de 2026/);
  });

  it('sin evaluación programada lo indica', async () => {
    const r = await responderDesempeno(3, '2026-11-17');
    expect(r.respuesta).toMatch(/No tienes una evaluación/);
  });
});

describe('agente validador', () => {
  const documentos = [{ documento: 'POL-01 Vacaciones y feriados v2.1', seccion: 'Sección 1', enlace: null }];

  it('rechaza una cita de un documento que no se recuperó', () => {
    const v = validarRespuesta({ respuesta: 'Según [POL-09, punto 3.1] el plazo es 30 días.', documentos });
    expect(v.valida).toBe(false);
  });

  it('acepta citas de documentos recuperados', () => {
    const v = validarRespuesta({ respuesta: 'Son 15 días [POL-01, punto 1.1].', documentos });
    expect(v).toEqual({ valida: true, respuesta: 'Son 15 días [POL-01, punto 1.1].' });
  });

  it('si la respuesta no trae fuente, agrega la del primer documento', () => {
    const v = validarRespuesta({ respuesta: 'Son 15 días.', documentos });
    expect(v.respuesta).toMatch(/Fuente: POL-01 Vacaciones y feriados v2\.1\./);
  });
});

describe('enrutamiento del orquestador', () => {
  beforeEach(() => resetearMocks());

  it('una pregunta de pagos se responde con el agente de pagos, sin llamar al modelo para responder', async () => {
    deepseekCreate.mockResolvedValueOnce(clasificar('dato_personal'));
    const r = await procesarConsulta({ pregunta: '¿Qué día cae mi próximo pago?', usuario });
    expect(r.respuesta).toMatch(/30 de noviembre de 2026/);
    expect(deepseekCreate).toHaveBeenCalledTimes(1); // solo la clasificación
  });

  it('una pregunta de evaluación se responde con el agente de desempeño', async () => {
    deepseekCreate.mockResolvedValueOnce(clasificar('dato_personal'));
    const r = await procesarConsulta({ pregunta: '¿Cuándo es mi próxima evaluación de desempeño?', usuario });
    expect(r.respuesta).toMatch(/4 de diciembre de 2026/);
  });

  it('una política sin respuesta en los documentos crea un ticket de escalamiento', async () => {
    deepseekCreate.mockResolvedValueOnce(clasificar('politica'));
    const r = await procesarConsulta({ pregunta: '¿La empresa da bono por mascotas?', usuario });
    expect(r.escalada).toBe(true);
    expect(r.respuesta).toMatch(/ticket #\d+/);
    expect(db.tablas.tickets_escalamiento).toHaveLength(1);
    expect(db.tablas.tickets_escalamiento[0]).toMatchObject({ colaborador_id: 2, estado: 'abierto', motivo: 'sin_respuesta_en_documentos' });
  });
});
