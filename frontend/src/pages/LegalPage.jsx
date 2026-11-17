import { Link, Navigate, useParams } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';
import Footer from '../components/Footer.jsx';
import Logo from '../components/Logo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { DOCUMENTOS_LEGALES, FECHA_VIGENCIA } from '../content/legal.js';

/** Página de un documento legal (aviso, tratamiento de datos, términos o cookies). */
export default function LegalPage({ slug: slugDeRuta }) {
  const { slug: slugDeParametro } = useParams();
  const slug = slugDeRuta ?? slugDeParametro;
  const documento = DOCUMENTOS_LEGALES[slug];

  if (!documento) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-8">
        <div className="surface mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" aria-label="Ir al inicio"><Logo compacto /></Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost px-4 py-2 text-sm">Acceder</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-10 pt-16 sm:px-8">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-indigo">Documento legal</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{documento.titulo}</h1>
          <p className="mt-4 text-ink-muted">{documento.resumen}</p>
          <p className="mt-3 text-xs text-ink-subtle">Vigente desde el {FECHA_VIGENCIA}.</p>
        </Reveal>

        <Reveal delay={100}>
          <div role="note" className="mt-8 rounded-xl border border-brand-indigo/30 bg-brand-indigo/10 px-4 py-3 text-xs text-ink-muted">
            Borrador de referencia. Debe ser revisado por el área legal de la empresa antes de su publicación oficial.
          </div>
        </Reveal>

        <div className="mt-10 space-y-6">
          {documento.secciones.map((seccion, indice) => (
            <Reveal key={seccion.titulo} delay={Math.min(indice * 60, 300)}>
              <section className="surface p-6 sm:p-7">
                <h2 className="font-display text-lg font-semibold text-ink">{seccion.titulo}</h2>
                <p className="mt-3 leading-relaxed text-ink-muted">{seccion.texto}</p>
              </section>
            </Reveal>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
