import { beforeEach, describe, expect, it } from '@jest/globals';
import { db, deepseekCreate, respuestaModelo, resetearMocks } from '../helpers/mocks.js';

const { procesarConsulta, clasificarIntencion, OrquestadorNoDisponible } = await import(
  '../../src/agents/orchestrator.js'
);

const usuario = { id: 2, nombre: 'Carlos Mora Jiménez', rol: 'colaborador' };

function clasificar(intencion) {
  return respuestaModelo(JSON.stringify({ intencion, motivo: 'prueba' }));
}

describe('orquestador', () => {
  beforeEach(() => resetearMocks());

  it('bloquea preguntas trampa sin llamar al modelo', async () => {
    const resultado = await procesarConsulta({
      pregunta: '¿Cuál es el salario del gerente de Tecnología?',
      usuario,
    });

    expect(resultado).toMatchObject({ intencion: 'restringida', bloqueada: true, resuelta: true, agente: 'ninguno' });
    expect(deepseekCreate).not.toHaveBeenCalled();
  });

  it('falla cerrado si el modelo devuelve una salida que no es JSON', async () => {
    deepseekCreate.mockResolvedValueOnce(respuestaModelo('no es json'));

    const clasificacion = await clasificarIntencion('¿Cuántos días me quedan?');
    expect(clasificacion.intencion).toBe('fuera_de_alcance');
  });

  it('trata como fuera de alcance una intención que no está en la lista', async () => {
    deepseekCreate.mockResolvedValueOnce(clasificar('hackear_base'));

    const resultado = await procesarConsulta({ pregunta: 'Quiero entrar al sistema', usuario });
    expect(resultado).toMatchObject({ intencion: 'fuera_de_alcance', bloqueada: true });
    expect(deepseekCreate).toHaveBeenCalledTimes(1);
  });

  it('lanza OrquestadorNoDisponible si DeepSeek no responde', async () => {
    deepseekCreate.mockRejectedValueOnce(new Error('timeout'));

    await expect(clasificarIntencion('¿Cuántos días me quedan?')).rejects.toBeInstanceOf(OrquestadorNoDisponible);
  });

  it('enruta dato_personal al agente de datos filtrando siempre por el id del usuario', async () => {
    deepseekCreate
      .mockResolvedValueOnce(clasificar('dato_personal'))
      .mockResolvedValueOnce(respuestaModelo('Te quedan 11 días.'));

    const resultado = await procesarConsulta({ pregunta: '¿Cuántos días de vacaciones me quedan?', usuario });

    expect(resultado).toMatchObject({ intencion: 'dato_personal', agente: 'datos', resuelta: true, respuesta: 'Te quedan 11 días.' });
    // Todas las consultas SQL del agente reciben el id autenticado como primer parámetro
    const tablasDelAgente = ['saldos_vacaciones', 'solicitudes', 'incapacidades'];
    const filtrosPorId = db.igualdades.filter(([tabla, col]) => tablasDelAgente.includes(tabla) && col === 'colaborador_id');
    expect(filtrosPorId.length).toBeGreaterThan(0);
    expect(filtrosPorId.every(([, , valor]) => valor === usuario.id)).toBe(true);
  });

  it('enruta política al agente de políticas, que aún no resuelve (sin citas inventadas)', async () => {
    deepseekCreate.mockResolvedValueOnce(clasificar('politica'));

    const resultado = await procesarConsulta({ pregunta: '¿Cuál es la política de teletrabajo?', usuario });

    expect(resultado).toMatchObject({ intencion: 'politica', agente: 'politicas', resuelta: false, citas: [] });
  });

  it('enruta mixta a datos y políticas', async () => {
    deepseekCreate
      .mockResolvedValueOnce(clasificar('mixta'))
      .mockResolvedValueOnce(respuestaModelo('Tienes 11 días disponibles.'));

    const resultado = await procesarConsulta({ pregunta: '¿Cuántos días me quedan según la política?', usuario });

    expect(resultado.agente).toBe('politicas_datos');
    expect(resultado.resuelta).toBe(false);
    expect(resultado.respuesta).toContain('Tienes 11 días disponibles.');
  });
});
