import ChatBox from '../components/ChatBox.jsx';
import Reveal from '../components/Reveal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ChatPage() {
  const { usuario } = useAuth();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Reveal>
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-emerald">Asistente de RRHH</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            Consultas <span className="text-gradient">de RRHH</span>
          </h2>
          <p className="mt-2 text-sm text-ink-muted">Respuestas basadas en las políticas oficiales y en tus datos laborales.</p>
        </header>
      </Reveal>
      <Reveal delay={120}>
        <ChatBox usuarioId={usuario.id} />
      </Reveal>
    </div>
  );
}
