import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useCookies } from '../context/CookieContext.jsx';
import { CORREO_CONTACTO, EMPRESA } from '../content/legal.js';

const MAPA_SITIO = [
  { titulo: 'Portal', enlaces: [{ to: '/#capacidades', etiqueta: 'Capacidades' }, { to: '/#como-funciona', etiqueta: 'Cómo funciona' }, { to: '/#seguridad', etiqueta: 'Seguridad' }] },
  { titulo: 'Acceso', enlaces: [{ to: '/login', etiqueta: 'Iniciar sesión' }] },
];

const LEGALES = [
  { to: '/privacidad', etiqueta: 'Aviso de Privacidad' },
  { to: '/tratamiento-datos', etiqueta: 'Tratamiento de Datos del Colaborador' },
  { to: '/terminos', etiqueta: 'Términos de Uso' },
];

/** Pie de página corporativo: mapa del sitio, avisos legales y gestión de cookies. */
export default function Footer() {
  const { abrirConfiguracion } = useCookies();
  const anio = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-line/10 bg-canvas/60 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
            Consultas de políticas de Recursos Humanos con agentes de IA, controles de acceso por rol y respuestas con fuentes.
          </p>
        </div>

        <nav aria-label="Mapa del sitio" className="grid grid-cols-2 gap-8 md:col-span-4">
          {MAPA_SITIO.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-subtle">{grupo.titulo}</p>
              <ul className="mt-4 space-y-2.5">
                {grupo.enlaces.map((enlace) => (
                  <li key={enlace.etiqueta}>
                    <Link to={enlace.to} className="text-sm text-ink-muted transition hover:text-ink">{enlace.etiqueta}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="md:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-subtle">Legal</p>
          <ul className="mt-4 space-y-2.5">
            {LEGALES.map((legal) => (
              <li key={legal.to}>
                <Link to={legal.to} className="text-sm text-ink-muted transition hover:text-ink">{legal.etiqueta}</Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={abrirConfiguracion} className="text-sm text-ink-muted transition hover:text-ink">
                Gestión de cookies
              </button>
            </li>
          </ul>
          <p className="mt-6 text-xs text-ink-subtle">Contacto: {CORREO_CONTACTO}</p>
        </div>
      </div>

      <div className="border-t border-line/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>{EMPRESA} © {anio}. Todos los derechos reservados.</p>
          <p>Proyecto académico · Mini Proyecto #2</p>
        </div>
      </div>
    </footer>
  );
}
