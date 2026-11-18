import { beforeEach, describe, expect, it } from '@jest/globals';
import { db, deepseekCreate, resetearMocks } from '../helpers/mocks.js';

const { procesarConsulta } = await import('../../src/agents/orchestrator.js');
const { responderFeriados } = await import('../../src/agents/feriadosAgent.js');
const { PATRON_AGREGADO_AUSENCIAS, responderAgregadoAusencias } = await import('../../src/agents/agregadosAgent.js');

const colaborador = { id: 2, rol: 'colaborador' };
const rrhh = { id: 1, rol: 'rrhh' };

describe('feriados desde el calendario oficial', () => {
  beforeEach(() => resetearMocks());

  it('lista solo los feriados posteriores a hoy, con fecha en español y los pendientes marcados', async () => {
    const r = await responderFeriados('2026-11-18');
    expect(r.respuesta).toContain('1 de diciembre: Abolición del Ejército (pendiente de validar)');
    expect(r.respuesta).toContain('25 de diciembre: Navidad');
    expect(r.respuesta).not.toContain('Año Nuevo');
    expect(r.citas).toEqual([
      { documento: 'POL-CAL Calendario de feriados y pagos 2026', seccion: 'Calendario', enlace: 'https://drive.google.com/file/d/cal-2026/view' },
    ]);
  });

  it('si no quedan feriados, lo dice sin inventar fechas', async () => {
    const r = await responderFeriados('2027-01-05');
    expect(r.respuesta).toBe('No quedan feriados en el calendario de este año.');
  });

  it('ignora el calendario de un documento eliminado', async () => {
    db.tablas.documentos_politica.find((d) => d.id === 10).eliminado = true;
    const r = await responderFeriados('2026-11-18');
    expect(r.respuesta).toBe('No quedan feriados en el calendario de este año.');
  });

  it('el orquestador responde feriados sin llamar al modelo de respuesta', async () => {
    deepseekCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ intencion: 'politica', motivo: 'x' }) } }] });
    const r = await procesarConsulta({ pregunta: '¿Qué feriados quedan este año?', usuario: colaborador });
    expect(r).toMatchObject({ intencion: 'politica', agente: 'politicas', bloqueada: false, resuelta: true });
    expect(r.respuesta).toContain('25 de diciembre');
    expect(deepseekCreate).toHaveBeenCalledTimes(1); // solo la clasificación
  });
});

describe('conteo de ausencias para RRHH', () => {
  beforeEach(() => resetearMocks());

  it('reconoce la pregunta de conteo y no la de datos individuales', () => {
    expect(PATRON_AGREGADO_AUSENCIAS.test('¿Cuántas personas están de vacaciones hoy?')).toBe(true);
    expect(PATRON_AGREGADO_AUSENCIAS.test('¿Cuántos días de vacaciones me quedan?')).toBe(false);
  });

  it('RRHH recibe el conteo de vacaciones aprobadas que cubren el día', async () => {
    // María Solís tiene vacaciones aprobadas del 14 al 20 de noviembre de 2026
    const r = await responderAgregadoAusencias('2026-11-16');
    expect(r.respuesta).toContain('1 persona está de vacaciones aprobadas');
    expect(r.respuesta).toContain('1 con incapacidad activa');
  });

  it('un colaborador no obtiene el conteo: la consulta se bloquea sin llamar al modelo', async () => {
    const r = await procesarConsulta({ pregunta: '¿Cuántas personas están de vacaciones hoy?', usuario: colaborador });
    expect(r).toMatchObject({ intencion: 'restringida', bloqueada: true });
    expect(deepseekCreate).not.toHaveBeenCalled();
  });

  it('RRHH obtiene el conteo desde el orquestador, sin clasificar la pregunta', async () => {
    const r = await procesarConsulta({ pregunta: '¿Cuántas personas están de vacaciones hoy?', usuario: rrhh });
    expect(r).toMatchObject({ agente: 'datos', bloqueada: false, resuelta: true });
    expect(r.respuesta).toMatch(/de vacaciones aprobadas/);
    expect(deepseekCreate).not.toHaveBeenCalled();
  });
});
