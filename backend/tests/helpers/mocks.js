/**
 * Simulaciones compartidas: base de datos (Supabase) y DeepSeek.
 * Se registran antes de importar la aplicación, así que ningún test toca la red ni una base real.
 *
 * resolverSql responde según el texto SQL. Los datos imitan los registros de database/schema.sql.
 */
import { jest } from '@jest/globals';

export const USUARIOS = [
  { id: 1, nombre: 'Ana Gutiérrez Rojas', email: 'ana.gutierrez@innovacionescr.com', rol: 'rrhh', estado: 'activo' },
  { id: 2, nombre: 'Carlos Mora Jiménez', email: 'carlos.mora@innovacionescr.com', rol: 'colaborador', estado: 'activo' },
  { id: 5, nombre: 'Luis Alberto Quesada', email: 'luis.quesada@innovacionescr.com', rol: 'colaborador', estado: 'inactivo' },
];

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

export function resolverSql(texto, valores = []) {
  const sql = texto.replace(/\s+/g, ' ');

  if (sql.includes('SELECT 1')) return { rows: [{ '?column?': 1 }] };

  if (sql.includes('WHERE id = $1 AND estado')) {
    const u = USUARIOS.find((x) => x.id === valores[0] && x.estado === 'activo');
    return { rows: u ? [{ id: u.id, nombre: u.nombre, rol: u.rol }] : [] };
  }
  if (sql.includes('WHERE lower(email) = lower($1)')) {
    const u = USUARIOS.find((x) => x.email === valores[0] && x.estado === 'activo');
    return { rows: u ? [{ id: u.id, nombre: u.nombre, rol: u.rol }] : [] };
  }

  if (sql.includes('INSERT INTO consultas_chat')) return { rows: [{ id: 77 }] };
  if (sql.includes('FROM consultas_chat WHERE colaborador_id')) {
    return { rows: [{ id: 77, pregunta: '¿Cuántos días me quedan?', resuelta: true }] };
  }

  if (sql.includes('INSERT INTO reportes_diarios')) {
    return {
      rows: [{ id: 1, fecha: valores[0], datos_json: JSON.parse(valores[1]), resumen_texto: valores[2], generado_por: valores[3] }],
    };
  }
  if (sql.includes('FROM reportes_diarios')) {
    return { rows: [{ id: 1, fecha: '2026-11-16', datos_json: METRICAS_DIA, resumen_texto: 'Resumen', generado_por: 'agente_analista' }] };
  }
  if (sql.includes('solicitudes_aprobadas_dia')) return { rows: [METRICAS_DIA] };

  if (sql.includes('tasa_resolucion_30d')) {
    return {
      rows: [{
        solicitudes_pendientes: 3,
        colaboradores_activos: 4,
        incapacidades_mes: 1,
        consultas_hoy: 2,
        tasa_resolucion_30d: '66.7',
      }],
    };
  }
  if (sql.includes('GROUP BY dia')) return { rows: [{ dia: '2026-11-16', total: 3 }] };
  if (sql.includes('JOIN colaboradores c ON c.id = s.colaborador_id')) {
    return { rows: [{ id: 9, colaborador: 'Carlos Mora Jiménez', tipo: 'vacaciones', fecha_inicio: '2026-12-21', fecha_fin: '2026-12-31' }] };
  }

  if (sql.includes('ORDER BY c.departamento')) {
    return { rows: USUARIOS.map(({ id, nombre, email, rol, estado }) => ({ id, nombre, email, rol, estado })) };
  }
  if (sql.includes('FROM saldos_vacaciones')) {
    return { rows: [{ periodo: '2026', dias_asignados: '15.00', dias_tomados: '4.00', dias_disponibles: '11.00' }] };
  }
  if (sql.includes('WHERE id = $1') && !sql.includes('estado')) {
    const u = USUARIOS.find((x) => x.id === valores[0]);
    return { rows: u ? [{ id: u.id, nombre: u.nombre, departamento: 'Tecnología', puesto: 'Desarrollador', fecha_ingreso: '2022-08-15', rol: u.rol }] : [] };
  }

  if (sql.includes('FROM solicitudes') || sql.includes('FROM incapacidades')) return { rows: [] };
  return { rows: [] };
}

export const query = jest.fn(resolverSql);
export const verificarConexion = jest.fn(async () => true);
export const deepseekCreate = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  query,
  queryLectura: query,
  verificarConexion,
  default: {},
}));

jest.unstable_mockModule('../../src/config/deepseek.js', () => ({
  clienteDeepSeek: { chat: { completions: { create: deepseekCreate } } },
  modeloDeepSeek: 'deepseek-chat',
}));

/** Respuesta con forma de chat completion de DeepSeek. */
export function respuestaModelo(contenido) {
  return { choices: [{ message: { content: contenido } }] };
}

/** Reinicia el estado de los mocks entre tests. */
export function resetearMocks() {
  query.mockReset();
  query.mockImplementation(resolverSql);
  deepseekCreate.mockReset();
  verificarConexion.mockReset();
  verificarConexion.mockResolvedValue(true);
}

/** Importa la aplicación Express después de registrar los mocks. */
export async function cargarApp() {
  return (await import('../../src/app.js')).app;
}
