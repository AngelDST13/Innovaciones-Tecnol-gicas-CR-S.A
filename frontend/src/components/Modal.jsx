import { useEffect, useId } from 'react';

/** Modal accesible: cierra con Escape o con clic en el fondo, y entra con escala fluida. */
export default function Modal({ abierto, onCerrar, titulo, children }) {
  const idTitulo = useId();

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => evento.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPresionar);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = '';
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={idTitulo} className="surface w-full max-w-2xl animate-scale-in p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={idTitulo} className="font-display text-lg font-semibold text-ink">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="btn-ghost px-3 py-1 text-xs" aria-label="Cerrar">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
