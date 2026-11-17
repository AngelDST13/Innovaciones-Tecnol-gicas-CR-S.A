import { useEffect, useState } from 'react';
import Reveal from './Reveal.jsx';

const TARJETAS = [
  { clave: 'solicitudes_pendientes', etiqueta: 'Solicitudes pendientes', detalle: 'Esperando aprobación', acento: 'from-brand-cyan to-brand-indigo', formato: (v) => Math.round(v).toLocaleString('es-CR') },
  { clave: 'colaboradores_activos', etiqueta: 'Colaboradores activos', detalle: 'Con contrato vigente', acento: 'from-brand-emerald to-brand-cyan', formato: (v) => Math.round(v).toLocaleString('es-CR') },
  { clave: 'incapacidades_mes', etiqueta: 'Incapacidades del mes', detalle: 'Registradas desde el día 1', acento: 'from-brand-indigo to-brand-emerald', formato: (v) => Math.round(v).toLocaleString('es-CR') },
  { clave: 'consultas_hoy', etiqueta: 'Consultas al chat hoy', detalle: 'Preguntas recibidas', acento: 'from-brand-cyan to-brand-emerald', formato: (v) => Math.round(v).toLocaleString('es-CR') },
  { clave: 'tasa_resolucion_30d', etiqueta: 'Resolución del chat', detalle: 'Últimos 30 días', acento: 'from-brand-emerald to-brand-indigo', formato: (v) => (v == null ? '—' : `${v.toFixed(1)}%`), barra: true },
];

/** Interpola el valor desde 0 hasta `destino` con desaceleración. */
function useContador(destino, duracion = 1000) {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (typeof destino !== 'number') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValor(destino);
      return undefined;
    }

    let inicio = null;
    let frame;
    const paso = (marca) => {
      inicio ??= marca;
      const progreso = Math.min((marca - inicio) / duracion, 1);
      setValor(destino * (1 - (1 - progreso) ** 3));
      if (progreso < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [destino, duracion]);

  return valor;
}

function moverHalo(evento) {
  const rect = evento.currentTarget.getBoundingClientRect();
  evento.currentTarget.style.setProperty('--mx', `${evento.clientX - rect.left}px`);
  evento.currentTarget.style.setProperty('--my', `${evento.clientY - rect.top}px`);
}

function TarjetaKpi({ tarjeta, valor }) {
  const animado = useContador(valor);
  const texto = typeof valor === 'number' ? tarjeta.formato(animado) : '—';

  return (
    <article onMouseMove={moverHalo} className="surface spotlight card-3d flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">{tarjeta.etiqueta}</p>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${tarjeta.acento} shadow-glow-cyan`} />
      </div>

      <p className="mt-5 font-display text-4xl font-semibold tabular-nums tracking-tight text-ink">{texto}</p>

      <div className="mt-auto pt-5">
        {tarjeta.barra && typeof valor === 'number' ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-line/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tarjeta.acento} transition-[width] duration-1000 ease-out`}
              style={{ width: `${Math.min(valor, 100)}%` }}
            />
          </div>
        ) : (
          <p className="text-xs text-ink-subtle">{tarjeta.detalle}</p>
        )}
      </div>
    </article>
  );
}

/** Cinco indicadores con aparición escalonada al hacer scroll. */
export default function KpiCards({ kpis }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
      {TARJETAS.map((tarjeta, indice) => (
        <Reveal key={tarjeta.clave} delay={indice * 90} className="h-full">
          <TarjetaKpi tarjeta={tarjeta} valor={kpis[tarjeta.clave]} />
        </Reveal>
      ))}
    </div>
  );
}
