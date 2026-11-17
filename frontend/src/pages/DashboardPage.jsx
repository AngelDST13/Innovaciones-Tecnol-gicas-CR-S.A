import { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import KpiCards from '../components/KpiCards.jsx';
import TablaSolicitudes from '../components/TablaSolicitudes.jsx';
import ReporteDiario from '../components/ReporteDiario.jsx';
import HistorialReportes from '../components/HistorialReportes.jsx';
import Reveal from '../components/Reveal.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const DIAS_TENDENCIA = 30;
const ZONA = 'America/Costa_Rica';

/** Fecha YYYY-MM-DD en zona de Costa Rica, `dias` hacia atrás desde hoy. */
function fechaCRAtras(dias) {
  const ahora = new Date(Date.now() - dias * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(ahora);
}

/** Serie de los últimos 30 días; los días sin consultas quedan en 0. */
function construirTendencia(puntos) {
  const porDia = new Map(puntos.map((p) => [p.dia, p.total]));
  return Array.from({ length: DIAS_TENDENCIA }, (_, i) => {
    const dia = fechaCRAtras(DIAS_TENDENCIA - 1 - i);
    return {
      dia,
      etiqueta: new Date(`${dia}T00:00:00`).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }),
      consultas: porDia.get(dia) ?? 0,
    };
  });
}

function TooltipTendencia({ active, payload, label, unidad = 'consultas' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface px-4 py-3 text-xs shadow-glow-cyan">
      <p className="text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-ink">
        {payload[0].value} <span className="text-xs font-normal text-ink-muted">{unidad}</span>
      </p>
    </div>
  );
}

function Encabezado({ titulo, subtitulo }) {
  return (
    <div className="mb-5">
      <h3 className="font-display text-lg font-semibold text-ink">{titulo}</h3>
      {subtitulo && <p className="mt-1 text-sm text-ink-muted">{subtitulo}</p>}
    </div>
  );
}

function EstadoError({ mensaje, onReintentar }) {
  return (
    <div className="surface mx-auto max-w-xl p-8 text-center animate-slide-up">
      <p className="font-display text-lg font-semibold text-brand-rose">No se pudo cargar el dashboard</p>
      <p className="mt-2 text-sm text-ink-muted">{mensaje}</p>
      <button type="button" className="btn-primary mt-6 text-sm" onClick={onReintentar}>
        Reintentar
      </button>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando indicadores">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="surface h-40 animate-pulse" />
        ))}
      </div>
      <div className="surface h-80 animate-pulse" />
    </div>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(
    async (signal) => {
      try {
        const [resumen, historial] = await Promise.all([
          api.dashboard(usuario.id, signal),
          api.historialReportes(usuario.id),
        ]);
        setDatos(resumen);
        setReportes(historial);
        setError('');
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      }
    },
    [usuario.id],
  );

  useEffect(() => {
    const controlador = new AbortController();
    cargar(controlador.signal);
    return () => controlador.abort();
  }, [cargar]);

  const tendencia = useMemo(() => (datos ? construirTendencia(datos.tendencia_chat_30d) : []), [datos]);

  // Ausencias por tipo del último reporte (solo si ya tiene el desglose nuevo)
  const ausenciasPorTipo = useMemo(() => {
    const porTipo = reportes[0]?.datos_json?.ausentes_hoy?.por_tipo;
    if (!porTipo) return [];
    const etiquetas = { vacaciones: 'Vacaciones', permiso: 'Permiso', licencia: 'Licencia', incapacidad: 'Incapacidad' };
    return Object.entries(etiquetas).map(([clave, etiqueta]) => ({ etiqueta, personas: porTipo[clave] ?? 0 }));
  }, [reportes]);

  function alGenerarReporte(nuevo) {
    setReportes((previos) => [nuevo, ...previos.filter((r) => r.fecha !== nuevo.fecha)]);
  }

  if (error) return <EstadoError mensaje={error} onReintentar={() => cargar()} />;
  if (!datos) return <Esqueleto />;

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-8 2xl:space-y-10">
      <Reveal>
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-cyan">Dirección de RRHH</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Dashboard <span className="text-gradient">ejecutivo</span>
          </h2>
          <p className="mt-2 text-sm text-ink-muted">Indicadores, uso del asistente y resumen diario.</p>
        </header>
      </Reveal>

      <KpiCards kpis={datos.kpis} />

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-5">
        <Reveal className="2xl:col-span-3">
          <section className="surface h-full p-6 sm:p-8">
            <Encabezado titulo="Consultas al chat" subtitulo="Volumen diario de los últimos 30 días" />
            <div className="h-72 text-ink-subtle">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tendencia} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradiente-tendencia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                  <XAxis dataKey="etiqueta" stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
                  <YAxis stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ stroke: '#06b6d4', strokeOpacity: 0.3 }} content={<TooltipTendencia />} />
                  <Area type="monotone" dataKey="consultas" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gradiente-tendencia)" dot={false} activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>

        <Reveal delay={120} className="2xl:col-span-2">
          <section className="surface h-full p-6 sm:p-8">
            <Encabezado titulo="Solicitudes pendientes" subtitulo="Esperando aprobación de RRHH" />
            <TablaSolicitudes solicitudes={datos.solicitudes_pendientes} />
          </section>
        </Reveal>
      </div>

      <Reveal>
        <section className="surface p-6 sm:p-8">
          <Encabezado titulo="Ausencias de hoy por tipo" subtitulo="Tomado del último reporte generado" />
          {ausenciasPorTipo.length === 0 ? (
            <p className="text-sm text-ink-muted">Genera un reporte para ver las ausencias del día.</p>
          ) : (
            <div className="h-64 text-ink-subtle">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ausenciasPorTipo} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
                  <XAxis dataKey="etiqueta" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#06b6d4', fillOpacity: 0.08 }} content={<TooltipTendencia unidad="personas" />} />
                  <Bar dataKey="personas" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </Reveal>

      <Reveal>
        <ReporteDiario reporte={reportes[0] ?? null} usuarioId={usuario.id} onGenerado={alGenerarReporte} />
      </Reveal>

      <Reveal>
        <section className="surface p-6 sm:p-8">
          <Encabezado titulo="Historial de reportes" subtitulo="Selecciona un día para ver su detalle" />
          <HistorialReportes reportes={reportes} />
        </section>
      </Reveal>
    </div>
  );
}
