import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import Logo from '../components/Logo.jsx';
import Reveal from '../components/Reveal.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/** Estado real de cada capacidad: solo se marca "Disponible" lo implementado. */
const CAPACIDADES = [
  {
    numero: '01',
    titulo: 'Agente de Políticas (RAG)',
    texto: 'Responderá con base en los documentos oficiales de RRHH, citando documento y sección.',
    estado: 'En preparación',
    acento: 'from-brand-cyan to-brand-indigo',
  },
  {
    numero: '02',
    titulo: 'Agente de Datos Personales',
    texto: 'Consulta tus vacaciones, solicitudes e incapacidades. Solo accede a tus propios registros.',
    estado: 'Disponible',
    acento: 'from-brand-emerald to-brand-cyan',
  },
  {
    numero: '03',
    titulo: 'Filtro de seguridad',
    texto: 'Bloquea salarios de gerencia, datos de terceros e intentos de manipular al asistente.',
    estado: 'Disponible',
    acento: 'from-brand-indigo to-brand-emerald',
  },
  {
    numero: '04',
    titulo: 'Analista y reportes diarios',
    texto: 'Genera para RRHH un resumen ejecutivo del día con cifras verificadas contra la base de datos.',
    estado: 'Disponible',
    acento: 'from-brand-cyan to-brand-emerald',
  },
];

const PASOS = [
  { titulo: 'Identifícate', texto: 'Ingresa con tu correo corporativo. Cada perfil ve solo lo que le corresponde.' },
  { titulo: 'Pregunta en lenguaje natural', texto: 'Escribe tu consulta como se la harías a una persona de RRHH.' },
  { titulo: 'El orquestador decide', texto: 'Clasifica la intención y aplica los filtros de seguridad antes de responder.' },
  { titulo: 'Recibe la respuesta con fuentes', texto: 'Cada respuesta indica de dónde proviene la información.' },
];

/** Ruta según sesión y rol: sin sesión, login; con sesión, su vista. */
function destinoSesion(usuario) {
  if (!usuario) return '/login';
  return usuario.rol === 'rrhh' ? '/dashboard' : '/chat';
}

/** Inclina el bloque hacia el cursor (efecto 3D). Respeta prefers-reduced-motion. */
function Inclinacion({ children, className = '' }) {
  const ref = useRef(null);

  function mover(evento) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (evento.clientX - rect.left) / rect.width - 0.5;
    const y = (evento.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(1200px) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg)`;
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

function BotonPrincipal({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="btn-primary group gap-3 px-7 py-3.5 text-[15px] shadow-glow-cyan">
      {children}
      <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
    </button>
  );
}

function Cabecera({ onAcceder, textoBoton }) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-8">
      <div className="surface mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Logo compacto className="scale-90 sm:scale-100" />
        <nav className="hidden items-center gap-7 text-sm text-ink-muted md:flex">
          <a href="#capacidades" className="transition hover:text-ink">Capacidades</a>
          <a href="#como-funciona" className="transition hover:text-ink">Cómo funciona</a>
          <a href="#seguridad" className="transition hover:text-ink">Seguridad</a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle className="scale-90" />
          <button type="button" onClick={onAcceder} className="btn-primary px-4 py-2 text-sm">
            {textoBoton}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onAcceder }) {
  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-2 lg:pt-24">
      <Reveal>
        <p className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-line/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-emerald">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-emerald" />
          Portal corporativo de RRHH
        </p>

        <h1 className="mt-7 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Las políticas de RRHH,
          <span className="text-gradient block pb-1">a una pregunta de distancia.</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
          Innovaciones Tecnológicas CR S.A. reúne en un solo lugar las consultas de sus colaboradores y el seguimiento de
          Recursos Humanos, con agentes de IA y controles de acceso por rol.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <BotonPrincipal onClick={onAcceder}>Acceder al Portal de Colaboradores y RRHH</BotonPrincipal>
          <a href="#capacidades" className="btn-ghost px-6 py-3.5">Ver capacidades</a>
        </div>
      </Reveal>

      <Reveal delay={150}>
        <Inclinacion className="relative mx-auto w-full max-w-md">
          <div className="surface relative p-6 shadow-glow-indigo">
            <div className="mb-5 flex items-center justify-between">
              <Logo compacto />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Vista previa</span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-brand-cyan to-brand-indigo px-4 py-3 text-white">
                ¿Cuántos días de vacaciones me quedan?
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-line/10 bg-line/[0.04] px-4 py-3 text-ink">
                Te quedan 11 días disponibles del periodo 2026.
                <span className="mt-3 flex">
                  <span className="rounded-full bg-brand-emerald/15 px-2.5 py-0.5 text-[11px] text-brand-emerald ring-1 ring-brand-emerald/30">Dato personal</span>
                </span>
              </div>
            </div>
            <p className="mt-5 text-[11px] text-ink-subtle">Ejemplo ilustrativo.</p>
          </div>

          <div className="surface absolute -bottom-6 -left-6 hidden p-4 shadow-glow-cyan animate-float sm:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle">Filtro de seguridad</p>
            <p className="mt-1 text-sm font-medium text-brand-rose">Consulta bloqueada</p>
          </div>
          <div className="surface absolute -right-4 -top-5 hidden p-4 [animation-delay:-3s] animate-float sm:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle">Respuesta</p>
            <p className="mt-1 font-display text-lg font-semibold text-brand-cyan">Con fuentes</p>
          </div>
        </Inclinacion>
      </Reveal>
    </section>
  );
}

function Capacidades() {
  return (
    <section id="capacidades" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-24 sm:px-8">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-cyan">Capacidades</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Cuatro agentes, cada uno con una sola responsabilidad.
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {CAPACIDADES.map((capacidad, indice) => (
          <Reveal key={capacidad.numero} delay={indice * 110}>
            <article className="surface spotlight card-3d group h-full p-8">
              <div className="flex items-start justify-between">
                <span className={`bg-gradient-to-br bg-clip-text font-display text-4xl font-semibold text-transparent ${capacidad.acento}`}>
                  {capacidad.numero}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-medium ring-1 ${
                    capacidad.estado === 'Disponible'
                      ? 'bg-brand-emerald/10 text-brand-emerald ring-brand-emerald/30'
                      : 'bg-brand-amber/10 text-brand-amber ring-brand-amber/30'
                  }`}
                >
                  {capacidad.estado}
                </span>
              </div>
              <h3 className="mt-8 font-display text-xl font-semibold text-ink">{capacidad.titulo}</h3>
              <p className="mt-3 leading-relaxed text-ink-muted">{capacidad.texto}</p>
              <div className={`mt-8 h-px w-16 bg-gradient-to-r ${capacidad.acento} transition-all duration-500 group-hover:w-full`} />
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-24 sm:px-8">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-indigo">Cómo funciona</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">De la pregunta a la respuesta</h2>
      </Reveal>

      <div className="relative mt-14 grid gap-6 md:grid-cols-4">
        <div aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-emerald opacity-40 md:block" />
        {PASOS.map((paso, indice) => (
          <Reveal key={paso.titulo} delay={indice * 120}>
            <div className="relative">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-line/10 bg-canvas font-display text-sm font-semibold text-brand-cyan shadow-glow-cyan">
                {indice + 1}
              </span>
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">{paso.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{paso.texto}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Seguridad() {
  const garantias = [
    'Cada colaborador consulta solo sus propios datos.',
    'Las preguntas sobre salarios de gerencia o terceros se bloquean antes de llegar al modelo.',
    'El dashboard de RRHH es exclusivo para el rol de RRHH.',
    'Las cifras de los reportes se verifican contra la base de datos.',
  ];
  return (
    <section id="seguridad" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-24 sm:px-8">
      <Reveal>
        <div className="surface grid gap-10 p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-emerald">Seguridad</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">Acceso por rol y filtros deterministas</h2>
            <p className="mt-4 leading-relaxed text-ink-muted">
              La seguridad no depende solo del modelo de IA. Reglas fijas y permisos por rol se aplican en el servidor.
            </p>
          </div>
          <ul className="space-y-4">
            {garantias.map((texto) => (
              <li key={texto} className="flex gap-3 text-ink">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-emerald shadow-[0_0_8px_1px_rgba(16,185,129,0.5)]" />
                {texto}
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
        <div className="relative overflow-hidden rounded-3xl border border-line/10 bg-gradient-to-br from-brand-cyan/20 via-brand-indigo/15 to-brand-emerald/15 p-10 text-center sm:p-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Empieza por tu consulta de hoy.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted">Ingresa con tu correo corporativo y pregunta lo que necesites.</p>
          <div className="mt-10 flex justify-center">
            <BotonPrincipal onClick={onAcceder}>Acceder al Portal</BotonPrincipal>
          </div>
        </div>
      </Reveal>
    </section>
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
      <div className="ambient" aria-hidden="true">
        <span className="-left-40 top-0 h-[34rem] w-[34rem] bg-brand-cyan/20" />
        <span className="-right-40 top-[40%] h-[30rem] w-[30rem] bg-brand-indigo/20 [animation-delay:-8s]" />
        <span className="bottom-0 left-1/3 h-80 w-80 bg-brand-emerald/10 [animation-delay:-14s]" />
      </div>

      <Cabecera onAcceder={acceder} textoBoton={textoBoton} />
      <main>
        <Hero onAcceder={acceder} />
        <Capacidades />
        <ComoFunciona />
        <Seguridad />
        <LlamadaFinal onAcceder={acceder} />
      </main>
      <Footer />
    </div>
  );
}
