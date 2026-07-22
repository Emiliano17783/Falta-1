import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { CANCHAS } from '../data/canchas';

export default function HomeScreen({ setTab }) {
  const { perfil } = useAuth();
  const [partidosHoy, setPartidosHoy] = useState(null);
  const [jugadores, setJugadores] = useState(null);
  const [ultimosPartidos, setUltimosPartidos] = useState([]);

  const estaBaneado = perfil?.bloqueado || (
    perfil?.penalizacionHasta && new Date(perfil.penalizacionHasta) > new Date()
  );

  // Partidos activos hoy (tiempo real)
  useEffect(() => {
    try {
      const q = query(collection(db, 'partidos'), where('activo', '==', true));
      return onSnapshot(q, snap => {
        const hoy = new Date().toDateString();
        const cnt = snap.docs.filter(d => {
          const f = d.data().fechaHora;
          return f && new Date(f).toDateString() === hoy;
        }).length;
        setPartidosHoy(cnt);
      });
    } catch { return () => {}; }
  }, []);

  // Total jugadores registrados
  useEffect(() => {
    getDocs(collection(db, 'usuarios'))
      .then(snap => setJugadores(snap.size))
      .catch(() => setJugadores(0));
  }, []);

  // Últimos 3 partidos creados
  useEffect(() => {
    try {
      const q = query(collection(db, 'partidos'), orderBy('creadoEn', 'desc'), limit(3));
      return onSnapshot(q, snap => {
        setUltimosPartidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } catch { return () => {}; }
  }, []);

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
           style={{ background: '#0c0c0c', height: '50vh', minHeight: 280 }}>
        <video autoPlay muted loop playsInline preload="auto"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.6 }}>
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, rgba(12,12,12,0.15) 0%, rgba(12,12,12,0.65) 100%)' }} />
        <div className="relative z-10 px-5 md:px-12 pt-6">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] leading-none mb-0.5">
            ¿te falta
          </p>
          <h1 className="font-black uppercase leading-none text-white"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 0.9 }}>
            UN <span style={{ color: '#0ea5e9' }}>JUGADOR</span>?
          </h1>
        </div>
        <div className="relative z-10">
          <button onClick={() => setTab?.('crear')}
            className="w-full py-4 flex items-center justify-between px-6 md:px-12 font-black text-xl uppercase transition-all active:brightness-90"
            style={{ background: '#0ea5e9', color: '#0c0c0c' }}>
            <span>+ CREAR PARTIDO</span>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── ESTADÍSTICAS EN VIVO ── */}
      <div className="px-5 md:px-12 py-8 border-b border-f-border" style={{ background: '#0e0e0e' }}>
        <p className="text-f-muted text-[11px] uppercase tracking-[0.2em] mb-4">En este momento</p>
        <p className="text-f-text leading-snug" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>
          Hoy hay{' '}
          <span className="font-black text-white" style={{ fontSize: 'clamp(2.2rem, 6vw, 3rem)', lineHeight: 1, letterSpacing: '-0.03em' }}>
            {partidosHoy ?? '—'}
          </span>{' '}
          {(partidosHoy ?? 0) === 1 ? 'partido activo' : 'partidos activos'} en Montevideo.
        </p>
        <p className="text-f-muted text-sm mt-4">
          <span className="text-f-text font-bold">{jugadores ?? '—'}</span> jugadores registrados
          <span className="mx-2 text-f-border">·</span>
          <span className="text-f-text font-bold">{CANCHAS.length}</span> canchas disponibles
        </p>
      </div>

      {/* ── ÚLTIMOS PARTIDOS ── */}
      <div className="px-5 md:px-12 border-b border-f-border pt-6 pb-1">
        <p className="text-f-muted text-[11px] font-black uppercase tracking-[0.2em] mb-4">
          Últimos partidos
        </p>
        {ultimosPartidos.length === 0 ? (
          <p className="text-f-muted text-sm pb-5">Todavía no hay partidos creados.</p>
        ) : (
          ultimosPartidos.map((p, i) => {
            const fecha   = p.fechaHora ? new Date(p.fechaHora) : null;
            const hoy     = new Date();
            const esHoy   = fecha?.toDateString() === hoy.toDateString();
            const diaLabel = !fecha ? '' : esHoy
              ? 'Hoy'
              : fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'short' });
            const hora    = fecha ? fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '';
            const faltan  = (p.cupoTotal ?? 10) - (p.jugadoresAnotados ?? 0);
            const deporte = p.deporte === 'padel' ? 'Pádel' : p.modalidad === 'F7' ? 'F7' : 'F5';

            return (
              <div key={p.id}
                className={`py-4 ${i < ultimosPartidos.length - 1 ? 'border-b border-f-border' : 'pb-5'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">
                      {p.nombreCancha || 'Sin nombre'}
                    </p>
                    <p className="text-f-muted text-xs mt-1">
                      {[p.barrio, diaLabel && `${diaLabel}${hora ? ` ${hora}hs` : ''}`, deporte]
                        .filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="text-xs font-black flex-shrink-0 pt-0.5"
                     style={{ color: faltan <= 2 ? '#f97316' : '#54b5f0' }}>
                    {faltan > 0 ? `Faltan ${faltan}` : 'Completo'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── ACCIONES RÁPIDAS ── */}
      <div className="px-4 md:px-12 py-6 flex flex-col gap-3">
        <button onClick={() => setTab?.('unirse')}
          className="w-full py-4 rounded-2xl font-black text-base uppercase flex items-center justify-between px-5 transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f2f5eb' }}>
          <span>Ver partidos disponibles</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
          </svg>
        </button>
        <button onClick={() => setTab?.('canchas')}
          className="w-full py-4 rounded-2xl font-black text-base uppercase flex items-center justify-between px-5 transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f2f5eb' }}>
          <span>Ver canchas</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
          </svg>
        </button>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-4 md:px-12 py-8 border-t border-f-border pb-28 md:pb-10">
        <p className="text-white font-black text-2xl uppercase mb-0.5">FALTA 1</p>
        <p className="text-f-muted text-sm">Fútbol · Pádel · Montevideo</p>
      </div>

    </div>
  );
}
