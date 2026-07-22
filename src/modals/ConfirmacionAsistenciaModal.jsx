import { useState, useEffect } from 'react';
import { obtenerUsuario, confirmarAsistenciaPartido } from '../firebase/firestore';

export default function ConfirmacionAsistenciaModal({ partido, onDone }) {
  const [perfiles, setPerfiles] = useState({});
  const [asistentes, setAsistentes] = useState({});
  const [pagadores, setPagadores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const jugadores = partido.jugadores || [];
  const fecha = new Date(partido.fechaHora);
  const deporte = partido.deporte === 'padel' ? '🎾' : '⚽';

  useEffect(() => {
    const fetchPerfiles = async () => {
      const results = {};
      const asistObj = {};
      const pagObj = {};
      for (const uid of jugadores) {
        try {
          const p = await obtenerUsuario(uid);
          if (p) results[uid] = p;
        } catch {}
        asistObj[uid] = true;
        pagObj[uid] = true;
      }
      setPerfiles(results);
      setAsistentes(asistObj);
      setPagadores(pagObj);
      setCargando(false);
    };
    fetchPerfiles();
  }, [partido.id]);

  const toggleAsistencia = (uid) => {
    setAsistentes(prev => {
      const nuevo = { ...prev, [uid]: !prev[uid] };
      // Si no asistió, tampoco pagó
      if (!nuevo[uid]) {
        setPagadores(p => ({ ...p, [uid]: false }));
      }
      return nuevo;
    });
  };

  const togglePago = (uid) => {
    if (!asistentes[uid]) return; // no puede marcar pago si no asistió
    setPagadores(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleConfirmar = async () => {
    setEnviando(true);
    try {
      const noAsistentes = jugadores.filter(uid => !asistentes[uid]);
      const noPagadores = jugadores.filter(uid => asistentes[uid] && !pagadores[uid]);
      await confirmarAsistenciaPartido(partido.id, noAsistentes, noPagadores);
      onDone();
    } catch (e) {
      console.error(e);
      setEnviando(false);
    }
  };

  const nombreJugador = (uid, idx) => {
    const p = perfiles[uid];
    if (p?.nombre) return p.nombre;
    return `Jugador ${idx + 1}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="w-full md:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl md:rounded-3xl"
           style={{ background: '#111', border: '1px solid #222' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-f-border sticky top-0 z-10"
             style={{ background: '#111' }}>
          <div className="w-10 h-1 bg-f-border rounded-full mx-auto mb-4 md:hidden" />
          <p className="text-f-accent text-xs font-black uppercase tracking-widest mb-1">
            Confirmación post-partido
          </p>
          <h2 className="text-white font-black text-xl uppercase leading-tight">
            {deporte} {partido.nombreCancha}
          </h2>
          <p className="text-f-muted text-sm mt-0.5">
            {fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })} · {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Instrucción */}
          <div className="rounded-2xl px-4 py-3"
               style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(84,181,240,0.2)' }}>
            <p className="text-f-accent text-sm font-bold">
              Marcá quiénes asistieron y quiénes pagaron su parte.
            </p>
            <p className="text-f-muted text-xs mt-1">
              Los que no aparecieron reciben suspensión automática. Los que no pagaron quedan con deuda y no pueden anotarse a nuevos partidos.
            </p>
          </div>

          {/* Lista de jugadores */}
          {cargando ? (
            <div className="space-y-2">
              {jugadores.map(uid => (
                <div key={uid} className="h-16 rounded-2xl animate-pulse"
                     style={{ background: '#1a1a1a' }} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {jugadores.map((uid, idx) => {
                const asistio = asistentes[uid] ?? true;
                const pago = asistio && (pagadores[uid] ?? true);

                return (
                  <div key={uid}
                       className="rounded-2xl px-4 py-3 transition-all"
                       style={{
                         background: asistio ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.05)',
                         border: asistio ? '1px solid #222' : '1px solid rgba(239,68,68,0.2)',
                       }}>

                    {/* Nombre + toggle asistencia */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                             style={{
                               background: asistio ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)',
                               color: asistio ? '#4ade80' : '#f87171',
                             }}>
                          {asistio ? '✓' : '✗'}
                        </div>
                        <p className="text-white text-sm font-bold">{nombreJugador(uid, idx)}</p>
                      </div>

                      <button
                        onClick={() => toggleAsistencia(uid)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95"
                        style={asistio
                          ? { background: 'rgba(22,163,74,0.15)', borderColor: 'rgba(74,222,128,0.3)', color: '#4ade80' }
                          : { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(248,113,113,0.3)', color: '#f87171' }}>
                        {asistio ? 'Asistió' : 'No apareció'}
                      </button>
                    </div>

                    {/* Toggle pago — solo si asistió */}
                    {asistio && (
                      <div className="flex items-center justify-between ml-10">
                        <p className="text-f-muted text-xs">¿Pagó su parte?</p>
                        <button
                          onClick={() => togglePago(uid)}
                          className="px-3 py-1 rounded-lg text-xs font-black border transition-all active:scale-95"
                          style={pago
                            ? { background: 'rgba(14,165,233,0.1)', borderColor: 'rgba(84,181,240,0.25)', color: '#54b5f0' }
                            : { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                          {pago ? '💰 Pagó' : '⚠️ No pagó'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Resumen */}
          {!cargando && (() => {
            const noAsistentes = jugadores.filter(uid => !asistentes[uid]);
            const noPagadores = jugadores.filter(uid => asistentes[uid] && !pagadores[uid]);
            if (noAsistentes.length === 0 && noPagadores.length === 0) return null;
            return (
              <div className="rounded-2xl px-4 py-3 space-y-1"
                   style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                {noAsistentes.length > 0 && (
                  <p className="text-red-400 text-xs font-bold">
                    🔴 {noAsistentes.length} jugador{noAsistentes.length !== 1 ? 'es' : ''} recibirán suspensión por no-show
                  </p>
                )}
                {noPagadores.length > 0 && (
                  <p className="text-yellow-400 text-xs font-bold">
                    ⚠️ {noPagadores.length} jugador{noPagadores.length !== 1 ? 'es' : ''} quedarán con deuda pendiente
                  </p>
                )}
              </div>
            );
          })()}

          {/* Botón confirmar */}
          <button
            onClick={handleConfirmar}
            disabled={enviando || cargando}
            className="w-full py-4 rounded-2xl font-black text-base uppercase transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#0ea5e9', color: '#fff', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
            {enviando ? 'Confirmando...' : 'Confirmar asistencia'}
          </button>

          <p className="text-f-muted text-xs text-center pb-2">
            Esta acción no se puede deshacer. Las penalizaciones se aplican automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
