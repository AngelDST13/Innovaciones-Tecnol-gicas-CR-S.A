import { beforeEach, describe, expect, it } from '@jest/globals';
import { deepseekCreate, METRICAS_DIA, respuestaModelo, resetearMocks } from '../helpers/mocks.js';

const { cifrasVerificadas, generarResumenEjecutivo, resumenDeterministico } = await import(
  '../../src/agents/analistaAgent.js'
);

const metricas = { fecha: '2026-11-16', ventana_rotacion_dias: 30, ...METRICAS_DIA, tasa_rotacion_30d: 20 };

describe('agente analista: verificación de cifras', () => {
  beforeEach(() => resetearMocks());

  it('acepta un resumen que solo usa cifras presentes en las métricas', () => {
    expect(cifrasVerificadas('Hay 3 solicitudes pendientes y la rotación es 20 %.', metricas)).toBe(true);
  });

  it('rechaza un resumen con una cifra inventada', () => {
    expect(cifrasVerificadas('Hay 47 solicitudes pendientes.', metricas)).toBe(false);
  });

  it('usa la plantilla determinista cuando el modelo inventa cifras', async () => {
    deepseekCreate.mockResolvedValueOnce(respuestaModelo('Se registraron 999 consultas hoy.'));

    const resultado = await generarResumenEjecutivo(metricas);

    expect(resultado.generado_por).toBe('plantilla_determinista');
    expect(resultado.resumen_texto).toBe(resumenDeterministico(metricas));
    expect(resultado.resumen_texto).not.toContain('999');
  });

  it('usa la plantilla si DeepSeek falla', async () => {
    deepseekCreate.mockRejectedValueOnce(new Error('sin conexión'));

    const resultado = await generarResumenEjecutivo(metricas);
    expect(resultado.generado_por).toBe('plantilla_determinista');
  });

  it('acepta el resumen del modelo cuando sus cifras son verificables', async () => {
    deepseekCreate.mockResolvedValueOnce(respuestaModelo('Hay 3 solicitudes pendientes y 1 salida en 30 días.'));

    const resultado = await generarResumenEjecutivo(metricas);
    expect(resultado).toEqual({
      resumen_texto: 'Hay 3 solicitudes pendientes y 1 salida en 30 días.',
      generado_por: 'agente_analista',
    });
  });
});
