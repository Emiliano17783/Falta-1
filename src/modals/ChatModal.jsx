import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { suscribirMensajes, enviarMensaje } from '../firebase/firestore';

export default function ChatModal({ partido, onClose }) {
  const { user } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!partido?.id) return;
    const unsub = suscribirMensajes(partido.id, setMensajes);
    return unsub;
  }, [partido?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = async (e) => {
    e.preventDefault();
    const txt = texto.trim();
    if (!txt || enviando) return;
    setEnviando(true);
    setTexto('');
    try {
      await enviarMensaje(
        partido.id,
        user.uid,
        user.displayName || 'Jugador',
        user.photoURL || null,
        txt,
      );
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setTexto(txt); // Restaurar texto si falla
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar(e);
    }
  };

  const jugadoresCount = partido?.jugadoresAnotados ?? 0;
  const cupo = partido?.cupoTotal ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center p-0 md:p-6"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-f-card w-full md:max-w-lg md:rounded-2xl flex flex-col border border-f-border"
           style={{ height: '85svh', maxHeight: '700px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-f-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-lg uppercase truncate">{partido?.nombreCancha}</p>
            <p className="text-f-muted text-sm">
              Chat del partido · {jugadoresCount}/{cupo} jugadores
            </p>
          </div>
          <button onClick={onClose}
            className="ml-3 w-9 h-9 rounded-xl bg-f-surface flex items-center justify-center
                       text-f-muted hover:text-white transition-colors flex-shrink-0 text-xl font-bold">
            ×
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {mensajes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <span className="text-5xl mb-3">💬</span>
              <p className="text-f-text font-bold">Nadie habló todavía</p>
              <p className="text-f-muted text-sm mt-1">Sé el primero en escribir</p>
            </div>
          )}

          {mensajes.map((m, i) => {
            const esMio = m.uid === user.uid;
            const hora = m.creadoEn?.toDate?.()?.toLocaleTimeString('es-UY', {
              hour: '2-digit', minute: '2-digit',
            }) ?? '';

            // Mostrar nombre solo cuando cambia el remitente
            const anterior = mensajes[i - 1];
            const mostrarNombre = !esMio && (!anterior || anterior.uid !== m.uid);

            return (
              <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'} gap-2`}>
                {/* Avatar (solo otros, y solo cuando cambia de remitente) */}
                {!esMio && (
                  <div className="flex-shrink-0 w-8 self-end">
                    {mostrarNombre && (
                      m.foto
                        ? <img src={m.foto} alt={m.nombre}
                            className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-f-green flex items-center justify-center text-white text-xs font-black">
                            {(m.nombre || '?')[0].toUpperCase()}
                          </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[75%] ${esMio ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {mostrarNombre && (
                    <p className="text-f-accent text-xs font-bold px-1">{m.nombre}</p>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 break-words
                    ${esMio
                      ? 'bg-f-green text-white rounded-br-sm'
                      : 'bg-f-surface text-f-text rounded-bl-sm border border-f-border'
                    }`}>
                    <p className="text-sm leading-snug">{m.texto}</p>
                  </div>
                  <p className="text-f-muted text-xs px-1">{hora}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={enviar}
          className="px-4 py-3 border-t border-f-border flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje..."
            maxLength={500}
            className="flex-1 bg-f-surface border border-f-border rounded-xl px-4 py-2.5
                       text-white text-sm outline-none focus:border-f-accent transition-colors
                       placeholder:text-f-muted"
          />
          <button type="submit" disabled={!texto.trim() || enviando}
            className="bg-f-green text-white w-11 h-11 rounded-xl font-bold flex items-center justify-center
                       flex-shrink-0 active:scale-95 transition-all disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
