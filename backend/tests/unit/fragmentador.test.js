import { describe, expect, it } from '@jest/globals';
import { fragmentosCalendario, fragmentosPolitica } from '../../src/rag/fragmentador.js';

const meta = { codigo: 'POL-02', version: '1.4', drive_file_id: 'x' };

describe('fragmentación de políticas', () => {
  it('formato Google Doc: encabezados con negritas, puntos escapados y metadatos en citas', () => {
    const texto = [
      '# **Política de permisos**',
      '',
      '> * **Versión:** 1.4  ',
      '> * **Responsable:** Recursos Humanos',
      '',
      '## **1\\. Permisos con goce**',
      '',
      '**1.1.** Fallecimiento de un familiar directo: 5 días hábiles.',
      '**1.2.** Matrimonio: 3 días hábiles.',
      '',
      '## **2\\. Licencias**',
      '',
      '| Tipo | Días |',
      '| :---- | :---- |',
      '| Maternidad | [Por validar: 4 meses] |',
    ].join('\n');

    const fragmentos = fragmentosPolitica(texto, meta);
    const puntos = fragmentos.filter((f) => f.tipo_fragmento === 'punto');
    expect(puntos.map((f) => f.punto)).toEqual(['1.1', '1.2']);
    expect(puntos[0].seccion).toBe(1);
    expect(puntos[0].metadatos_documento).toMatch(/Versión: 1\.4/);
    // La sección 2 no tiene puntos: su tabla se guarda como fragmento de sección y conserva la marca
    const seccion2 = fragmentos.find((f) => f.tipo_fragmento === 'seccion' && f.seccion === 2);
    expect(seccion2.contenido).toMatch(/Por validar: 4 meses/);
    expect(seccion2.por_validar).toBe(true);
  });

  it('formato PDF: secciones "1. Título" sin almohadilla y puntos en varias líneas', () => {
    const texto = [
      'Política de vacaciones',
      'Versión: 2.1',
      'Vigencia: 1 de enero de 2026',
      '1. Días de vacaciones',
      '1.1. Todo colaborador tiene derecho a 15 días',
      'hábiles por año.',
      '1.2. Diferencia con la ley: el mínimo es dos semanas.',
    ].join('\n');

    const fragmentos = fragmentosPolitica(texto, { codigo: 'POL-01', version: '2.1' });
    const primero = fragmentos.find((f) => f.punto === '1.1');
    expect(primero.contenido).toBe('Todo colaborador tiene derecho a 15 días hábiles por año.');
    expect(primero.metadatos_documento).toMatch(/Vigencia: 1 de enero de 2026/);
    expect(fragmentos.filter((f) => f.tipo_fragmento === 'punto')).toHaveLength(2);
  });

  it('una línea numerada que no es la siguiente sección no abre una sección nueva', () => {
    const texto = ['## 1. Inicio', '1.1. Primer punto', '3. Esto no es una sección', 'continúa el primer punto'].join('\n');
    const fragmentos = fragmentosPolitica(texto, meta);
    expect(fragmentos.every((f) => f.seccion === 1)).toBe(true);
  });

  it('el calendario se indexa fila por fila con estado de verificación', () => {
    const csv = [
      'fecha,tipo,descripcion,estado_verificacion',
      '2026-12-01,feriado,Abolición del Ejército,por validar (confirmar)',
      '2026-12-15,aguinaldo,"Aguinaldo, planilla",empresa',
    ].join('\n');
    const fragmentos = fragmentosCalendario(csv, { codigo: 'POL-CAL', version: null });
    expect(fragmentos).toHaveLength(2);
    expect(fragmentos[0].por_validar).toBe(true);
    expect(fragmentos[1].fila.descripcion).toBe('Aguinaldo, planilla');
  });
});
