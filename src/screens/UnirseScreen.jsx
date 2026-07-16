import { useState, useEffect } from 'react';
import { suscribirPartidos, anotarseAPartido, desanotarseDePartido } from '../firebase/firestore';
import { PARTIDOS_DEMO } from '../data/partidos';
import { BARRIOS_MONTEVIDEO } from '../data/canchas';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../modals/ChatModal';

export default function UnirseScreen({ onVerDetalle }) {
  const { user, perfil } = useAuth();
  const [partidos, setPartidos] = useState([]);
  const [deporte, setDeporte] = useState('todos');
  const [barrio, setBarrio] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [chatPartido, setChatPartido] = useState(null);

  const estaBaneado = perfil?.bloqueado || (
    perfil?.penalizacionHasta && new Date(perfil.penalizacionHasta) > new Date()
  );

  useEffect(() => {
    try {
      const unsub = suscribirPartidos((data) => {
        setPartidos(data.length > 0 ? data : PARTIDOS_DEMO);
        setCargando(false);
      }, {});
      return unsub;
    } catch {
      setPartidos(PARTIDOS_DEMO);
      setCargando(false);
    }
  }, []);

  const filtrados = partidos.filter(p => {
    if (deporte === 'futbol' && p.deporte !== 'futbol') return false;
    if (deporte === 'padel'  && p.deporte !== 'padel')  return false;
    if (barrio !== 'Todos'  && p.barrio !== barrio)     return false;
    return true;
  });

  return (
    <div className="min-h-svh bg-f-bg">

      {/* Header */}
      <div className="px-5 md:px-12 pt-12 pb-5 border-b border-f-border"
           style={{ background: '#111' }}>
        <h1 className="text-white font-black text-3xl uppercase leading-tight">
          Unirme a un<br />
          <span style={{ color: '#0ea5e9' }}>partido</span>
        </h1>
        <p className="text-f-muted text-sm mt-1">Elegí deporte y zona, y anotate</p>
      </div>

      {/* Selector de deporte */}
      <div className="px-5 md:px-12 py-5 border-b border-f-border">
        <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-3">¿Qué querés jugar?</p>
        <div className="flex gap-3">
          {[
            { id: 'todos',  label: 'Todos',  icon: '🏟️' },
            { id: 'futbol', label: 'Fútbol', icon: '⚽' },
            { id: 'padel',  label: 'Pádel',  icon: '🎾' },
          ].map(d => (
            <button key={d.id} onClick={() => setDeporte(d.id)}
              className="flex-1 py-4 rounded-2xl font-black text-base uppercase border transition-all active:scale-95 flex flex-col items-center gap-1"
              style={deporte === d.id
                ? { background: '#0ea5e9', borderColor: '#0ea5e9', color: '#0c0c0c' }
                : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#5a5a5a' }}>
              <span className="text-2xl">{d.icon}</span>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro barrio */}
      <div className="border-b border-f-border">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar px-4 py-2.5">
          {['Todos', ...BARRIOS_MONTEVIDEO].map(b => (
            <button key={b} onClick={() => setBarrio(b)}
              className={`flex-shrink-0 px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wide transition-all
                          ${barrio === b ? 'bg-white/10 text-white' : 'text-f-muted'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="px-4 md:px-12 py-5">
        <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-4">
          {cargando ? '...' : `${filtrados.length} partido${filtrados.length !== 1 ? 's' : ''} disponible${filtrados.length !== 1 ? 's' : ''}`}
        </p>

        {cargando ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card h-36 animate-pulse" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-6xl mb-4">😔</p>
            <p className="text-f-text text-xl font-black uppercase">Sin partidos</p>
            <p className="text-f-muted text-sm mt-1">Probá cambiando el deporte o el barrio</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(p => (
              <MiniCard key={p.id} partido={p}
                uid={user?.uid}
                baneado={estaBaneado}
                onChat={() => setChatPartido(p)}
                onVerDetalle={() => onVerDetalle?.(p)} />
            ))}
          </div>
        )}
      </div>

      {chatPartido && (
        <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />
      )}
    </div>
  );
}

function MiniCard({ partido, uid, baneado, onChat, onVerDetalle }) {
  const jugadores   = partido.jugadores || [];
  const estaAnotado = uid && jugadores.includes(uid);
  const anotados    = partido.jugadoresAnotados ?? 0;
  const cupo        = partido.cupoTotal ?? 10;
  const libres      = cupo - anotados;
  const lleno       = libres <= 0;
  const pct         = Math.min(100, Math.round((anotados / cupo) * 100));
  const [accion, setAccion] = useState(null);

  const fecha    = new Date(partido.fechaHora);
  const hoy      = new Date();
  const diaLabel = fecha.toDateString() === hoy.toDateString() ? 'HOY'
    : fecha.toDateString() === new Date(Date.now()+86400000).toDateString() ? 'MÑN'
    : fecha.toLocaleDateString('es-UY', { weekday:'short', day:'numeric', month:'short' }).toUpperCase();
  const hora     = fecha.toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' });
  const barColor = lleno ? '#ef4444' : pct >= 75 ? '#f97316' : '#0ea5e9';

  const handleAnotarse = async () => {
    if (!uid || accion) return;
    setAccion('anotando');
    try { await anotarseAPartido(partido.id, uid); }
    catch {}
    setAccion(null);
  };
  const handleSalirse = async () => {
    if (!uid || accion) return;
    setAccion('saliendo');
    try { await desanotarseDePartido(partido.id, uid); }
    catch {}
    setAccion(null);
  };

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{
           background: '#141414',
           border: estaAnotado ? '1px solid rgba(14,165,233,0.3)' : '1px solid #222',
         }}>
      <div className="flex">
        <div className="w-1 flex-shrink-0" style={{ background: barColor }} />
        <div className="flex-1 p-4">

          {/* Fila 1 */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0">{partido.deporte === 'padel' ? '🎾' : '⚽'}</span>
              <div className="min-w-0">
                <p className="text-white font-black text-sm leading-tight truncate">{partido.nombreCancha}</p>
                <p className="text-f-muted text-xs">{partido.barrio} · {diaLabel} {hora}hs</p>
              </div>
            </div>
            <button onClick={onVerDetalle}
              className="text-f-muted text-xs px-2 py-1 rounded-lg flex-shrink-0 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              ···
            </button>
          </div>

          {/* Barra jugadores */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-f-muted">{anotados}/{cupo} jugadores</span>
              <span className="font-black" style={{ color: barColor }}>
                {lleno ? 'LLENO' : `${libres} libre${libres !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#222' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
            </div>
          </div>

          {/* Precio + botón */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-black text-lg" style={{ color: '#54b5f0' }}>
                ${partido.precioPorJugador?.toLocaleString('es-UY') ?? '0'}
              </span>
              <span className="text-f-muted text-xs"> /jug</span>
            </div>
            <div className="flex gap-2">
              {estaAnotado && (
                <button onClick={onChat}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm active:scale-95"
                  style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(84,181,240,0.15)', color: '#54b5f0' }}>
                  💬
                </button>
              )}
              {estaAnotado ? (
                <button onClick={handleSalirse} disabled={accion === 'saliendo'}
                  className="px-4 h-9 rounded-xl font-black text-xs uppercase active:scale-95 disabled:opacity-50"
                  style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {accion === 'saliendo' ? '...' : 'Salirme'}
                </button>
              ) : (
                <button onClick={handleAnotarse}
                  disabled={lleno || baneado || accion === 'anotando'}
                  className="px-5 h-9 rounded-xl font-black text-sm uppercase active:scale-95 disabled:opacity-50"
                  style={lleno || baneado
                    ? { background: '#1c1c1c', color: '#5a5a5a', border: '1px solid #2a2a2a' }
                    : { background: '#0ea5e9', color: '#fff', boxShadow: '0 4px 16px rgba(14,165,233,0.35)' }}>
                  {accion === 'anotando' ? '...' : lleno ? 'LLENO' : baneado ? 'SUSP.' : '¡ME ANOTO!'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
