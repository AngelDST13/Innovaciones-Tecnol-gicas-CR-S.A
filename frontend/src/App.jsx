import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import CookieBanner from './components/CookieBanner.jsx';
import { useAuth } from './context/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function PantallaCarga() {
  return <div className="flex min-h-[100dvh] items-center justify-center text-ink-muted">Cargando sesión…</div>;
}

/** Protege una ruta: exige sesión y, opcionalmente, rol rrhh. */
function RutaProtegida({ children, soloRRHH = false }) {
  const { usuario, cargando, esRRHH } = useAuth();

  if (cargando) return <PantallaCarga />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (soloRRHH && !esRRHH) return <Navigate to="/chat" replace />;
  return children;
}

/** Disposición de la aplicación autenticada: navegación lateral (escritorio) o superior (móvil). */
function Disposicion({ children }) {
  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <div className="ambient" aria-hidden="true">
        <span className="-left-40 -top-40 h-[32rem] w-[32rem] bg-brand-cyan/20" />
        <span className="-bottom-48 -right-32 h-[28rem] w-[28rem] bg-brand-indigo/20 [animation-delay:-6s]" />
        <span className="left-1/2 top-1/3 h-72 w-72 bg-brand-emerald/10 [animation-delay:-11s]" />
      </div>
      <Navbar />
      <Sidebar />
      <main className="flex-1 overflow-x-hidden px-4 pb-8 pt-4 sm:px-8 sm:pt-8 2xl:px-12">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacidad" element={<LegalPage slug="privacidad" />} />
        <Route path="/tratamiento-datos" element={<LegalPage slug="tratamiento-datos" />} />
        <Route path="/terminos" element={<LegalPage slug="terminos" />} />
        <Route path="/cookies" element={<LegalPage slug="cookies" />} />
        <Route
          path="/chat"
          element={
            <RutaProtegida>
              <Disposicion>
                <ChatPage />
              </Disposicion>
            </RutaProtegida>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RutaProtegida soloRRHH>
              <Disposicion>
                <DashboardPage />
              </Disposicion>
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
    </>
  );
}
