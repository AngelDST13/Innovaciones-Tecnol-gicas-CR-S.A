import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import Reveal from '../components/Reveal.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CAPACIDADES = [
  { icono: 'book', titulo: 'Políticas con fuentes', texto: 'Responde con los documentos oficiales de RRHH y cita documento, sección y punto.' },
  { icono: 'user', titulo: 'Tus datos, solo tuyos', texto: 'Saldo de vacaciones, solicitudes, incapacidades, pagos y evaluaciones del propio colaborador.' },
  { icono: 'shield', titulo: 'Filtro de seguridad', texto: 'Bloquea salarios de gerencia, datos de terceros e intentos de manipular al asistente.' },
  { icono: 'chart', titulo: 'Reporte diario para RRHH', texto: 'Cifras calculadas sobre la base de datos y un resumen verificado, cada mañana.' },
];

const AGENTES = [
  { icono: 'chat', nombre: 'Orquestador' },
  { icono: 'book', nombre: 'Políticas (RAG)' },
  { icono: 'user', nombre: 'Datos del colaborador' },
  { icono: 'chart', nombre: 'Analista de reportes' },
  { icono: 'database', nombre: 'Ingesta de Drive' },
  { icono: 'check', nombre: 'Validador' },
  { icono: 'mail', nombre: 'Escalamiento a RRHH' },
  { icono: 'calendar', nombre: 'Pagos y calendario' },
  { icono: 'spark', nombre: 'Desempeño' },
  { icono: 'shield', nombre: 'Guardrails' },
];

const PASOS = [
  { icono: 'user', titulo: 'Identifícate', texto: 'Ingresa con tu correo corporativo. Cada perfil ve solo lo que le corresponde.' },
  { icono: 'chat', titulo: 'Pregunta en lenguaje natural', texto: 'Escribe tu consulta como se la harías a una persona de RRHH.' },
  { icono: 'spark', titulo: 'El orquestador decide', texto: 'Clasifica la intención, aplica los filtros y elige el agente adecuado.' },
  { icono: 'file', titulo: 'Recibe la respuesta con fuentes', texto: 'Cada respuesta indica de dónde proviene la información.' },
];

const GARANTIAS = [
  { icono: 'lock', texto: 'Cada colaborador consulta solo sus propios datos.' },
  { icono: 'shield', texto: 'Las preguntas sobre salarios de gerencia o terceros se bloquean antes de llegar al modelo.' },
  { icono: 'users', texto: 'El dashboard de RRHH es exclusivo para el rol de RRHH.' },
  { icono: 'check', texto: 'Las cifras de los reportes se calculan sobre la base de datos.' },
];

const ESTADOS = {
  disponible: 'bg-brand-emerald/10 text-brand-emerald ring-brand-emerald/30',
};

function destinoSesion(usuario) {
  if (!usuario) return '/login';
  return usuario.rol === 'rrhh' ? '/dashboard' : '/chat';
}

/** Barra de progreso de lectura en la parte superior. */
function BarraProgreso() {
  const [progreso, setProgreso] = useState(0);
  useEffect(() => {
    const alScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      setProgreso(alto > 0 ? (window.scrollY / alto) * 100 : 0);
    };
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent" aria-hidden="true">
      <div className="h-full bg-gradient-to-r from-brand-cyan to-brand-indigo transition-[width] duration-150" style={{ width: `${progreso}%` }} />
    </div>
  );
}

/** Inclina el bloque hacia el cursor (efecto 3D). Respeta prefers-reduced-motion. */
function Inclinacion({ children, className = '' }) {
  const ref = useRef(null);

  function mover(evento) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (evento.clientX - rect.left) / rect.width - 0.5;
    const y = (evento.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(1200px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
  }

  function reiniciar() {
    ref.current.style.transform = '';
  }

  return (
    <div ref={ref} onMouseMove={mover} onMouseLeave={reiniciar} className={`transition-transform duration-500 ease-out will-change-transform ${className}`}>
      {children}
    </div>
  );
}

function Cabecera({ onAcceder, textoBoton }) {
  const [abierto, setAbierto] = useState(false);
  const enlaces = [
    { href: '#capacidades', texto: 'Capacidades' },
    { href: '#agentes', texto: 'Agentes' },
    { href: '#como-funciona', texto: 'Cómo funciona' },
    { href: '#seguridad', texto: 'Seguridad' },
  ];
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-8">
      <div className="surface mx-auto max-w-7xl px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <Logo compacto className="scale-90 sm:scale-100" />
          <nav aria-label="Principal" className="hidden items-center gap-7 text-sm text-ink-muted md:flex">
            {enlaces.map((e) => (
              <a key={e.href} href={e.href} className="transition hover:text-ink">{e.texto}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="scale-90" />
            <button type="button" onClick={onAcceder} className="btn-primary hidden px-4 py-2 text-sm sm:inline-flex">
              {textoBoton}
            </button>
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              className="btn-ghost px-2.5 py-2 md:hidden"
              aria-expanded={abierto}
              aria-controls="menu-movil"
              aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            >
              <Icon nombre={abierto ? 'close' : 'menu'} className="h-5 w-5" />
            </button>
          </div>
        </div>
        {abierto && (
          <nav id="menu-movil" aria-label="Móvil" className="mt-4 grid gap-2 border-t border-line/10 pt-4 md:hidden animate-fade-in">
            {enlaces.map((e) => (
              <a key={e.href} href={e.href} onClick={() => setAbierto(false)} className="rounded-lg px-3 py-2 text-ink-muted transition hover:bg-line/5 hover:text-ink">
                {e.texto}
              </a>
            ))}
            <button type="button" onClick={onAcceder} className="btn-primary mt-2 w-full">{textoBoton}</button>
          </nav>
        )}
      </div>
    </header>
  );
}

function Hero({ onAcceder }) {
  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-2 lg:pt-24">
      <Reveal>
        <p className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-line/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-emerald">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-emerald" />
          Portal corporativo de RRHH
        </p>

        <h1 className="mt-7 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Las políticas de RRHH,
          <span className="text-gradient block pb-1">a una pregunta de distancia.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
          Innovaciones Tecnológicas CR S.A. reúne en un solo lugar las consultas de sus colaboradores y el seguimiento de
          Recursos Humanos, con agentes de IA, respuestas con fuentes y controles de acceso por rol.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button type="button" onClick={onAcceder} className="btn-primary group gap-3 px-7 py-3.5 text-[15px]">
            Acceder al Portal de Colaboradores y RRHH
            <Icon nombre="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <a href="#capacidades" className="btn-ghost inline-flex items-center gap-2 px-6 py-3.5">
            Ver capacidades
          </a>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 text-sm text-ink-muted sm:max-w-md">
          {['Respuestas con fuentes', 'Datos por rol', 'Filtros de seguridad', 'Reporte diario'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Icon nombre="check" className="h-4 w-4 text-brand-emerald" />
              {t}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={150}>
        <Inclinacion className="relative mx-auto w-full max-w-md">
          <div className="surface relative p-6 shadow-glow-indigo">
            <div className="mb-5 flex items-center justify-between">
              <Logo compacto />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                <Icon nombre="spark" className="h-3.5 w-3.5" />
                Vista previa
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-brand-cyan to-brand-indigo px-4 py-3 text-white">
                ¿Cuántos días de vacaciones me quedan?
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-line/10 bg-line/[0.04] px-4 py-3 text-ink">
                Te quedan 11 días disponibles del periodo 2026.
                <span className="mt-3 flex">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-emerald/15 px-2.5 py-0.5 text-[11px] text-brand-emerald ring-1 ring-brand-emerald/30">
                    <Icon nombre="user" className="h-3 w-3" />
                    Dato personal
                  </span>
                </span>
              </div>
            </div>
            <p className="mt-5 text-[11px] text-ink-subtle">Ejemplo ilustrativo.</p>
          </div>

          <div className="surface absolute -bottom-6 -left-4 hidden items-center gap-3 p-4 shadow-glow-cyan animate-float sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-rose/10 text-brand-rose"><Icon nombre="shield" className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-subtle">Filtro de seguridad</p>
              <p className="text-sm font-medium text-brand-rose">Consulta bloqueada</p>
            </div>
          </div>
          <div className="surface absolute -right-3 -top-5 hidden items-center gap-3 p-4 [animation-delay:-3s] animate-float sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan"><Icon nombre="book" className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-subtle">Respuesta</p>
              <p className="font-display text-sm font-semibold text-brand-cyan">Con fuentes</p>
            </div>
          </div>
        </Inclinacion>
      </Reveal>
    </section>
  );
}

function Capacidades() {
  return (
    <section id="capacidades" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-cyan">Capacidades</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Lo que el portal hace por cada colaborador y por RRHH.
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {CAPACIDADES.map((c, i) => (
          <Reveal key={c.titulo} delay={i * 100}>
            <article className="surface spotlight card-3d group h-full p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-indigo/20 text-brand-cyan ring-1 ring-brand-cyan/20 transition duration-500 group-hover:scale-110">
                <Icon nombre={c.icono} className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-display text-xl font-semibold text-ink">{c.titulo}</h3>
              <p className="mt-3 leading-relaxed text-ink-muted">{c.texto}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Agentes() {
  return (
    <section id="agentes" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-indigo">Arquitectura</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Diez agentes, cada uno con una sola responsabilidad.
        </h2>
      </Reveal>
      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {AGENTES.map((a, i) => (
          <Reveal key={a.nombre} delay={(i % 5) * 70}>
            <li className="surface flex h-full items-center gap-3 p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-indigo/40">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-indigo/10 text-brand-indigo">
                <Icon nombre={a.icono} className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-medium text-ink">{a.nombre}</span>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-indigo">Cómo funciona</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">De la pregunta a la respuesta</h2>
      </Reveal>

      <div className="relative mt-14 grid gap-8 md:grid-cols-4">
        <div aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-emerald opacity-40 md:block" />
        {PASOS.map((p, i) => (
          <Reveal key={p.titulo} delay={i * 120}>
            <div className="relative">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-line/10 bg-canvas text-brand-cyan shadow-glow-cyan">
                <Icon nombre={p.icono} className="h-5 w-5" />
              </span>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Paso {i + 1}</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.texto}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Seguridad() {
  return (
    <section id="seguridad" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
      <Reveal>
        <div className="surface grid gap-10 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-emerald">Seguridad</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">Acceso por rol y filtros antes del modelo</h2>
            <p className="mt-4 leading-relaxed text-ink-muted">
              La seguridad no depende solo del modelo de IA. Reglas fijas y permisos por rol se aplican en el servidor.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {GARANTIAS.map((g) => (
              <li key={g.texto} className="flex gap-3 rounded-xl border border-line/10 bg-line/[0.02] p-4 text-sm text-ink">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-emerald/10 text-brand-emerald">
                  <Icon nombre={g.icono} className="h-4 w-4" />
                </span>
                {g.texto}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

function LlamadaFinal({ onAcceder }) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-line/10 bg-gradient-to-br from-brand-cyan/15 via-brand-indigo/10 to-brand-emerald/10 p-10 text-center sm:p-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Empieza por tu consulta de hoy.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">Ingresa con tu correo corporativo y pregunta lo que necesites.</p>
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={onAcceder} className="btn-primary group gap-3 px-7 py-3.5 text-[15px]">
              Acceder al Portal
              <Icon nombre="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function VolverArriba() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const alScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="surface fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center text-ink-muted transition hover:text-ink animate-fade-in"
      aria-label="Volver arriba"
    >
      <Icon nombre="up" className="h-5 w-5" />
    </button>
  );
}

export default function HomePage() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const { hash } = useLocation();
  const textoBoton = usuario ? 'Ir a mi portal' : 'Acceder';
  const acceder = () => navegar(destinoSesion(usuario));

  // Los enlaces del pie apuntan a /#seccion: al llegar, desplaza hasta la sección.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <BarraProgreso />
      <div className="ambient" aria-hidden="true">
        <span className="-left-40 top-0 h-[34rem] w-[34rem] bg-brand-cyan/20" />
        <span className="-right-40 top-[40%] h-[30rem] w-[30rem] bg-brand-indigo/20 [animation-delay:-8s]" />
        <span className="bottom-0 left-1/3 h-80 w-80 bg-brand-emerald/10 [animation-delay:-14s]" />
      </div>

      <Cabecera onAcceder={acceder} textoBoton={textoBoton} />
      <main>
        <Hero onAcceder={acceder} />
        <Capacidades />
        <Agentes />
        <ComoFunciona />
        <Seguridad />
        <LlamadaFinal onAcceder={acceder} />
      </main>
      <Footer />
      <VolverArriba />
    </div>
  );
}
