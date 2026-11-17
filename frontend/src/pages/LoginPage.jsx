import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Reveal from '../components/Reveal.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Accesos rápidos solo en desarrollo (datos simulados de schema.sql).
const USUARIOS_DEMO = [
  { email: 'ana.gutierrez@innovacionescr.com', etiqueta: 'Ana', rol: 'Recursos Humanos' },
  { email: 'carlos.mora@innovacionescr.com', etiqueta: 'Carlos', rol: 'Colaborador' },
];

export default function LoginPage() {
  const { usuario, login } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (usuario) return <Navigate to={usuario.rol === 'rrhh' ? '/dashboard' : '/chat'} replace />;

  async function iniciar(correo) {
    setError('');
    setCargando(true);
    try {
      const actual = await login(correo);
      navegar(actual.rol === 'rrhh' ? '/dashboard' : '/chat', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function enviar(evento) {
    evento.preventDefault();
    iniciar(email.trim());
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-5">
      <Reveal className="w-full max-w-md">
        <div className="surface p-8 sm:p-10">
          <div className="mb-10 flex items-center justify-between gap-3">
            <Logo />
            <ThemeToggle className="scale-90" />
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Portal de políticas <span className="text-gradient">de RRHH</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted">Ingresa con tu correo corporativo para continuar.</p>

          <form onSubmit={enviar} className="mt-8 space-y-4">
            <input
              type="email"
              required
              className="input-glass"
              placeholder="nombre@innovacionescr.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Correo corporativo"
            />
            {error && (
              <p role="alert" className="animate-fade-in text-sm text-brand-rose">
                {error}
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={cargando}>
              {cargando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-subtle">
            <Link to="/" className="transition hover:text-ink">← Volver al inicio</Link>
          </p>

          {import.meta.env.DEV && (
            <div className="mt-8 border-t border-line/10 pt-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-ink-subtle">Accesos de desarrollo</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {USUARIOS_DEMO.map((demo) => (
                  <button key={demo.email} type="button" onClick={() => iniciar(demo.email)} disabled={cargando} className="btn-ghost text-left">
                    <span className="block font-medium text-ink">{demo.etiqueta}</span>
                    <span className="block text-xs text-ink-subtle">{demo.rol}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
