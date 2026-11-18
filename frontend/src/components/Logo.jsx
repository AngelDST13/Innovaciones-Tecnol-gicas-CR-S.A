/**
 * Logotipo corporativo: isotipo geométrico (hexágono, arco de "C" y nodo esmeralda)
 * con tipografía Sora espaciada. Se adapta al tema activo.
 */
import { useState } from 'react';

let contadorInstancias = 0;

export default function Logo({ compacto = false, className = '' }) {
  // Id único por instancia: evita que los degradados SVG colisionen entre componentes.
  const [id] = useState(() => `${++contadorInstancias}`);

  return (
    <div className={`logo-wrap group flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        className="logo-glow h-10 w-10 shrink-0 transition-transform duration-700 group-hover:rotate-[6deg] group-hover:scale-105"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`logo-trazo-${id}`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2DD4BF" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <path
          d="M24 3 43 14v20L24 45 5 34V14Z"
          style={{ fill: 'rgb(var(--surface) / 0.6)' }}
          stroke={`url(#logo-trazo-${id})`}
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
        <path
          d="M31.5 17.2a10.5 10.5 0 1 0 0 13.6"
          fill="none"
          stroke={`url(#logo-trazo-${id})`}
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <circle cx="36.5" cy="24" r="2.6" fill="#10b981" className="animate-pulse" />
      </svg>

      {!compacto && (
        <div className="leading-none">
          <p className="font-display text-[12px] font-semibold tracking-[0.34em] text-ink">INNOVACIONES</p>
          <p className="mt-1.5 font-display text-[9.5px] font-medium tracking-[0.42em] text-ink-muted">
            TECNOLÓGICAS CR
          </p>
        </div>
      )}
    </div>
  );
}
