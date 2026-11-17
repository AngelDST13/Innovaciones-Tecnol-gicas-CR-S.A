const ETIQUETA_TIPO = {
  vacaciones: 'Vacaciones',
  permiso: 'Permiso',
  teletrabajo: 'Teletrabajo',
  licencia: 'Licencia',
  otro: 'Otro',
};

function formatearFecha(fechaIso) {
  return new Date(`${fechaIso}T00:00:00`).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
}

/** Tabla de solicitudes pendientes de aprobación. */
export default function TablaSolicitudes({ solicitudes }) {
  if (solicitudes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="mb-3 h-10 w-10 rounded-full bg-gradient-to-br from-brand-emerald/40 to-brand-cyan/20" />
        <p className="text-sm text-ink-muted">No hay solicitudes pendientes de aprobación.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
          <tr>
            <th scope="col" className="pb-3 font-medium">Colaborador</th>
            <th scope="col" className="pb-3 font-medium">Tipo</th>
            <th scope="col" className="pb-3 font-medium">Periodo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/10">
          {solicitudes.map((s) => (
            <tr key={s.id} className="transition duration-300 hover:bg-line/[0.04]">
              <td className="py-3.5 pr-4 font-medium text-ink">{s.colaborador}</td>
              <td className="py-3.5 pr-4">
                <span className="rounded-full bg-brand-indigo/15 px-2.5 py-0.5 text-xs text-brand-indigo ring-1 ring-brand-indigo/30">
                  {ETIQUETA_TIPO[s.tipo] ?? s.tipo}
                </span>
              </td>
              <td className="whitespace-nowrap py-3.5 tabular-nums text-ink-muted">
                {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
