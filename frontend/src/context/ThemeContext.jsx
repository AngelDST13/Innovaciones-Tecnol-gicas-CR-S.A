import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CLAVE_TEMA = 'talentsync.tema';
const TEMAS = ['dark', 'light'];
const ThemeContext = createContext(null);

/** Tema guardado por el usuario; si no hay, el del sistema operativo; si no, noche. */
function temaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    if (TEMAS.includes(guardado)) return guardado;
  } catch {
    /* almacenamiento bloqueado: se ignora */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  // Aplica el tema al <html> para que las variables CSS cambien en toda la app.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      /* sin persistencia: el tema dura lo que la pestaña */
    }
  }, [tema]);

  const alternar = useCallback(() => setTema((actual) => (actual === 'dark' ? 'light' : 'dark')), []);

  const valor = useMemo(() => ({ tema, alternar, esNoche: tema === 'dark' }), [tema, alternar]);
  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return contexto;
}
