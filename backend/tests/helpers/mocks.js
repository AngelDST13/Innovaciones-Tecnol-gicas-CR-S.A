/**
 * Simulaciones compartidas para las pruebas: base de datos (Supabase), DeepSeek y embeddings.
 * Se registran antes de importar la aplicación: ninguna prueba toca la red ni una base real.
 * Los datos imitan los registros de database/schema.sql y del seed 002.
 */
import { jest } from '@jest/globals';
import { FakeSupabase } from './supabaseFake.js';

const SEED = {
  colaboradores: [
    { id: 1, nombre: 'Ana Gutiérrez Rojas', email: 'ana.gutierrez@innovacionescr.com', departamento: 'Recursos Humanos', puesto: 'Jefa de Recursos Humanos', fecha_ingreso: '2019-03-01', jefe_id: null, rol: 'rrhh', estado: 'activo' },
    { id: 2, nombre: 'Carlos Mora Jiménez', email: 'carlos.mora@innovacionescr.com', departamento: 'Tecnología', puesto: 'Desarrollador Backend', fecha_ingreso: '2022-08-15', jefe_id: 4, rol: 'colaborador', estado: 'activo' },
    { id: 3, nombre: 'María Fernanda Solís', email: 'maria.solis@innovacionescr.com', departamento: 'Finanzas', puesto: 'Analista Financiera', fecha_ingreso: '2021-01-18', jefe_id: null, rol: 'colaborador', estado: 'activo' },
    { id: 4, nombre: 'Roberto Vargas Chaves', email: 'roberto.vargas@innovacionescr.com', departamento: 'Tecnología', puesto: 'Gerente de Tecnología', fecha_ingreso: '2018-06-01', jefe_id: null, rol: 'colaborador', estado: 'activo' },
    { id: 5, nombre: 'Luis Alberto Quesada', email: 'luis.quesada@innovacionescr.com', departamento: 'Tecnología', puesto: 'Desarrollador Frontend', fecha_ingreso: '2023-02-06', jefe_id: 4, rol: 'colaborador', estado: 'inactivo' },
  ],
  saldos_vacaciones: [
    { id: 1, colaborador_id: 1, periodo: '2026', dias_asignados: '15.00', dias_tomados: '6.00', dias_disponibles: '9.00' },
    { id: 2, colaborador_id: 2, periodo: '2026', dias_asignados: '15.00', dias_tomados: '4.00', dias_disponibles: '11.00' },
    { id: 3, colaborador_id: 3, periodo: '2026', dias_asignados: '15.00', dias_tomados: '10.00', dias_disponibles: '5.00' },
    { id: 4, colaborador_id: 4, periodo: '2026', dias_asignados: '30.00', dias_tomados: '2.00', dias_disponibles: '28.00' },
  ],
  solicitudes: [
    { id: 1, colaborador_id: 2, tipo: 'vacaciones', fecha_inicio: '2026-12-21', fecha_fin: '2026-12-31', estado: 'pendiente', aprobador_id: 4, creada_en: '2026-11-10T15:15:00Z' },
    { id: 2, colaborador_id: 3, tipo: 'vacaciones', fecha_inicio: '2026-11-14', fecha_fin: '2026-11-20', estado: 'aprobada', aprobador_id: 1, creada_en: '2026-10-28T15:00:00Z' },
    { id: 3, colaborador_id: 5, tipo: 'licencia', fecha_inicio: '2026-11-20', fecha_fin: '2026-11-22', estado: 'pendiente', aprobador_id: null, creada_en: '2026-11-05T17:00:00Z' },
  ],
  incapacidades: [
    { id: 1, colaborador_id: 3, tipo: 'enfermedad', fecha_inicio: '2026-11-15', dias: 5, entidad: 'CCSS' },
  ],
  movimientos_personal: [
    { id: 1, colaborador_id: 5, tipo: 'salida', fecha: '2026-11-10', motivo: 'Fin de contrato' },
    { id: 2, colaborador_id: 2, tipo: 'ingreso', fecha: '2026-11-02', motivo: 'Contratación' },
  ],
  consultas_chat: [
    { id: 1, colaborador_id: 2, pregunta: '¿Cuántos días me quedan?', intencion: 'dato_personal', agente: 'datos', resuelta: true, escalada: false, latencia_ms: 412, fecha: '2026-11-15T15:00:00Z', tema: 'vacaciones' },
    { id: 2, colaborador_id: 2, pregunta: '¿Cuál es la política de teletrabajo?', intencion: 'politica', agente: 'politicas', resuelta: false, escalada: false, latencia_ms: 1380, fecha: '2026-11-15T15:05:00Z', tema: 'teletrabajo' },
    { id: 3, colaborador_id: 3, pregunta: '¿Cuánto gana el gerente?', intencion: 'restringida', agente: 'ninguno', resuelta: true, escalada: false, latencia_ms: 35, fecha: '2026-11-16T16:12:00Z', tema: 'seguridad' },
  ],
  reportes_diarios: [
    { id: 1, fecha: '2026-11-16', datos_json: { solicitudes_pendientes: 3, colaboradores_activos: 4 }, resumen_texto: 'Resumen de prueba', generado_por: 'agente_analista' },
  ],
  fragmentos_politica: [],
  documentos_politica: [],
};

export const db = new FakeSupabase(SEED);

/** Métricas de referencia para las pruebas del analista (mismas cifras que los datos de prueba). */
export const METRICAS_DIA = {
  solicitudes_pendientes: 3,
  solicitudes_aprobadas_dia: 1,
  solicitudes_rechazadas_dia: 0,
  colaboradores_activos: 4,
  colaboradores_inactivos: 1,
  incapacidades_activas: 0,
  salidas_ultimos_30_dias: 1,
  consultas_chat_dia: 3,
  consultas_resueltas_dia: 2,
};

// Base de datos simulada: la capa de datos del backend usa este cliente
jest.unstable_mockModule('../../src/config/supabase.js', () => ({ supabase: db }));

export const deepseekCreate = jest.fn();

jest.unstable_mockModule('../../src/config/deepseek.js', () => ({
  clienteDeepSeek: { chat: { completions: { create: deepseekCreate } } },
  modeloDeepSeek: 'deepseek-chat',
}));

// Embeddings simulados: vectores de ceros (no descarga el modelo en las pruebas)
jest.unstable_mockModule('../../src/rag/embeddings.js', () => ({
  MODELO_EMBEDDINGS: 'simulado',
  DIMENSIONES: 384,
  vectorizarFragmentos: async (textos) => textos.map(() => new Array(384).fill(0)),
  vectorizarPregunta: async () => new Array(384).fill(0),
  aTextoVector: (v) => `[${v.join(',')}]`,
}));

/** Respuesta con forma de chat completion de DeepSeek. */
export function respuestaModelo(contenido) {
  return { choices: [{ message: { content: contenido } }] };
}

/** Reinicia el estado de los simuladores entre pruebas. */
export function resetearMocks() {
  db.reiniciar(SEED);
  db.erroresEnCola = [];
  db.rpcs = {};
  deepseekCreate.mockReset();
}

/** Importa la aplicación Express después de registrar los simuladores. */
export async function cargarApp() {
  return (await import('../../src/app.js')).app;
}
