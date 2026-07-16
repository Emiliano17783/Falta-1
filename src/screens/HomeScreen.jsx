import { useState, useEffect } from 'react';
import { suscribirPartidos, anotarseAPartido, desanotarseDePartido } from '../firebase/firestore';
import { PARTIDOS_DEMO } from '../data/partidos';
import { BARRIOS_MONTEVIDEO } from '../data/canchas';
import ChatModal from '../modals/ChatModal';
import { useAuth } from '../context/AuthContext';

const DEPORTES = ['Todos', 'Fútbol', 'Pádel'];

export default function HomeScreen({ setTab, onVerDetalle }) {
  const { user, perfil } = useAuth();
  const [partidos, setPartidos] = useState([]);
  const [deporte, setDeporte] = useState('Todos');
  const [barrio, setBarrio] = useState('Todos');
  const [chatPartido, setChatPartido] = useState(null);
  const [cargando, setCargando] = useState(true);

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
    if (deporte === 'Fútbol' && p.deporte !== 'futbol') return false;
    if (deporte === 'Pádel' && p.deporte !== 'padel') return false;
    if (barrio !== 'Todos' && p.barrio !== barrio) return false;
    return true;
  });

  const hoy = new Date();
  const hoyCount = filtrados.filter(p =>
    new Date(p.fechaHora).toDateString() === hoy.toDateString()
  ).length;

  return (
    <div className="min-h-svh bg-f-bg">

      {/* Banner baneado */}
      {estaBaneado && (
        <div className="bg-red-950 border-b border-red-800 px-5 py-3 flex items-center gap-3">
          <span className="text-red-400 text-lg flex-shrink-0">🚫</span>
          <p className="text-red-300 font-bold text-sm">
            {perfil?.bloqueado
              ? 'Cuenta bloqueada. Contactá al soporte.'
              : `Suspendido hasta el ${new Date(perfil.penalizacionHasta).toLocaleDateString('es-UY')}.`}
          </p>
        </div>
      )}
      {perfil?.advertencia && !estaBaneado && (
        <div className="bg-yellow-950 border-b border-yellow-800 px-5 py-3 flex items-center gap-3">
          <span className="text-yellow-400 flex-shrink-0">⚠️</span>
          <p className="text-yellow-300 text-sm font-medium">
            Depósito pendiente por cancelación tardía.
          </p>
        </div>
      )}

      {/* ── HERO ── */}
      <div className="relative overflow-hidden flex flex-col justify-between"
           style={{ background: '#0c0c0c', height: 'clamp(200px, 30vw, 280px)' }}>

        {/* Fondo: video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.6 }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, rgba(12,12,12,0.15) 0%, rgba(12,12,12,0.65) 100%)' }} />

        {/* Texto arriba-izquierda */}
        <div className="relative z-10 px-5 md:px-12 pt-6">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] leading-none mb-0.5">
            ¿te falta
          </p>
          <h1 className="font-black uppercase leading-none text-white"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 0.9 }}>
            UN <span style={{ color: '#0ea5e9' }}>JUGADOR</span>?
          </h1>
        </div>

        {/* CTA Button abajo */}
        <div className="relative z-10 -mx-0">
          <button onClick={() => setTab?.('crear')}
            className="w-full py-4 flex items-center justify-between px-6 md:px-12
                       font-black text-xl uppercase transition-all active:brightness-90"
            style={{ background: '#0ea5e9', color: '#0c0c0c' }}>
            <span>+ CREAR PARTIDO</span>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── PASOS ── */}
      <div className="px-4 md:px-12 py-4 border-b border-f-border">
        <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-3">Cómo unirte</p>
        <div className="flex gap-3">
          {[
            { n: '1', title: 'Elegí deporte', sub: 'Fútbol o Pádel' },
            { n: '2', title: 'Buscá barrio', sub: 'Filtrá por zona' },
            { n: '3', title: 'Unite', sub: 'El org. te acepta' },
          ].map(s => (
            <div key={s.n} className="flex-1 rounded-xl px-3 py-2.5"
                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="font-black text-xs" style={{ color: '#0ea5e9' }}>{s.n}</span>
              <p className="text-white font-black text-xs leading-tight mt-0.5">{s.title}</p>
              <p className="text-f-muted text-[10px] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTROS ── */}
      <div className="sticky top-0 z-30 bg-f-bg border-b border-f-border">

        {/* Tabs deporte */}
        <div className="flex border-b border-f-border">
          {DEPORTES.map(d => (
            <button key={d} onClick={() => setDeporte(d)}
              className="relative flex-1 py-3 font-black text-sm uppercase tracking-wide transition-colors"
              style={{ color: deporte === d ? '#54b5f0' : '#5a5a5a' }}>
              {d === 'Fútbol' ? '⚽ Fútbol' : d === 'Pádel' ? '🎾 Pádel' : 'Todos'}
              {deporte === d && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-f-green" />
              )}
            </button>
          ))}
        </div>

        {/* Scroll barrios */}
        <div className="flex gap-1 overflow-x-auto hide-scrollbar px-3 py-2.5">
          {['Todos', ...BARRIOS_MONTEVIDEO].map(b => (
            <button key={b} onClick={() => setBarrio(b)}
              className={`flex-shrink-0 px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wide transition-all
                          ${barrio === b
                            ? 'bg-white/10 text-white'
                            : 'text-f-muted hover:text-f-text'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTA ── */}
      <div className="px-4 md:px-12 py-5">
        <div className="flex justify-between items-baseline mb-4">
          <p className="text-white font-black text-lg uppercase">
            {cargando ? '...' : `${filtrados.length} partido${filtrados.length !== 1 ? 's' : ''}`}
          </p>
          {!cargando && hoyCount > 0 && (
            <p className="text-f-green text-sm font-bold">{hoyCount} son hoy →</p>
          )}
        </div>

        {cargando ? (
          <div className="partidos-grid">
            {[1,2,3].map(i => <div key={i} className="card h-52 animate-pulse" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="text-7xl mb-4">😔</p>
            <p className="text-f-text text-2xl font-black uppercase">Sin partidos</p>
            <p className="text-f-muted text-base mt-1 mb-6">Cambiá los filtros o creá el tuyo</p>
            <button onClick={() => setTab?.('crear')}
              className="bg-f-green text-white font-black text-lg uppercase px-8 py-3.5 rounded-2xl">
              + CREAR PARTIDO
            </button>
          </div>
        ) : (
          <div className="partidos-grid">
            {filtrados.map(p => (
              <PartidoCard key={p.id} partido={p}
                uid={user?.uid}
                baneado={estaBaneado}
                onChat={() => setChatPartido(p)}
                onVerDetalle={() => onVerDetalle?.(p)} />
            ))}
          </div>
        )}
      </div>

      {/* ── BARRIOS ACTIVOS ── */}
      {(() => {
        const barriosConPartidos = BARRIOS_MONTEVIDEO.filter(b => partidos.some(p => p.barrio === b));
        if (barriosConPartidos.length === 0) return null;
        return (
          <div className="px-4 md:px-12 pb-8 border-t border-f-border pt-8">
            <p className="text-f-muted text-xs font-black uppercase tracking-[0.2em] mb-1">Dónde jugar</p>
            <h2 className="text-white text-2xl font-black uppercase mb-5">Barrios activos</h2>
            <div className="flex flex-wrap gap-2">
              {barriosConPartidos.map(b => {
                const cnt = partidos.filter(p => p.barrio === b).length;
                return (
                  <button key={b} onClick={() => setBarrio(b)}
                    className="flex items-center gap-2 px-4 py-2 font-black text-sm uppercase tracking-wide
                               border border-f-border text-f-muted hover:border-f-green hover:text-white transition-colors active:scale-95 rounded-lg">
                    {b}
                    <span className="text-f-green text-xs">{cnt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── FOOTER ── */}
      <div className="px-4 md:px-12 py-8 border-t border-f-border pb-28 md:pb-10">
        <p className="text-white font-black text-2xl uppercase mb-0.5">FALTA 1</p>
        <p className="text-f-muted text-sm">⚽ Fútbol · 🎾 Pádel · Montevideo 🇺🇾</p>
      </div>

      {chatPartido && (
        <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />
      )}
    </div>
  );
}

function PartidoCard({ partido, uid, baneado, onChat, onVerDetalle }) {
  const jugadores = partido.jugadores || [];
  const estaAnotado = uid && jugadores.includes(uid);
  const anotados = partido.jugadoresAnotados ?? 0;
  const cupo = partido.cupoTotal ?? 10;
  const pct = Math.min(100, Math.round((anotados / cupo) * 100));
  const lleno = partido.estado === 'lleno' || pct >= 100;
  const casiFull = pct >= 75 && !lleno;
  const libres = cupo - anotados;

  const [accion, setAccion] = useState(null);
  const [mensajeError, setMensajeError] = useState('');

  const fecha = new Date(partido.fechaHora);
  const hoy = new Date();
  const diaLabel = fecha.toDateString() === hoy.toDateString() ? 'HOY'
    : fecha.toDateString() === new Date(Date.now()+86400000).toDateString() ? 'MÑN'
    : fecha.toLocaleDateString('es-UY', { weekday:'short' }).toUpperCase();
  const diaNum  = fecha.toLocaleDateString('es-UY', { day:'numeric', month:'short' }).toUpperCase();
  const hora    = fecha.toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' });

  const barColor = lleno ? '#ef4444' : casiFull ? '#f97316' : '#0ea5e9';

  const deporteIcon  = partido.deporte === 'padel' ? '🎾' : '⚽';
  const deporteLabel = partido.deporte === 'padel'
    ? 'Pádel' : partido.modalidad === 'F5' ? 'F5' : 'F7';

  const nivelColor = {
    Principiante: '#22c55e',
    Intermedio:   '#f59e0b',
    Avanzado:     '#ef4444',
  }[partido.nivel] || '#54b5f0';

  const handleAnotarse = async () => {
    if (!uid || accion) return;
    setAccion('anotando'); setMensajeError('');
    try {
      await anotarseAPartido(partido.id, uid);
      setAccion(null);
    } catch (err) {
      setMensajeError(err.message); setAccion('error');
      setTimeout(() => setAccion(null), 3000);
    }
  };

  const handleSalirse = async () => {
    if (!uid || accion) return;
    setAccion('saliendo'); setMensajeError('');
    try {
      await desanotarseDePartido(partido.id, uid);
      setAccion(null);
    } catch (err) {
      setMensajeError(err.message); setAccion('error');
      setTimeout(() => setAccion(null), 3000);
    }
  };

  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl flex flex-col"
         style={{
           background: '#141414',
           border: estaAnotado ? '1px solid rgba(14,165,233,0.3)' : '1px solid #222',
           boxShadow: estaAnotado ? '0 0 24px rgba(14,165,233,0.08)' : '0 4px 20px rgba(0,0,0,0.4)',
         }}>

      {/* Franja lateral de color (izquierda) */}
      <div className="flex flex-1">
        <div className="w-1 flex-shrink-0" style={{ background: barColor }} />

        <div className="flex flex-col flex-1 p-4 gap-3">

          {/* Fila 1: Sport icon + cancha + barrio */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                 style={{ background: 'rgba(255,255,255,0.05)' }}>
              {deporteIcon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-base leading-tight truncate">{partido.nombreCancha}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-f-muted text-xs font-medium">{partido.barrio}</p>
                {partido.precioTotalCancha > 0 && (
                  <span className="text-f-muted text-xs">·</span>
                )}
                {partido.precioTotalCancha > 0 && (
                  <p className="text-f-muted text-xs font-medium">
                    Total ${partido.precioTotalCancha.toLocaleString('es-UY')}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onVerDetalle}
              className="flex-shrink-0 text-f-muted text-xs font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              ···
            </button>
          </div>

          {/* Fila 2: Fecha + hora grande + badges */}
          <div className="flex items-center gap-3">
            {/* Bloque tiempo estilo scoreboard */}
            <div className="flex-shrink-0 text-center"
                 style={{ minWidth: 72 }}>
              <p className="text-xs font-black uppercase tracking-widest"
                 style={{ color: estaAnotado ? '#54b5f0' : '#5a5a5a' }}>
                {diaLabel}
              </p>
              <p className="font-black leading-none" style={{ fontSize: '2rem', color: '#f2f5eb' }}>
                {hora}
              </p>
              <p className="text-f-muted text-xs">{diaNum}</p>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch" style={{ background: '#2a2a2a' }} />

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-black px-2 py-1 rounded-md uppercase"
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
                {deporteLabel}
              </span>
              {partido.nivel && (
                <span className="text-xs font-black px-2 py-1 rounded-md uppercase"
                      style={{ background: nivelColor + '18', color: nivelColor }}>
                  {partido.nivel}
                </span>
              )}
              {estaAnotado && (
                <span className="text-xs font-black px-2 py-1 rounded-md uppercase"
                      style={{ background: 'rgba(14,165,233,0.12)', color: '#54b5f0' }}>
                  ✓ anotado
                </span>
              )}
              {casiFull && !estaAnotado && (
                <span className="text-xs font-black px-2 py-1 rounded-md uppercase animate-pulse"
                      style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
                  ¡{libres} lugar{libres !== 1 ? 'es' : ''}!
                </span>
              )}
              {lleno && (
                <span className="text-xs font-black px-2 py-1 rounded-md uppercase"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                  LLENO
                </span>
              )}
            </div>
          </div>

          {/* Fila 3: barra de progreso minimalista */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-f-muted font-bold">{anotados}/{cupo} jugadores</span>
              <span className="font-black" style={{ color: barColor }}>
                {libres > 0 ? `${libres} libre${libres !== 1 ? 's' : ''}` : 'LLENO'}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#222' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${pct}%`, background: barColor }} />
            </div>
          </div>

          {accion === 'error' && mensajeError && (
            <p className="text-red-400 text-xs -mt-1">{mensajeError}</p>
          )}

          {/* Fila 4: precio + botones */}
          <div className="flex items-center justify-between gap-2 pt-1"
               style={{ borderTop: '1px solid #222' }}>
            <div>
              <span className="font-black text-xl" style={{ color: '#54b5f0' }}>
                ${partido.precioPorJugador?.toLocaleString('es-UY') ?? '0'}
              </span>
              <span className="text-f-muted text-xs font-medium"> /jug</span>
            </div>

            <div className="flex gap-2">
              {estaAnotado && (
                <button onClick={onChat}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all active:scale-95"
                  style={{ background: 'rgba(14,165,233,0.08)', color: '#54b5f0', border: '1px solid rgba(84,181,240,0.15)' }}>
                  💬
                </button>
              )}
              {estaAnotado ? (
                <button onClick={handleSalirse} disabled={accion === 'saliendo'}
                  className="px-4 h-9 rounded-xl font-black text-xs uppercase transition-all active:scale-95 disabled:opacity-50"
                  style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {accion === 'saliendo' ? '...' : 'Salirme'}
                </button>
              ) : (
                <button onClick={handleAnotarse}
                  disabled={lleno || baneado || accion === 'anotando'}
                  className="px-5 h-9 rounded-xl font-black text-sm uppercase transition-all active:scale-95 disabled:opacity-50"
                  style={lleno || baneado
                    ? { background: '#1c1c1c', color: '#5a5a5a', cursor: 'not-allowed', border: '1px solid #2a2a2a' }
                    : { background: '#0ea5e9', color: '#fff', boxShadow: '0 4px 16px rgba(14,165,233,0.35)' }}>
                  {accion === 'anotando' ? '...' : lleno ? 'LLENO' : baneado ? 'SUSPENDIDO' : '¡ME ANOTO!'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
