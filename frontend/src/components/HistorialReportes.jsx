import { useState } from 'react';
import Modal from './Modal.jsx';

const METRICAS = [
  { clave: 'solicitudes_pendientes', etiqueta: 'Solicitudes pendientes' },
  { clave: 'solicitudes_aprobadas_dia', etiqueta: 'Aprobadas en el día' },
  { clave: 'solicitudes_rechazadas_dia', etiqueta: 'Rechazadas en el día' },
  { clave: 'incapacidades_activas', etiqueta: 'Incapacidades activas' },
  { clave: 'consultas_chat_dia', etiqueta: 'Consultas al chat' },
  { clave: 'consultas_resueltas_dia', etiqueta: 'Consultas resueltas' },
  { clave: 'tasa_rotacion_30d', etiqueta: 'Rotación 30 días', sufijo: '%' },
];

/** Reportes anteriores. Al seleccionar uno se abre su detalle en un modal. */
export default function HistorialReportes({ reportes }) {
  const [seleccionado, setSeleccionado] = useState(null);

  if (reportes.length === 0) {
    return <p className="text-sm text-ink-muted">Todavía no hay reportes anteriores.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reportes.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => setSeleccionado(r)} className="surface card-3d group w-full p-5 text-left">
              <p className="font-display text-sm font-semibold text-ink">{r.fecha}</p>
              <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{r.resumen_texto}</p>
              <p className="mt-4 text-xs text-brand-cyan opacity-0 transition duration-300 group-hover:opacity-100">Ver detalle →</p>
            </button>
          </li>
        ))}
      </ul>

      <Modal abierto={Boolean(seleccionado)} onCerrar={() => setSeleccionado(null)} titulo={`Reporte del ${seleccionado?.fecha ?? ''}`}>
        {seleccionado && (
          <div className="space-y-6">
            <p className="leading-relaxed text-ink">{seleccionado.resumen_texto}</p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {METRICAS.map((m) => (
                <div key={m.clave} className="rounded-xl border border-line/10 bg-line/[0.03] p-4">
                  <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{m.etiqueta}</dt>
                  <dd className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink">
                    {seleccionado.datos_json?.[m.clave] ?? '—'}
                    {m.sufijo && seleccionado.datos_json?.[m.clave] != null ? m.sufijo : ''}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-ink-subtle">Generado por: {seleccionado.generado_por}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
