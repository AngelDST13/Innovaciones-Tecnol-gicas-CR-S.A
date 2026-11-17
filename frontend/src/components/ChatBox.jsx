import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';

const LONGITUD_MIN = 3;
const LONGITUD_MAX = 1000;

/** Color por intención. Tonos de alto contraste en ambos temas. */
const INTENCIONES = {
  politica: { etiqueta: 'Política', clase: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30' },
  dato_personal: { etiqueta: 'Dato personal', clase: 'bg-brand-emerald/15 text-brand-emerald ring-brand-emerald/30' },
  mixta: { etiqueta: 'Mixta', clase: 'bg-brand-indigo/15 text-brand-indigo ring-brand-indigo/30' },
  restringida: { etiqueta: 'Restringida', clase: 'bg-brand-rose/15 text-brand-rose ring-brand-rose/30' },
  fuera_de_alcance: { etiqueta: 'Fuera de alcance', clase: 'bg-line/10 text-ink-muted ring-line/20' },
};

const MENSAJE_INICIAL = {
  rol: 'asistente',
  texto: 'Hola, soy el asistente de RRHH. Puedo responder sobre políticas y sobre tus datos laborales.',
};

function Avatar() {
  return (
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-cyan to-brand-indigo text-[10px] font-semibold tracking-wider text-white shadow-glow-cyan">
      CR
    </span>
  );
}

function IndicadorEscribiendo() {
  return (
    <div className="flex items-center gap-3 animate-fade-in" role="status" aria-label="El asistente está respondiendo">
      <Avatar />
      <div className="flex gap-1.5 rounded-2xl border border-line/10 bg-surface/60 px-4 py-3">
        {[0, 150, 300].map((retraso) => (
          <span key={retraso} className="h-2 w-2 animate-wave rounded-full bg-brand-cyan" style={{ animationDelay: `${retraso}ms` }} />
        ))}
      </div>
    </div>
  );
}

function Citas({ citas }) {
  if (!citas?.length) return null;
  return (
    <div className="mt-4 space-y-2 border-t border-line/10 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">Fuentes</p>
      {citas.map((cita, indice) => (
        <div key={indice} className="flex gap-2 rounded-lg bg-line/[0.04] px-3 py-2 text-xs">
          <span className="text-brand-indigo">§</span>
          <p>
            <span className="font-medium text-ink">{cita.documento}</span>
            {cita.seccion && <span className="text-ink-muted"> · {cita.seccion}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

function Burbuja({ mensaje }) {
  if (mensaje.rol === 'usuario') {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-r from-brand-cyan to-brand-indigo px-4 py-3 text-sm leading-relaxed text-white shadow-lg sm:max-w-[70%]">
        {mensaje.texto}
      </div>
    );
  }

  if (mensaje.rol === 'error') {
    return (
      <div className="max-w-[85%] rounded-2xl border border-brand-rose/30 bg-brand-rose/10 px-4 py-3 text-sm text-brand-rose">
        {mensaje.texto}
      </div>
    );
  }

  const intencion = INTENCIONES[mensaje.intencion];
  return (
    <div className="flex items-start gap-3">
      <Avatar />
      <div className="surface max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed text-ink sm:max-w-[75%]">
        <p className="whitespace-pre-wrap">{mensaje.texto}</p>
        <Citas citas={mensaje.citas} />
        {intencion && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
            <span className={`rounded-full px-2.5 py-0.5 font-medium ring-1 ${intencion.clase}`}>{intencion.etiqueta}</span>
            {mensaje.latencia != null && <span className="tabular-nums">{mensaje.latencia} ms</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatBox({ usuarioId }) {
  const [mensajes, setMensajes] = useState([MENSAJE_INICIAL]);
  const [entrada, setEntrada] = useState('');
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, enviando]);

  const longitud = entrada.trim().length;
  const puedeEnviar = !enviando && longitud >= LONGITUD_MIN && longitud <= LONGITUD_MAX;

  async function enviar(evento) {
    evento.preventDefault();
    if (!puedeEnviar) return;

    const pregunta = entrada.trim();
    setMensajes((previos) => [...previos, { rol: 'usuario', texto: pregunta }]);
    setEntrada('');
    setEnviando(true);

    try {
      const respuesta = await api.enviarMensaje(usuarioId, pregunta);
      setMensajes((previos) => [
        ...previos,
        {
          rol: 'asistente',
          texto: respuesta.respuesta,
          intencion: respuesta.intencion,
          bloqueada: respuesta.bloqueada,
          citas: respuesta.citas,
          latencia: respuesta.latencia_ms,
        },
      ]);
    } catch (error) {
      setMensajes((previos) => [...previos, { rol: 'error', texto: error.message }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="surface flex h-[calc(100dvh-13rem)] min-h-[380px] flex-col md:h-[calc(100dvh-10rem)]">
      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {mensajes.map((mensaje, indice) => (
          <div key={indice} className="animate-slide-up">
            <Burbuja mensaje={mensaje} />
          </div>
        ))}
        {enviando && <IndicadorEscribiendo />}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviar} className="border-t border-line/10 bg-line/[0.02] p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <input
            className="input-glass rounded-full px-5"
            placeholder="Escribe tu consulta de RRHH…"
            value={entrada}
            maxLength={LONGITUD_MAX}
            onChange={(e) => setEntrada(e.target.value)}
            disabled={enviando}
            aria-label="Consulta"
          />
          <button type="submit" className="btn-primary shrink-0 rounded-full px-6" disabled={!puedeEnviar}>
            Enviar
          </button>
        </div>
      </form>
    </section>
  );
}
