import { useState, useEffect } from 'react';
import { suscribirPartidos } from '../firebase/firestore';
import { PARTIDOS_DEMO, NIVEL_CONFIG } from '../data/partidos';
import { BARRIOS_MONTEVIDEO } from '../data/canchas';
import PaymentModal from '../modals/PaymentModal';
import { useAuth } from '../context/AuthContext';

const MODALIDADES = ['Todos', 'F5', 'F7'];
const NIVELES_F = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

export default function HomeScreen({ setTab }) {
  const { user } = useAuth();
  const [partidos, setPartidos] = useState([]);
  const [modalidad, setModalidad] = useState('Todos');
  const [nivel, setNivel] = useState('Todos');
  const [barrio, setBarrio] = useState('Todos');
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);

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
        {/* Decoración campo */}
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
              <PartidoCard key={p.id} partido={p} onAnotarse={() => setSeleccionado(p)} />
            ))}
          </div>
        )}
      </div>

      {seleccionado && (
        <PaymentModal partido={seleccionado} onClose={() => setSeleccionado(null)} onExito={() => setSeleccionado(null)} />
      )}
    </div>
  );
}

function StatChip({ valor, label, onClick, clickable }) {
  const cls = "flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10";
  return clickable ? (
    <button onClick={onClick} className={`${cls} active:scale-95 transition-transform`}>
      <span className="text-f-accent text-2xl font-black">{valor}</span>
      <span className="text-green-200 text-sm font-medium">{label} →</span>
    </button>
  ) : (
    <div className={cls}>
      <span className="text-f-accent text-2xl font-black">{valor}</span>
      <span className="text-green-200 text-sm font-medium">{label}</span>
    </div>
  );
}

function PartidoCard({ partido, onAnotarse }) {
  const nivelKey = partido.nivel?.toLowerCase().includes('prin') ? 'principiante'
    : partido.nivel?.toLowerCase().includes('inter') ? 'intermedio' : 'avanzado';
  const nivelCfg = NIVEL_CONFIG[partido.nivel] || NIVEL_CONFIG.Intermedio;
  const pct = Math.min(100, Math.round((partido.jugadoresAnotados / partido.cupoTotal) * 100));
  const lleno = pct >= 100;
  const casiFull = pct >= 80 && !lleno;

  const fecha = new Date(partido.fechaHora);
  const hoy = new Date();
  const esMañana = fecha.toDateString() === new Date(Date.now()+86400000).toDateString();
  const diaLabel = fecha.toDateString() === hoy.toDateString() ? 'Hoy'
    : esMañana ? 'Mañana'
    : fecha.toLocaleDateString('es-UY', { weekday:'short', day:'numeric', month:'short' });
  const hora = fecha.toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' });

  return (
    <div className="card animate-fade-in flex flex-col overflow-hidden group">
      {/* Stripe top */}
      <div className="h-1.5 w-full" style={{ background: nivelCfg.color }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-3">
            <p className="text-white text-xl font-black uppercase leading-tight">{partido.nombreCancha}</p>
            <p className="text-f-muted text-sm mt-0.5">📍 {partido.barrio}</p>
          </div>
          <span className={`nivel-${nivelKey} px-2.5 py-1 rounded-lg text-xs font-black uppercase flex-shrink-0`}>
            {partido.nivel}
          </span>
        </div>

        {/* Fecha/hora + modalidad */}
        <div className="flex items-stretch gap-3 mb-4">
          <div className="flex flex-col items-center justify-center bg-f-surface rounded-xl px-4 py-2.5 flex-shrink-0">
            <span className="text-f-accent text-xs font-bold uppercase tracking-wide">{diaLabel}</span>
            <span className="text-white text-2xl font-black leading-tight">{hora}</span>
          </div>
          <div className="flex flex-col justify-center gap-1.5">
            <span className="bg-f-surface border border-f-border px-2.5 py-1 rounded-lg text-f-text text-xs font-bold inline-block w-fit">
              {partido.modalidad === 'F5' ? '⚽ Fútbol 5' : '⚽ Fútbol 7'}
            </span>
            {casiFull && (
              <span className="bg-orange-950 border border-orange-800 text-orange-400 px-2.5 py-1 rounded-lg text-xs font-bold w-fit animate-pulse">
                ¡Casi lleno!
              </span>
            )}
            {lleno && (
              <span className="bg-red-950 border border-red-800 text-red-400 px-2.5 py-1 rounded-lg text-xs font-bold w-fit">
                LLENO
              </span>
            )}
          </div>
        </div>

        {/* Barra jugadores */}
        <div className="mb-5">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-f-muted">{partido.jugadoresAnotados} / {partido.cupoTotal} jugadores</span>
            <span style={{ color: lleno ? '#ef4444' : casiFull ? '#f97316' : '#4ade80' }}>{pct}%</span>
          </div>
          <div className="w-full h-2 bg-f-surface rounded-full overflow-hidden">
            <div className="h-full rounded-full progress-fill"
                 style={{ width: `${pct}%`, background: lleno ? '#ef4444' : casiFull ? '#f97316' : '#16a34a' }} />
          </div>
        </div>

        {/* Footer precio + botón */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-f-accent text-3xl font-black">
              ${partido.precioPorJugador.toLocaleString('es-UY')}
            </span>
            <span className="text-f-muted text-sm"> /jug</span>
          </div>
          <button onClick={onAnotarse} disabled={lleno}
            className={`px-5 py-2.5 rounded-xl font-black text-sm uppercase transition-all active:scale-95
                        ${lleno ? 'bg-f-border text-f-muted cursor-not-allowed' : 'bg-f-green text-white'}`}
            style={!lleno ? { boxShadow: '0 4px 14px rgba(22,163,74,0.4)' } : {}}>
            {lleno ? 'LLENO' : '¡ME ANOTO!'}
          </button>
        </div>
      </div>
    </div>
  );
}
