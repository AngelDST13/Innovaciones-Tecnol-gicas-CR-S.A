import { useState } from 'react';
import { api } from '../services/api.js';

const ETIQUETA_GENERADOR = {
  agente_analista: 'Agente Analista · IA',
  plantilla_determinista: 'Plantilla de respaldo',
};

/** Resumen ejecutivo del día, con acción para regenerarlo. */
export default function ReporteDiario({ reporte, usuarioId, onGenerado }) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  async function generar() {
    setError('');
    setGenerando(true);
    try {
      onGenerado(await api.generarReporte(usuarioId));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <section className="surface p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-emerald">Resumen ejecutivo</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink">Estado del día</h3>
          {reporte && (
            <p className="mt-1 text-xs text-ink-muted">
              {reporte.fecha} · {ETIQUETA_GENERADOR[reporte.generado_por] ?? reporte.generado_por}
            </p>
          )}
        </div>
        <button type="button" onClick={generar} disabled={generando} className="btn-primary text-sm">
          {generando ? 'Generando…' : 'Generar reporte de hoy'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-brand-rose">{error}</p>}

      {reporte ? (
        <p className="max-w-4xl text-[15px] leading-relaxed text-ink">{reporte.resumen_texto}</p>
      ) : (
        <p className="text-sm text-ink-muted">Aún no hay un reporte generado. Usa el botón para crear el de hoy.</p>
      )}
    </section>
  );
}
