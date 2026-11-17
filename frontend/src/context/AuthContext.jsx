import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const CLAVE_SESION = 'talentsync.usuario';
const AuthContext = createContext(null);

function leerSesionGuardada() {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null; // almacenamiento bloqueado o corrupto: se inicia sin sesión
  }
}

function guardarSesion(usuario) {
  try {
    if (usuario) localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
    else localStorage.removeItem(CLAVE_SESION);
  } catch {
    /* sin persistencia: la sesión dura solo en memoria */
  }
}

/** Gestiona la sesión y el rol (colaborador | rrhh). El rol real siempre se valida en el backend. */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesionGuardada);
  const [cargando, setCargando] = useState(() => Boolean(leerSesionGuardada()));

  // Revalida la sesión guardada contra el backend al cargar la app.
  useEffect(() => {
    if (!usuario) return;
    api
      .sesion(usuario.id)
      .then((actual) => {
        setUsuario(actual);
        guardarSesion(actual);
      })
      .catch(() => {
        setUsuario(null);
        guardarSesion(null);
      })
      .finally(() => setCargando(false));
    // Solo al montar: la revalidación inicial no depende de cambios posteriores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email) => {
    const actual = await api.login(email);
    guardarSesion(actual);
    setUsuario(actual);
    return actual;
  }, []);

  const logout = useCallback(() => {
    guardarSesion(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      esRRHH: usuario?.rol === 'rrhh',
      login,
      logout,
    }),
    [usuario, cargando, login, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return contexto;
}
