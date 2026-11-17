import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export const enlaces = [
  { to: '/chat', etiqueta: 'Consultas', soloRRHH: false },
  { to: '/dashboard', etiqueta: 'Dashboard ejecutivo', soloRRHH: true },
];

const claseEnlace = ({ isActive }) =>
  `group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition duration-300 ${
    isActive ? 'bg-line/[0.07] text-ink shadow-inner' : 'text-ink-muted hover:bg-line/[0.04] hover:text-ink'
  }`;

function Iniciales({ nombre = '' }) {
  const letras = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-cyan to-brand-indigo text-xs font-semibold text-white shadow-glow-cyan">
      {letras || '?'}
    </span>
  );
}

export default function Sidebar() {
  const { usuario, esRRHH, logout } = useAuth();
  const navegar = useNavigate();

  function cerrarSesion() {
    logout();
    navegar('/login', { replace: true });
  }

  return (
    <aside className="surface sticky top-4 m-4 hidden h-[calc(100dvh-2rem)] w-72 shrink-0 flex-col p-6 md:flex">
      <div className="mb-10 flex items-center justify-between gap-2">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink-subtle">Menú</p>
        {enlaces
          .filter((enlace) => !enlace.soloRRHH || esRRHH)
          .map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to} className={claseEnlace}>
              {({ isActive }) => (
                <>
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition duration-300 ${
                      isActive ? 'nav-active-dot' : 'bg-ink-subtle group-hover:bg-ink-muted'
                    }`}
                  />
                  {enlace.etiqueta}
                </>
              )}
            </NavLink>
          ))}
      </nav>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-line/10 px-4 py-3">
        <span className="text-xs text-ink-muted">Apariencia</span>
        <ThemeToggle />
      </div>

      <div className="surface p-4">
        <div className="flex items-center gap-3">
          <Iniciales nombre={usuario?.nombre} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{usuario?.nombre}</p>
            <p className="text-xs capitalize text-ink-muted">{usuario?.rol}</p>
          </div>
        </div>
        <button type="button" onClick={cerrarSesion} className="btn-ghost mt-4 w-full">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
