import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  suscribirPartidosPendientesCancha,
  suscribirPartidosCancha,
  confirmarReserva,
  rechazarReserva,
  confirmarPagoCancha,
} from '../firebase/firestore';

// Panel exclusivo para usuarios con rol "cancha"
export default function CanchaPanel() {
  const { perfil, logout } = useAuth();
  const [seccion, setSeccion] = useState('solicitudes');
  const [pendientes, setPendientes] = useState([]);
  const [todosPartidos, setTodosPartidos] = useState([]);
  const [motivoRechazo, setMotivoRechazo] = useState({});
  const [procesando, setProcesando] = useState({});
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // canchaId viene del perfil del usuario de la cancha
  const canchaId = perfil?.canchaId || '';
  const nombreCancha = perfil?.nombre || 'Cancha';

  useEffect(() => {
    if (!canchaId) return;
    const unsub1 = suscribirPartidosPendientesCancha(canchaId, setPendientes);
    const unsub2 = suscribirPartidosCancha(canchaId, setTodosPartidos);
    return () => { unsub1(); unsub2(); };
  }, [canchaId]);

  const hoy = new Date();
  const partidos_hoy = todosPartidos.filter(p => {
    const f = new Date(p.fechaHora);
    return f.toDateString() === hoy.toDateString() && p.estado === 'confirmado';
  });

  const handleConfirmar = async (partidoId) => {
    setProcesando(prev => ({ ...prev, [partidoId]: 'confirmando' }));
    try {
      await confirmarReserva(partidoId);
      mostrarToast('✅ Reserva confirmada — el partido ya está publicado', 'ok');
    } catch (e) {
      console.error(e);
      mostrarToast('❌ Error al confirmar. Intentá de nuevo.', 'error');
    }
    setProcesando(prev => ({ ...prev, [partidoId]: null }));
  };

  const handleRechazar = async (partidoId) => {
    const motivo = motivoRechazo[partidoId] || '';
    setProcesando(prev => ({ ...prev, [partidoId]: 'rechazando' }));
    try {
      await rechazarReserva(partidoId, motivo);
      setMotivoRechazo(prev => { const n = {...prev}; delete n[partidoId]; return n; });
      mostrarToast('Solicitud rechazada', 'error');
    } catch (e) {
      console.error(e);
      mostrarToast('❌ Error al rechazar. Intentá de nuevo.', 'error');
    }
    setProcesando(prev => ({ ...prev, [partidoId]: null }));
  };

  const handlePagoRecibido = async (partidoId) => {
    setProcesando(prev => ({ ...prev, [partidoId]: 'pago' }));
    try {
      await confirmarPagoCancha(partidoId);
      mostrarToast('💰 Pago registrado correctamente', 'ok');
    } catch (e) {
      console.error(e);
      mostrarToast('❌ Error al registrar pago.', 'error');
    }
    setProcesando(prev => ({ ...prev, [partidoId]: null }));
  };

  return (
    <div className="min-h-svh bg-f-bg font-barlow">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-black text-sm text-white shadow-xl transition-all animate-fade-in
          ${toast.tipo === 'ok' ? 'bg-green-700' : 'bg-red-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-f-surface border-b border-f-border px-6 pt-10 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-f-accent text-xs font-black uppercase tracking-widest mb-1">Panel de Cancha</p>
            <h1 className="text-white font-black text-3xl uppercase leading-tight">{nombreCancha}</h1>
          </div>
          <button onClick={logout}
            className="text-f-muted text-sm border border-f-border px-3 py-1.5 rounded-lg hover:border-red-700 hover:text-red-400 transition-colors">
            Salir
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5">
          {[
            { id: 'solicitudes', label: 'Solicitudes', badge: pendientes.length },
            { id: 'hoy', label: 'Hoy', badge: partidos_hoy.length },
            { id: 'todos', label: 'Todos los partidos', badge: null },
          ].map(t => (
            <button key={t.id} onClick={() => setSeccion(t.id)}
              className={`relative px-4 py-2 rounded-xl font-bold text-sm uppercase border transition-all
                          ${seccion === t.id ? 'bg-f-accent border-f-accent text-f-bg' : 'border-f-border text-f-muted'}`}>
              {t.label}
              {t.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 pb-20">

        {/* ─── SOLICITUDES PENDIENTES ─── */}
        {seccion === 'solicitudes' && (
          <div className="space-y-4">
            <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-4">
              {pendientes.length === 0 ? 'Sin solicitudes pendientes' : `${pendientes.length} solicitud${pendientes.length !== 1 ? 'es' : ''} pendiente${pendientes.length !== 1 ? 's' : ''}`}
            </p>

            {pendientes.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <span className="text-6xl mb-4">✅</span>
                <p className="text-f-text text-xl font-black uppercase">Todo al día</p>
                <p className="text-f-muted text-sm mt-1">No hay solicitudes de reserva pendientes</p>
              </div>
            ) : pendientes.map(p => {
              const fecha = new Date(p.fechaHora);
              const estado = procesando[p.id];
              const deporte = p.deporte === 'padel' ? '🎾' : '⚽';
              return (
                <div key={p.id} className="card animate-fade-in">
                  <div className="h-1 w-full bg-yellow-500 rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-black text-lg">
                          {deporte} {p.modalidad === 'F5' ? 'Fútbol 5' : p.modalidad === 'F7' ? 'Fútbol 7' : 'Pádel'}
                        </p>
                        <p className="text-f-muted text-sm">
                          {fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })} · {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
                        </p>
                        <p className="text-f-muted text-xs mt-0.5">Organizador: {p.organizador}</p>
                        <p className="text-f-muted text-xs">Nivel: {p.nivel} · {p.cupoTotal} jugadores</p>
                      </div>
                      <span className="bg-yellow-950 border border-yellow-800 text-yellow-300 text-xs font-black px-2.5 py-1 rounded-lg">
                        ⏳ Pendiente
                      </span>
                    </div>

                    {/* Campo de motivo de rechazo */}
                    <input
                      type="text"
                      placeholder="Motivo del rechazo (opcional)"
                      value={motivoRechazo[p.id] || ''}
                      onChange={e => setMotivoRechazo(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full bg-f-bg border border-f-border rounded-xl px-3 py-2 text-f-text text-sm
                                 placeholder:text-f-muted outline-none focus:border-f-accent mb-3 transition-colors"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmar(p.id)}
                        disabled={!!estado}
                        className="flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: '#16a34a', color: '#fff' }}>
                        {estado === 'confirmando' ? '...' : '✅ Confirmar'}
                      </button>
                      <button
                        onClick={() => handleRechazar(p.id)}
                        disabled={!!estado}
                        className="flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all active:scale-95 disabled:opacity-50 border border-red-700 text-red-400">
                        {estado === 'rechazando' ? '...' : '❌ Rechazar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── PARTIDOS DE HOY ─── */}
        {seccion === 'hoy' && (
          <div className="space-y-4">
            <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-4">
              {partidos_hoy.length === 0 ? 'No hay partidos hoy' : `${partidos_hoy.length} partido${partidos_hoy.length !== 1 ? 's' : ''} hoy`}
            </p>

            {partidos_hoy.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <span className="text-6xl mb-4">📅</span>
                <p className="text-f-text text-xl font-black uppercase">Sin partidos hoy</p>
              </div>
            ) : partidos_hoy.map(p => {
              const fecha = new Date(p.fechaHora);
              const ahora = new Date();
              const yaTermino = ahora > new Date(fecha.getTime() + 90 * 60 * 1000); // partido + 1.5hs
              const estado = procesando[p.id];
              const deporte = p.deporte === 'padel' ? '🎾' : '⚽';
              return (
                <div key={p.id} className="card animate-fade-in">
                  <div className="h-1 w-full bg-f-green rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-white font-black text-lg">
                          {deporte} {p.modalidad === 'F5' ? 'Fútbol 5' : p.modalidad === 'F7' ? 'Fútbol 7' : 'Pádel'} · {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
                        </p>
                        <p className="text-f-muted text-sm">Organizador: {p.organizador}</p>
                        <p className="text-f-muted text-xs">{p.jugadoresAnotados}/{p.cupoTotal} jugadores</p>
                      </div>
                      {p.pagoCanchaConfirmado ? (
                        <span className="bg-green-950 border border-green-800 text-green-300 text-xs font-black px-2.5 py-1 rounded-lg">
                          ✅ Pago confirmado
                        </span>
                      ) : (
                        <span className="bg-yellow-950 border border-yellow-800 text-yellow-300 text-xs font-black px-2.5 py-1 rounded-lg">
                          ⏳ Pago pendiente
                        </span>
                      )}
                    </div>

                    {/* Botón de pago — solo aparece después del partido */}
                    {!p.pagoCanchaConfirmado && yaTermino && (
                      <button
                        onClick={() => handlePagoRecibido(p.id)}
                        disabled={!!estado}
                        className="w-full py-3.5 rounded-xl font-black text-base uppercase transition-all active:scale-95 disabled:opacity-50"
                        style={{ background: '#16a34a', color: '#fff', boxShadow: '0 4px 16px rgba(22,163,74,0.4)' }}>
                        {estado === 'pago' ? '...' : '✅ PAGO RECIBIDO EN CAJA'}
                      </button>
                    )}

                    {!p.pagoCanchaConfirmado && !yaTermino && (
                      <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
                        <p className="text-f-muted text-sm text-center">
                          El botón "Pago recibido" aparece cuando termine el partido
                        </p>
                      </div>
                    )}

                    {p.pagoCanchaConfirmado && (
                      <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-3">
                        <p className="text-green-300 text-sm font-bold text-center">
                          ✅ Confirmaste que recibiste el pago completo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── TODOS LOS PARTIDOS ─── */}
        {seccion === 'todos' && (
          <div className="space-y-3">
            <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-4">
              {todosPartidos.length} partido{todosPartidos.length !== 1 ? 's' : ''} en total
            </p>
            {todosPartidos.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <span className="text-6xl mb-4">🏟️</span>
                <p className="text-f-text text-xl font-black uppercase">Sin partidos</p>
              </div>
            ) : todosPartidos.map(p => {
              const fecha = new Date(p.fechaHora);
              const deporte = p.deporte === 'padel' ? '🎾' : '⚽';
              const estadoColor = {
                pendiente: '#f59e0b',
                confirmado: '#16a34a',
                cancelado: '#ef4444',
                finalizado: '#5a5a5a',
              }[p.estado] || '#5a5a5a';

              return (
                <div key={p.id} className="card">
                  <div className="p-4 flex items-center gap-4">
                    <div className="text-2xl flex-shrink-0">{deporte}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm leading-tight">
                        {p.modalidad} · {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })} {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
                      </p>
                      <p className="text-f-muted text-xs">{p.organizador} · {p.jugadoresAnotados}/{p.cupoTotal} jug.</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg border"
                            style={{ color: estadoColor, borderColor: estadoColor + '40', background: estadoColor + '15' }}>
                        {p.estado}
                      </span>
                      {p.pagoCanchaConfirmado && (
                        <span className="text-xs text-green-400">💰 pagado</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
