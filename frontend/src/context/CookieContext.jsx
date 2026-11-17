import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CLAVE_COOKIES = 'talentsync.cookies';
const CookieContext = createContext(null);

/** Categorías. Las necesarias siempre están activas: son indispensables para el funcionamiento del portal. */
export const CATEGORIAS_COOKIES = {
  necesarias: { etiqueta: 'Necesarias', descripcion: 'Sesión, tema visual y seguridad. Siempre activas.', fija: true },
  preferencias: { etiqueta: 'Preferencias', descripcion: 'Recuerdan ajustes como el modo día o noche.' },
  analiticas: { etiqueta: 'Analíticas', descripcion: 'Miden el uso del portal para mejorarlo. Anonimizadas.' },
};

const SIN_DECISION = null;

function leerConsentimiento() {
  try {
    const crudo = localStorage.getItem(CLAVE_COOKIES);
    if (!crudo) return SIN_DECISION;
    const datos = JSON.parse(crudo);
    return typeof datos?.version === 'number' ? datos : SIN_DECISION;
  } catch {
    return SIN_DECISION;
  }
}

function guardarConsentimiento(datos) {
  try {
    localStorage.setItem(CLAVE_COOKIES, JSON.stringify(datos));
  } catch {
    /* sin persistencia: el banner volverá a aparecer en la próxima visita */
  }
}

/** Consentimiento de cookies con versión del aviso, para volver a pedirlo si la política cambia. */
const VERSION_AVISO = 1;

export function CookieProvider({ children }) {
  const [consentimiento, setConsentimiento] = useState(leerConsentimiento);
  const [configurando, setConfigurando] = useState(false);
  const [mostrarBanner, setMostrarBanner] = useState(false);

  const necesitaDecision = consentimiento === null || consentimiento.version !== VERSION_AVISO;
  // El banner permanece visible también en modo configuración (muestra el panel de categorías).
  const bannerVisible = necesitaDecision || mostrarBanner;

  const guardar = useCallback((elecciones) => {
    const datos = {
      version: VERSION_AVISO,
      preferencias: Boolean(elecciones.preferencias),
      analiticas: Boolean(elecciones.analiticas),
      fecha: new Date().toISOString(),
    };
    guardarConsentimiento(datos);
    setConsentimiento(datos);
    setMostrarBanner(false);
    setConfigurando(false);
  }, []);

  const aceptarTodas = useCallback(() => guardar({ preferencias: true, analiticas: true }), [guardar]);
  const rechazarNoEsenciales = useCallback(() => guardar({ preferencias: false, analiticas: false }), [guardar]);
  const abrirConfiguracion = useCallback(() => {
    setConfigurando(true);
    setMostrarBanner(true);
  }, []);
  const cerrarConfiguracion = useCallback(() => {
    setConfigurando(false);
    setMostrarBanner(false);
  }, []);

  const valor = useMemo(
    () => ({
      consentimiento,
      bannerVisible,
      configurando,
      aceptarTodas,
      rechazarNoEsenciales,
      guardar,
      abrirConfiguracion,
      cerrarConfiguracion,
    }),
    [consentimiento, bannerVisible, configurando, aceptarTodas, rechazarNoEsenciales, guardar, abrirConfiguracion, cerrarConfiguracion],
  );

  return <CookieContext.Provider value={valor}>{children}</CookieContext.Provider>;
}

export function useCookies() {
  const contexto = useContext(CookieContext);
  if (!contexto) throw new Error('useCookies debe usarse dentro de CookieProvider');
  return contexto;
}
