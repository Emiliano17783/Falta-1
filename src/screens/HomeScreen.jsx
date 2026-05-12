import { useState, useEffect } from 'react';
import { suscribirPartidos, anotarseAPartido, desanotarseDePartido } from '../firebase/firestore';
import { PARTIDOS_DEMO, NIVEL_CONFIG } from '../data/partidos';
import { BARRIOS_MONTEVIDEO } from '../data/canchas';
import ChatModal from '../modals/ChatModal';
import { useAuth } from '../context/AuthContext';

const MODALIDADES = ['Todos', 'F5', 'F7'];
const NIVELES_F = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

export default function HomeScreen({ setTab }) {
  const { user, perfil } = useAuth();
  const [partidos, setPartidos] = useState([]);
  const [modalidad, setModalidad] = useState('Todos');
  const [nivel, setNivel] = useState('Todos');
  const [barrio, setBarrio] = useState('Todos');
  const [chatPartido, setChatPartido] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Verificar si el usuario está penalizado/baneado
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
    if (modalidad !== 'Todos' && p.modalidad !== modalidad) return false;
    if (nivel !== 'Todos' && p.nivel !== nivel) return false;
    if (barrio !== 'Todos' && p.barrio !== barrio) return false;
    return true;
  });

  const hoy = new Date();
  const hoyCount = filtrados.filter(p =>
    new Date(p.fechaHora).toDateString() === hoy.toDateString()
  ).length;

  return (
    <div className="min-h-svh bg-f-bg">

      {/* Banner de penalización */}
      {estaBaneado && (
        <div className="bg-red-950 border-b border-red-800 px-6 py-3 flex items-center gap-3">
          <span className="text-red-400 text-xl flex-shrink-0">🚫</span>
          <div>
            <p className="text-red-300 font-bold text-sm">
              {perfil?.bloqueado
                ? 'Cuenta suspendida permanentemente por incumplimiento reiterado.'
                : `Suspendido hasta el ${new Date(perfil.penalizacionHasta).toLocaleDateString('es-UY')}. No podés anotarte a partidos.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Banner de advertencia */}
      {perfil?.advertencia && !estaBaneado && (
        <div className="bg-yellow-950 border-b border-yellow-800 px-6 py-3 flex items-center gap-3">
          <span className="text-yellow-400 text-xl flex-shrink-0">⚠️</span>
          <p className="text-yellow-300 text-sm font-medium">
            Advertencia: faltaste a un partido sin avisar con 2 horas de anticipación. Una vez más y serás suspendido por 1 mes.
          </p>
        </div>
      )}

      {/* HERO */}
      <div className="hero-bg">
        <div className="relative z-10 px-6 md:px-12 pt-10 pb-10">
          <p className="text-green-300 text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-f-accent inline-block animate-pulse-green" />
            Hola, {user?.displayName?.split(' ')[0] || 'jugador'} — Montevideo
          </p>
          <h1 className="text-white font-black uppercase leading-none mb-5"
              style={{ fontSize: 'clamp(2.5rem,7vw,5.5rem)' }}>
            ¿TE FALTA<br />
            <span className="text-f-accent">UN JUGADOR?</span>
          </h1>
          <div className="flex flex-wrap gap-3 mb-7">
            <StatChip valor={hoyCount} label="partidos hoy" />
            <StatChip valor={partidos.length} label="disponibles" />
            <StatChip valor="14" label="canchas" onClick={() => setTab && setTab('canchas')} clickable />
          </div>
          <button onClick={() => setTab && setTab('crear')}
            className="inline-flex items-center gap-2 bg-f-accent text-f-bg font-black text-lg uppercase
                       px-7 py-3.5 rounded-2xl active:scale-95 transition-transform"
            style={{ boxShadow: '0 4px 24px rgba(74,222,128,0.45)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            CREAR PARTIDO
          </button>
        </div>
        <svg className="absolute right-0 bottom-0 opacity-[0.07] h-56 md:h-72 pointer-events-none"
             viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="3"/>
          <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="2"/>
          <circle cx="100" cy="100" r="25" stroke="white" strokeWidth="2"/>
          <rect x="10" y="65" width="45" height="70" stroke="white" strokeWidth="2"/>
          <rect x="145" y="65" width="45" height="70" stroke="white" strokeWidth="2"/>
        </svg>
      </div>

      {/* FILTROS sticky */}
      <div className="sticky top-0 z-30 bg-f-bg/95 backdrop-blur-sm border-b border-f-border">
        <div className="px-4 md:px-12 py-3 flex flex-wrap gap-2 items-center">
          {MODALIDADES.map(m => (
            <button key={m} onClick={() => setModalidad(m)}
              className={`px-3 py-1.5 rounded-lg font-bold text-sm uppercase border transition-all
                          ${modalidad === m ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
              {m === 'F5' ? 'Fútbol 5' : m === 'F7' ? 'Fútbol 7' : m}
            </button>
          ))}
          <div className="w-px h-5 bg-f-border hidden sm:block" />
          {NIVELES_F.map(n => (
            <button key={n} onClick={() => setNivel(n)}
              className={`px-3 py-1.5 rounded-lg font-bold text-sm uppercase border transition-all
                          ${nivel === n ? 'bg-f-accent border-f-accent text-f-bg' : 'border-f-border text-f-muted'}`}>
              {n}
            </button>
          ))}
          <div className="w-px h-5 bg-f-border hidden sm:block" />
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {['Todos', ...BARRIOS_MONTEVIDEO.slice(0,8)].map(b => (
              <button key={b} onClick={() => setBarrio(b)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-bold text-sm border transition-all
                            ${barrio === b ? 'bg-f-card border-f-border text-f-text' : 'border-transparent text-f-muted'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRILLA */}
      <div className="px-4 md:px-12 py-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-f-muted text-sm font-bold uppercase tracking-wider">
            {cargando ? '...' : `${filtrados.length} partido${filtrados.length !== 1 ? 's' : ''}`}
          </p>
          {!cargando && hoyCount > 0 && (
            <p className="text-f-accent text-sm font-bold">{hoyCount} son hoy</p>
          )}
        </div>

        {cargando ? (
          <div className="partidos-grid">
            {[1,2,3].map(i => <div key={i} className="card h-52 animate-pulse" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="text-7xl mb-4">😔</span>
            <p className="text-f-text text-2xl font-black uppercase">Sin partidos</p>
            <p className="text-f-muted text-base mt-1 mb-6">Cambiá los filtros o creá el tuyo</p>
            <button onClick={() => setTab && setTab('crear')}
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
                onChat={() => setChatPartido(p)} />
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

function StatChip({ valor, label, onClick, clickable }) {
  const cls = "flex items-center gap-2 rounded-xl px-4 py-2.5 border border-white/8"
    + " bg-white/[0.04] backdrop-blur-sm";
  return clickable ? (
    <button onClick={onClick} className={`${cls} active:scale-95 transition-transform`}>
      <span className="text-f-accent text-2xl font-black">{valor}</span>
      <span className="text-f-text/70 text-sm font-medium">{label} →</span>
    </button>
  ) : (
    <div className={cls}>
      <span className="text-f-accent text-2xl font-black">{valor}</span>
      <span className="text-f-text/70 text-sm font-medium">{label}</span>
    </div>
  );
}

function PartidoCard({ partido, uid, baneado, onChat }) {
  const nivelCfg = NIVEL_CONFIG[partido.nivel] || NIVEL_CONFIG.Intermedio;
  const nivelKey = partido.nivel?.toLowerCase().includes('prin') ? 'principiante'
    : partido.nivel?.toLowerCase().includes('inter') ? 'intermedio' : 'avanzado';

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
    : fecha.toDateString() === new Date(Date.now()+86400000).toDateString() ? 'MAÑANA'
    : fecha.toLocaleDateString('es-UY', { weekday:'short', day:'numeric', month:'short' }).toUpperCase();
  const hora = fecha.toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' });

  const barColor = lleno ? '#ef4444' : casiFull ? '#f97316' : '#c4f54b';

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
    <div className={`card animate-fade-in flex flex-col overflow-hidden
                     ${estaAnotado ? '' : ''}`}
         style={estaAnotado ? { borderColor: 'rgba(196,245,75,0.2)', boxShadow: '0 0 0 1px rgba(196,245,75,0.06), 0 8px 32px rgba(0,0,0,0.5)' } : {}}>

      {/* Top stripe de nivel */}
      <div className="h-1 w-full" style={{ background: nivelCfg.color }} />

      <div className="p-5 flex flex-col flex-1 gap-4">

        {/* ── Fila 1: Cancha + nivel badge ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-f-text text-lg font-black leading-tight truncate">{partido.nombreCancha}</p>
            <p className="text-f-muted text-xs mt-0.5 font-medium">📍 {partido.barrio}</p>
          </div>
          <span className={`nivel-${nivelKey} px-2.5 py-1 rounded-lg text-xs font-black uppercase flex-shrink-0`}>
            {partido.nivel}
          </span>
        </div>

        {/* ── Fila 2: Fecha/hora prominente ── */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl px-5 py-3 flex flex-col items-center flex-shrink-0"
               style={{ background: estaAnotado ? 'rgba(196,245,75,0.08)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${estaAnotado ? 'rgba(196,245,75,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <span className="text-xs font-black tracking-widest"
                  style={{ color: estaAnotado ? '#c4f54b' : '#5a5a5a' }}>{diaLabel}</span>
            <span className="text-f-text text-3xl font-black leading-tight">{hora}</span>
            <span className="text-f-muted text-xs font-medium">hs</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f2f5eb' }}>
              ⚽ {partido.modalidad === 'F5' ? 'Fútbol 5' : 'Fútbol 7'}
            </span>
            {estaAnotado && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black"
                    style={{ background: 'rgba(196,245,75,0.1)', border: '1px solid rgba(196,245,75,0.25)', color: '#c4f54b' }}>
                ✓ Estás anotado
              </span>
            )}
            {casiFull && !estaAnotado && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black animate-pulse"
                    style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>
                ¡Solo {libres} lugar{libres !== 1 ? 'es' : ''}!
              </span>
            )}
            {lleno && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                LLENO
              </span>
            )}
          </div>
        </div>

        {/* ── Fila 3: Jugadores (dots estilo Appito) ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-f-muted text-xs font-bold">{anotados} / {cupo} jugadores</span>
            <span className="text-xs font-black" style={{ color: barColor }}>{libres > 0 ? `${libres} libre${libres !== 1 ? 's' : ''}` : 'LLENO'}</span>
          </div>
          {/* Dots de jugadores */}
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: cupo }).map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full transition-all duration-300"
                   style={{
                     background: i < anotados
                       ? (i === jugadores.indexOf(uid) && estaAnotado ? '#c4f54b' : barColor)
                       : 'rgba(255,255,255,0.08)',
                     border: i < anotados ? 'none' : '1px dashed rgba(255,255,255,0.12)',
                   }} />
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {accion === 'error' && mensajeError && (
          <p className="text-red-400 text-xs text-center -mt-1">{mensajeError}</p>
        )}

        {/* ── Footer: precio + botones ── */}
        <div className="flex items-center justify-between mt-auto gap-2 pt-1"
             style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <span className="font-black text-2xl" style={{ color: '#c4f54b' }}>
              ${partido.precioPorJugador?.toLocaleString('es-UY') ?? '0'}
            </span>
            <span className="text-f-muted text-xs"> /jug</span>
          </div>

          <div className="flex gap-2">
            {estaAnotado && (
              <button onClick={onChat}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all active:scale-95"
                style={{ background: 'rgba(196,245,75,0.08)', border: '1px solid rgba(196,245,75,0.2)', color: '#c4f54b' }}>
                💬
              </button>
            )}

            {estaAnotado ? (
              <button onClick={handleSalirse} disabled={accion === 'saliendo'}
                className="px-4 h-10 rounded-xl font-black text-xs uppercase transition-all active:scale-95 disabled:opacity-50"
                style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {accion === 'saliendo' ? '...' : 'Salirme'}
              </button>
            ) : (
              <button onClick={handleAnotarse}
                disabled={lleno || baneado || accion === 'anotando'}
                className="px-5 h-10 rounded-xl font-black text-sm uppercase transition-all active:scale-95 disabled:opacity-50"
                style={lleno || baneado
                  ? { background: 'rgba(255,255,255,0.06)', color: '#5a5a5a', cursor: 'not-allowed' }
                  : { background: '#c4f54b', color: '#0c0c0c', boxShadow: '0 4px 20px rgba(196,245,75,0.3)' }}>
                {accion === 'anotando' ? '...' : lleno ? 'LLENO' : baneado ? 'SUSPENDIDO' : '¡ME ANOTO!'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
