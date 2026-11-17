import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIAS_COOKIES, useCookies } from '../context/CookieContext.jsx';

function Interruptor({ activo, fijo = false, onChange, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={fijo}
      onClick={() => onChange(!activo)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition duration-300 disabled:cursor-not-allowed ${
        activo ? 'bg-gradient-to-r from-brand-cyan to-brand-indigo' : 'bg-line/15'
      } ${fijo ? 'opacity-70' : ''}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
          activo ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function VistaResumen({ onConfigurar }) {
  const { aceptarTodas, rechazarNoEsenciales } = useCookies();
  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="font-display text-base font-semibold text-ink">Usamos cookies para que el portal funcione bien</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            Las necesarias son indispensables. Con tu permiso también usamos preferencias y analíticas anonimizadas.
            Consulta nuestra <Link to="/cookies" className="text-brand-cyan underline-offset-4 hover:underline">política de cookies</Link>.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <button type="button" onClick={onConfigurar} className="btn-ghost px-4 py-2.5">Configurar</button>
          <button type="button" onClick={rechazarNoEsenciales} className="btn-ghost px-4 py-2.5">Rechazar no esenciales</button>
          <button type="button" onClick={aceptarTodas} className="btn-primary px-5 py-2.5">Aceptar todas</button>
        </div>
      </div>
    </>
  );
}

function VistaConfiguracion() {
  const { consentimiento, guardar, cerrarConfiguracion } = useCookies();
  const [elecciones, setElecciones] = useState({
    preferencias: consentimiento?.preferencias ?? false,
    analiticas: consentimiento?.analiticas ?? false,
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-display text-base font-semibold text-ink">Configura tus cookies</p>
        <button type="button" onClick={cerrarConfiguracion} className="text-xs text-ink-subtle transition hover:text-ink">Cerrar</button>
      </div>

      <ul className="mt-4 divide-y divide-line/10">
        {Object.entries(CATEGORIAS_COOKIES).map(([clave, categoria]) => {
          const activo = categoria.fija ? true : elecciones[clave];
          return (
            <li key={clave} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{categoria.etiqueta}</p>
                <p className="text-xs text-ink-muted">{categoria.descripcion}</p>
              </div>
              <Interruptor
                activo={activo}
                fijo={categoria.fija}
                etiqueta={`Cookies ${categoria.etiqueta.toLowerCase()}`}
                onChange={(valor) => setElecciones((previo) => ({ ...previo, [clave]: valor }))}
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap justify-end gap-2.5">
        <button type="button" onClick={() => guardar({ preferencias: false, analiticas: false })} className="btn-ghost px-4 py-2.5">
          Solo necesarias
        </button>
        <button type="button" onClick={() => guardar(elecciones)} className="btn-primary px-5 py-2.5">
          Guardar preferencias
        </button>
      </div>
    </div>
  );
}

/** Banner flotante no intrusivo al pie de la pantalla. Aparece hasta que el usuario decide. */
export default function CookieBanner() {
  const { bannerVisible, configurando, abrirConfiguracion } = useCookies();
  if (!bannerVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-5 animate-slide-up" role="region" aria-label="Aviso de cookies">
      <div className="surface mx-auto max-w-5xl p-5 shadow-glass sm:p-6">
        {configurando ? <VistaConfiguracion /> : <VistaResumen onConfigurar={abrirConfiguracion} />}
      </div>
    </div>
  );
}
