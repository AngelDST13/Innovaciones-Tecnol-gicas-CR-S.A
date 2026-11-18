import { Link, Navigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import Reveal from '../components/Reveal.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { DOCUMENTOS_LEGALES, FECHA_VIGENCIA } from '../content/legal.js';

const ICONOS = {
  privacidad: 'lock',
  'tratamiento-datos': 'users',
  terminos: 'file',
  cookies: 'cookie',
};

/** Identificador de ancla estable a partir del título de la sección. */
const anclaDe = (titulo) =>
  titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Página de un documento legal (aviso, tratamiento de datos, términos o cookies). */
export default function LegalPage({ slug: slugDeRuta }) {
  const { slug: slugDeParametro } = useParams();
  const slug = slugDeRuta ?? slugDeParametro;
  const documento = DOCUMENTOS_LEGALES[slug];

  if (!documento) return <Navigate to="/" replace />;

  const secciones = documento.secciones.map((s) => ({ ...s, ancla: anclaDe(s.titulo) }));

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-8">
        <div className="surface mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" aria-label="Ir al inicio" className="flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink">
            <Logo compacto />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost px-4 py-2 text-sm">Acceder</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[17rem_1fr]">
        <aside className="lg:sticky lg:top-28 lg:h-fit" aria-label="Documentos legales">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-ink-subtle">Documentos legales</p>
          <nav className="grid gap-1">
            {Object.entries(DOCUMENTOS_LEGALES).map(([clave, doc]) => (
              <Link
                key={clave}
                to={`/${clave}`}
                aria-current={clave === slug ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  clave === slug ? 'bg-line/[0.07] text-ink' : 'text-ink-muted hover:bg-line/[0.04] hover:text-ink'
                }`}
              >
                <Icon nombre={ICONOS[clave]} className="h-4 w-4 shrink-0" />
                {doc.titulo}
              </Link>
            ))}
          </nav>

          <p className="mb-3 mt-10 text-[10px] font-semibold uppercase tracking-[0.25em] text-ink-subtle">En esta página</p>
          <nav className="grid gap-1 border-l border-line/10 pl-3">
            {secciones.map((s) => (
              <a key={s.ancla} href={`#${s.ancla}`} className="py-1 text-xs text-ink-muted transition hover:text-ink">
                {s.titulo}
              </a>
            ))}
          </nav>
        </aside>

        <main>
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-indigo">Documento legal</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{documento.titulo}</h1>
            <p className="mt-4 max-w-2xl text-ink-muted">{documento.resumen}</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-ink-subtle">
              <Icon nombre="calendar" className="h-3.5 w-3.5" />
              Vigente desde el {FECHA_VIGENCIA}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div role="note" className="mt-8 flex gap-3 rounded-xl border border-brand-amber/30 bg-brand-amber/10 px-4 py-3 text-sm text-ink-muted">
              <Icon nombre="alert" className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" />
              <p>
                Borrador de referencia. Debe ser revisado por el área legal de la empresa antes de su publicación oficial.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 space-y-6">
            {secciones.map((seccion, indice) => (
              <Reveal key={seccion.ancla} delay={Math.min(indice * 60, 300)}>
                <section id={seccion.ancla} className="surface scroll-mt-32 p-6 sm:p-7">
                  <h2 className="font-display text-lg font-semibold text-ink">{seccion.titulo}</h2>
                  <p className="mt-3 leading-relaxed text-ink-muted">{seccion.texto}</p>
                </section>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link to="/" className="btn-ghost inline-flex items-center gap-2">
              <Icon nombre="arrow" className="h-4 w-4 rotate-180" />
              Volver al inicio
            </Link>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
