import { useTheme } from '../context/ThemeContext.jsx';

/** Interruptor elegante día / noche. El icono rota y el pivote se desplaza con transición. */
export default function ThemeToggle({ className = '' }) {
  const { esNoche, alternar } = useTheme();

  return (
    <button
      type="button"
      onClick={alternar}
      role="switch"
      aria-checked={!esNoche}
      aria-label={esNoche ? 'Activar modo día' : 'Activar modo noche'}
      title={esNoche ? 'Modo día' : 'Modo noche'}
      className={`group relative flex h-9 w-16 shrink-0 items-center rounded-full border border-line/10 bg-line/5 p-1 transition duration-500 hover:border-brand-cyan/40 ${className}`}
    >
      <span
        className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-cyan to-brand-indigo shadow-glow-cyan transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          esNoche ? 'translate-x-0' : 'translate-x-7'
        }`}
      >
        {esNoche ? <LunaIcono /> : <SolIcono />}
      </span>
      <span className="sr-only">{esNoche ? 'Modo noche activo' : 'Modo día activo'}</span>
    </button>
  );
}

function LunaIcono() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="currentColor" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function SolIcono() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
