import { useState, useEffect } from 'react';
import { suscribirMisPartidos } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../modals/ChatModal';

export default function ChatScreen() {
  const { user } = useAuth();
  const [misPartidos, setMisPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [chatPartido, setChatPartido] = useState(null);

  useEffect(() => {
    if (!user?.uid) { setCargando(false); return; }
    const unsub = suscribirMisPartidos(user.uid, (data) => {
      setMisPartidos(data);
      setCargando(false);
    });
    return unsub;
  }, [user?.uid]);

  const hoy = new Date();
  const ahora = Date.now();

  // Solo partidos confirmados — filtrar archivados (>24hs después del partido)
  const chatsActivos = misPartidos.filter(p => {
    if (p.estado === 'cancelado') return false;
    const fechaPartido = new Date(p.fechaHora);
    const veinticuatroHsDespues = fechaPartido.getTime() + 24 * 60 * 60 * 1000;
    return ahora < veinticuatroHsDespues;
  });

  const chatsArchivados = misPartidos.filter(p => {
    const fechaPartido = new Date(p.fechaHora);
    const veinticuatroHsDespues = fechaPartido.getTime() + 24 * 60 * 60 * 1000;
    return ahora >= veinticuatroHsDespues && p.estado !== 'cancelado';
  });

  return (
    <div className="min-h-svh bg-f-bg font-barlow">

      {/* Header */}
      <div className="bg-f-surface border-b border-f-border px-6 pt-10 pb-5">
        <h1 className="text-white font-black uppercase mb-1" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)' }}>
          Chats
        </h1>
        <p className="text-f-muted text-base">Tus partidos y partidas activos</p>
      </div>

      <div className="px-4 md:px-12 py-6 pb-28">

        {cargando ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-20 animate-pulse" />
            ))}
          </div>
        ) : chatsActivos.length === 0 && chatsArchivados.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="text-7xl mb-4">💬</span>
            <p className="text-f-text text-2xl font-black uppercase">Sin chats activos</p>
            <p className="text-f-muted text-base mt-1 mb-6 max-w-xs">
              Anotate a un partido para acceder al chat grupal
            </p>
          </div>
        ) : (
          <>
            {/* Chats activos */}
            {chatsActivos.length > 0 && (
              <div className="mb-8">
                <p className="text-f-accent text-xs font-black uppercase tracking-widest mb-3">
                  Activos — {chatsActivos.length}
                </p>
                <div className="space-y-2">
                  {chatsActivos.map(p => (
                    <ChatCard key={p.id} partido={p} onAbrir={() => setChatPartido(p)} />
                  ))}
                </div>
              </div>
            )}

            {/* Chats archivados */}
            {chatsArchivados.length > 0 && (
              <div>
                <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-3">
                  Archivados — {chatsArchivados.length}
                </p>
                <div className="space-y-2 opacity-50">
                  {chatsArchivados.map(p => (
                    <ChatCard key={p.id} partido={p} archivado onAbrir={() => setChatPartido(p)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {chatPartido && (
        <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />
      )}
    </div>
  );
}

function ChatCard({ partido, archivado, onAbrir }) {
  const fecha = new Date(partido.fechaHora);
  const hoy = new Date();
  const diaLabel = fecha.toDateString() === hoy.toDateString() ? 'HOY'
    : fecha.toDateString() === new Date(Date.now() + 86400000).toDateString() ? 'MAÑANA'
    : fecha.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  const hora = fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
  const deporte = partido.deporte === 'padel' ? '🎾' : '⚽';

  return (
    <button onClick={onAbrir}
      className="w-full card animate-fade-in active:scale-[0.98] transition-transform text-left">
      <div className="p-4 flex items-center gap-4">
        {/* Ícono */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
             style={{ background: archivado ? 'rgba(255,255,255,0.04)' : 'rgba(14,165,233,0.08)',
                      border: `1px solid ${archivado ? 'rgba(255,255,255,0.06)' : 'rgba(84,181,240,0.2)'}` }}>
          {deporte}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm leading-tight truncate">
            {partido.nombreCancha}
          </p>
          <p className="text-f-muted text-xs mt-0.5">
            {diaLabel} · {hora}hs · {partido.modalidad}
          </p>
          <p className="text-f-muted text-xs">
            {partido.jugadoresAnotados}/{partido.cupoTotal} jugadores
          </p>
        </div>

        {/* Estado */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {archivado ? (
            <span className="text-xs text-f-muted font-bold">Archivado</span>
          ) : (
            <span className="text-xs font-black px-2 py-0.5 rounded-lg"
                  style={{ background: 'rgba(14,165,233,0.1)', color: '#54b5f0', border: '1px solid rgba(84,181,240,0.2)' }}>
              Activo
            </span>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#5a5a5a">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </div>
      </div>
    </button>
  );
}
