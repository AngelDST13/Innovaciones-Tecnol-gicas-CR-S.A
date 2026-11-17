import { describe, expect, it } from '@jest/globals';
import { milisegundosHastaProximaEjecucion } from '../../src/jobs/programadorReporte.js';

const MINUTO = 60_000;

describe('programador del reporte diario (7:00 a. m. hora de Costa Rica)', () => {
  it('si son las 06:00 CR, la próxima ejecución es en 1 hora', () => {
    // 06:00 CR = 12:00 UTC
    const ahora = new Date('2026-11-17T12:00:00Z');
    expect(milisegundosHastaProximaEjecucion(ahora)).toBe(60 * MINUTO);
  });

  it('justo después de las 07:00 CR, la siguiente ejecución es al día siguiente', () => {
    // 07:00:01 CR = 13:00:01 UTC
    const ahora = new Date('2026-11-17T13:00:01Z');
    expect(milisegundosHastaProximaEjecucion(ahora)).toBe(24 * 60 * MINUTO - 1000);
  });

  it('a las 23:30 CR calcula hasta las 07:00 del día siguiente', () => {
    // 23:30 CR = 05:30 UTC del día siguiente
    const ahora = new Date('2026-11-18T05:30:00Z');
    expect(milisegundosHastaProximaEjecucion(ahora)).toBe(7.5 * 60 * MINUTO);
  });
});
