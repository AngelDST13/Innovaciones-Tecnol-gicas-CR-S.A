import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { enlaces } from './Sidebar.jsx';

/** Barra superior para pantallas pequeñas. En escritorio la reemplaza el Sidebar. */
export default function Navbar() {
  const { esRRHH, logout } = useAuth();
  const navegar = useNavigate();

  function cerrarSesion() {
    logout();
    navegar('/login', { replace: true });
  }

  return (
    <header className="surface sticky top-2 z-20 mx-3 mt-3 flex items-center justify-between gap-3 px-4 py-3 md:hidden">
      <Logo compacto />

      <nav className="flex items-center gap-1.5">
        {enlaces
          .filter((enlace) => !enlace.soloRRHH || esRRHH)
          .map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-xs font-medium transition duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-indigo/20 text-ink ring-1 ring-brand-cyan/40'
                    : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              {enlace.etiqueta.split(' ')[0]}
            </NavLink>
          ))}
        <ThemeToggle className="scale-75" />
        <button
          type="button"
          onClick={cerrarSesion}
          className="rounded-full border border-line/10 px-3 py-1.5 text-xs text-ink-muted transition hover:border-line/20 hover:bg-line/5 hover:text-ink"
        >
          Salir
        </button>
      </nav>
    </header>
  );
}
