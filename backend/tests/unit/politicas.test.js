import { beforeEach, describe, expect, it } from '@jest/globals';
import { db, deepseekCreate, respuestaModelo, resetearMocks } from '../helpers/mocks.js';

const { responderPolitica, MENSAJE_NO_ENCONTRADO, UMBRAL_SIMILITUD } = await import('../../src/agents/politicasAgent.js');

const fragmento = (similitud, extra = {}) => ({
  codigo: 'POL-01',
  version: '2.1',
  titulo: 'POL-01 Vacaciones y feriados v2.1',
  seccion: 1,
  seccion_titulo: 'Días de vacaciones',
  punto: '1.1',
  contenido: '15 días hábiles por año.',
  por_validar: false,
  enlace: 'https://drive.google.com/file/d/x/view',
  similitud,
  ...extra,
});

describe('agente de políticas (RAG)', () => {
  beforeEach(() => resetearMocks());

  it('sin fragmentos por encima del umbral: dice que no encontró la política y no llama al modelo', async () => {
    db.rpcs.buscar_fragmentos_politica = () => [fragmento(UMBRAL_SIMILITUD - 0.02)];

    const r = await responderPolitica('¿La empresa da bono por mascotas?');
    expect(r).toEqual({ respuesta: MENSAJE_NO_ENCONTRADO, documentos: [], resuelta: false });
    expect(deepseekCreate).not.toHaveBeenCalled();
  });

  it('con fragmentos relevantes: responde con el modelo y cita documento, sección y punto', async () => {
    db.rpcs.buscar_fragmentos_politica = () => [fragmento(0.92)];
    deepseekCreate.mockResolvedValueOnce(respuestaModelo('Te corresponden 15 días hábiles [POL-01, punto 1.1].'));

    const r = await responderPolitica('¿Cuántos días de vacaciones me corresponden?');
    expect(r.resuelta).toBe(true);
    expect(r.respuesta).toMatch(/15 días hábiles/);
    expect(r.documentos).toEqual([
      { documento: 'POL-01 Vacaciones y feriados v2.1', seccion: 'Sección 1, punto 1.1', enlace: 'https://drive.google.com/file/d/x/view' },
    ]);
  });

  it('el contexto enviado al modelo marca los datos pendientes de validación', async () => {
    db.rpcs.buscar_fragmentos_politica = () => [fragmento(0.9, { por_validar: true, contenido: 'Monto [Por validar: 50 %].' })];
    deepseekCreate.mockResolvedValueOnce(respuestaModelo('Pendiente de validación.'));

    await responderPolitica('¿Quién paga los primeros días de incapacidad?');
    const mensajeUsuario = deepseekCreate.mock.calls[0][0].messages[1].content;
    expect(mensajeUsuario).toMatch(/pendientes de validación/);
    expect(mensajeUsuario).toMatch(/Por validar: 50 %/);
  });
});
