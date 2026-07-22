import { useState, useEffect } from 'react';
import {
  suscribirPartido,
  anotarseAPartido,
  desanotarseDePartido,
  registrarPagoJugador,
  levantarDeudaJugador,
} from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function MatchDetailScreen({ partidoId, onBack, onChat }) {
  const { user, perfil } = useAuth();
  const [partido, setPartido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState(null);

  const estaBaneado = perfil?.bloqueado
    || (perfil?.penalizacionHasta && new Date(perfil.penalizacionHasta) > new Date())
    || perfil?.deudaPendiente;

  useEffect(() => {
    if (!partidoId) return;
    const unsub = suscribirPartido(partidoId, (data) => {
      setPartido(data);
      setCargando(false);
    });
    return unsub;
  }, [partidoId]);

  if (cargando) {
    return (
      <div className="min-h-svh bg-f-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom" />
      </div>
    );
  }

  if (!partido) {
    return (
      <div className="min-h-svh bg-f-bg flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">😔</span>
        <p className="text-f-text text-xl font-black uppercase">Partido no encontrado</p>
        <button onClick={onBack} className="text-f-accent font-bold underline">Volver</button>
      </div>
    );
  }

  const jugadores = partido.jugadores || [];
  const estaAnotado = user?.uid && jugadores.includes(user.uid);
  const esOrganizador = user?.uid === partido.creadoPor;
  const anotados = partido.jugadoresAnotados ?? 0;
  const cupo = partido.cupoTotal ?? 10;
  const libres = cupo - anotados;
  const lleno = anotados >= cupo;
  const pct = Math.min(100, Math.round((anotados / cupo) * 100));
  const deporte = partido.deporte === 'padel' ? '🎾 Pádel' : '⚽ Fútbol';
  const fecha = new Date(partido.fechaHora);
  const hoy = new Date();
  const diaLabel = fecha.toDateString() === hoy.toDateString() ? 'HOY'
    : fecha.toDateString() === new Date(Date.now() + 86400000).toDateString() ? 'MAÑANA'
    : fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
  const pagos = partido.pagos || {};

  const nivelColor = {
    Principiante: '#22c55e',
    Intermedio: '#f59e0b',
    Avanzado: '#ef4444',
  }[partido.nivel] || '#54b5f0';

  const handleAnotarse = async () => {
    if (!user?.uid || accion) return;
    setAccion('anotando');
    try { await anotarseAPartido(partido.id, user.uid); }
    catch (e) { console.error(e); }
    setAccion(null);
  };

  const handleSalirse = async () => {
    if (!user?.uid || accion) return;
    setAccion('saliendo');
    try { await desanotarseDePartido(partido.id, user.uid); }
    catch (e) { console.error(e); }
    setAccion(null);
  };

  const handleTogglePago = async (jugadorUid) => {
    if (!esOrganizador) return;
    const marcado = pagos[jugadorUid]?.marcadoPorOrganizador || false;
    await registrarPagoJugador(partido.id, jugadorUid, !marcado);
  };

  const handleLevantarDeuda = async (jugadorUid) => {
    if (!esOrganizador) return;
    await levantarDeudaJugador(jugadorUid, partido.id);
  };

  const deudores = partido.deudores || [];
  const dosHorasMs = 2 * 60 * 60 * 1000;
  const pagoVencido = esOrganizador
    && !partido.pagoCanchaConfirmado
    && partido.estado !== 'cancelado'
    && new Date() > new Date(new Date(partido.fechaHora).getTime() + dosHorasMs);

  return (
    <div className="min-h-svh bg-f-bg pb-28">

      {/* Header */}
      <div className="bg-f-surface border-b border-f-border px-5 pt-10 pb-5">
        <button onClick={onBack}
          className="flex items-center gap-2 text-f-muted text-sm font-bold mb-4 active:opacity-70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Volver
        </button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{partido.deporte === 'padel' ? '🎾' : '⚽'}</span>
          <h1 className="text-white font-black text-2xl uppercase leading-tight">{partido.nombreCancha}</h1>
        </div>
        <p className="text-f-muted text-sm">📍 {partido.barrio}</p>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── Banner cancelado ── */}
        {partido.estado === 'cancelado' && (
          <div className="rounded-2xl border border-red-800 bg-red-950 px-5 py-4">
            <p className="text-red-400 font-black text-base">❌ La cancha rechazó este partido</p>
            {partido.motivoRechazo && (
              <p className="text-red-300 text-sm mt-1">Motivo: {partido.motivoRechazo}</p>
            )}
          </div>
        )}

        {/* ── Recordatorio de pago en caja (organizador, 2hs después) ── */}
        {pagoVencido && (
          <div className="rounded-2xl border border-orange-700/50 px-5 py-4"
               style={{ background: 'rgba(194,65,12,0.15)' }}>
            <p className="text-orange-400 font-black text-base uppercase">⚠️ Acordate de pagar en caja</p>
            <p className="text-orange-300/80 text-sm mt-1">
              El partido terminó hace más de 2 horas. Si todavía no pagaste la cancha, hacelo cuanto antes.
            </p>
          </div>
        )}

        {/* ── Banner deuda propia ── */}
        {perfil?.deudaPendiente && !estaAnotado && (
          <div className="rounded-2xl border border-yellow-700/50 px-5 py-4"
               style={{ background: 'rgba(113,63,18,0.2)' }}>
            <p className="text-yellow-400 font-black text-sm uppercase">⚠️ Deuda pendiente</p>
            <p className="text-yellow-300/70 text-xs mt-1">
              No podés anotarte a nuevos partidos hasta saldar tu deuda con el organizador de tu partido anterior.
            </p>
          </div>
        )}

        {/* ── Info principal ── */}
        <div className="card">
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[120px]">
                <p className="text-f-muted text-xs font-bold uppercase tracking-wide">Fecha y hora</p>
                <p className="text-white font-black text-lg">{diaLabel} · {hora}hs</p>
              </div>
              <div className="flex-1 min-w-[120px]">
                <p className="text-f-muted text-xs font-bold uppercase tracking-wide">Deporte</p>
                <p className="text-white font-black text-lg">{deporte}</p>
              </div>
              <div className="flex-1 min-w-[120px]">
                <p className="text-f-muted text-xs font-bold uppercase tracking-wide">Modalidad</p>
                <p className="text-white font-black text-lg">
                  {partido.modalidad === 'F5' ? 'Fútbol 5' : partido.modalidad === 'F7' ? 'Fútbol 7' : partido.modalidad}
                </p>
              </div>
              <div className="flex-1 min-w-[120px]">
                <p className="text-f-muted text-xs font-bold uppercase tracking-wide">Nivel</p>
                <p className="font-black text-lg" style={{ color: nivelColor }}>{partido.nivel}</p>
              </div>
              <div className="flex-1 min-w-[120px]">
                <p className="text-f-muted text-xs font-bold uppercase tracking-wide">Organizador</p>
                <p className="text-white font-black text-base">{partido.organizador}</p>
              </div>
            </div>

            {/* Barra de jugadores */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-f-muted text-xs font-bold">{anotados} / {cupo} jugadores</span>
                <span className="text-xs font-black" style={{ color: lleno ? '#ef4444' : '#54b5f0' }}>
                  {lleno ? 'LLENO' : `${libres} lugar${libres !== 1 ? 'es' : ''} libre${libres !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/8">
                <div className="h-full rounded-full transition-all"
                     style={{ width: `${pct}%`, background: lleno ? '#ef4444' : '#16a34a' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Estado del pago de cancha ── */}
        <div className={`rounded-2xl border px-5 py-4 ${partido.pagoCanchaConfirmado
          ? 'bg-green-950 border-green-800'
          : 'bg-yellow-950/50 border-yellow-900'}`}>
          <p className={`font-black text-base ${partido.pagoCanchaConfirmado ? 'text-green-300' : 'text-yellow-300'}`}>
            {partido.pagoCanchaConfirmado
              ? '✅ La cancha confirmó que recibió el pago completo'
              : '⏳ Pendiente pago en caja — el organizador paga el día del partido'}
          </p>
          {!partido.pagoCanchaConfirmado && (
            <p className="text-yellow-400/70 text-xs mt-1">
              Solo el personal de la cancha puede confirmar el pago recibido
            </p>
          )}
        </div>

        {/* ── Gastos por jugador ── */}
        <div className="card">
          <div className="p-5">
            <p className="text-f-accent text-xs font-black uppercase tracking-widest mb-1">Gastos</p>
            <h2 className="text-white font-black text-xl uppercase mb-4">Split de la cancha</h2>
            <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-f-muted text-xs font-bold">Precio total cancha</p>
                <p className="text-white font-black text-2xl">
                  ${(partido.precioTotalCancha || partido.precioPorJugador * cupo).toLocaleString('es-UY')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-f-muted text-xs font-bold">Por jugador</p>
                <p className="font-black text-2xl" style={{ color: '#54b5f0' }}>
                  ${partido.precioPorJugador?.toLocaleString('es-UY')}
                </p>
              </div>
            </div>
            <p className="text-f-muted text-xs mb-3">
              {esOrganizador
                ? 'Tocá para marcar quién te pagó. Esto es solo un registro — nunca se confirma digitalmente.'
                : 'El pago es en efectivo al organizador antes del partido.'}
            </p>

            {/* Lista de jugadores con estado de pago */}
            <div className="space-y-2">
              {jugadores.length === 0 ? (
                <p className="text-f-muted text-sm text-center py-4">Sin jugadores anotados aún</p>
              ) : jugadores.map((uid_j, idx) => {
                const pagado = pagos[uid_j]?.marcadoPorOrganizador || false;
                const esYo = uid_j === user?.uid;
                const tieneDeuda = deudores.includes(uid_j);
                return (
                  <div key={uid_j}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                    style={{
                      borderColor: tieneDeuda ? 'rgba(234,179,8,0.25)' : 'rgba(255,255,255,0.06)',
                      background: tieneDeuda ? 'rgba(113,63,18,0.1)' : 'rgba(255,255,255,0.02)',
                    }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                           style={{ background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(84,181,240,0.3)' }}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">
                          Jugador {idx + 1}{esYo ? ' (vos)' : ''}
                        </p>
                        {tieneDeuda
                          ? <p className="text-yellow-400 text-xs font-bold">⚠️ Deuda pendiente</p>
                          : <p className="text-f-muted text-xs">⚠️ Pago no verificado</p>
                        }
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {esOrganizador ? (
                        <button
                          onClick={() => handleTogglePago(uid_j)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all active:scale-95 ${
                            pagado
                              ? 'bg-green-950 border-green-800 text-green-300'
                              : 'border-f-border text-f-muted'
                          }`}>
                          {pagado ? 'Marcado ✓' : 'Marcar pago'}
                        </button>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black border ${
                          pagado
                            ? 'bg-green-950 border-green-800 text-green-300'
                            : 'border-f-border text-f-muted'
                        }`}>
                          {pagado ? 'Marcado ✓' : 'Pendiente'}
                        </span>
                      )}
                      {esOrganizador && tieneDeuda && (
                        <button
                          onClick={() => handleLevantarDeuda(uid_j)}
                          className="px-3 py-1 rounded-lg text-xs font-black border transition-all active:scale-95"
                          style={{ borderColor: 'rgba(74,222,128,0.3)', color: '#4ade80', background: 'rgba(22,163,74,0.1)' }}>
                          Confirmó pago ✓
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 bg-f-card border border-f-border rounded-xl px-4 py-3">
              <p className="text-f-muted text-xs leading-relaxed">
                ⚠️ Los pagos marcados son solo registro del organizador. La única confirmación real es cuando la cancha toca "Pago recibido en caja".
              </p>
            </div>
          </div>
        </div>

        {/* ── Botones de acción ── */}
        <div className="flex gap-3">
          {estaAnotado && (
            <button onClick={onChat}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-sm uppercase transition-all active:scale-95 border border-f-accent text-f-accent">
              💬 Chat del partido
            </button>
          )}

          {estaAnotado ? (
            <button onClick={handleSalirse} disabled={!!accion}
              className="flex-1 py-3.5 rounded-xl font-black text-sm uppercase transition-all active:scale-95 disabled:opacity-50 border border-red-700 text-red-400">
              {accion === 'saliendo' ? '...' : 'Salirme del partido'}
            </button>
          ) : (
            <button onClick={handleAnotarse}
              disabled={lleno || estaBaneado || !!accion}
              className="flex-1 py-3.5 rounded-xl font-black text-base uppercase transition-all active:scale-95 disabled:opacity-50"
              style={lleno || estaBaneado
                ? { background: 'rgba(255,255,255,0.06)', color: '#5a5a5a', cursor: 'not-allowed' }
                : { background: '#0ea5e9', color: '#fff', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}>
              {accion === 'anotando' ? '...' : lleno ? 'LLENO' : perfil?.deudaPendiente ? 'DEUDA PENDIENTE' : estaBaneado ? 'SUSPENDIDO' : '¡ME ANOTO!'}
            </button>
          )}
        </div>

        {/* ── Recordatorio de reglas ── */}
        <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
          <p className="text-f-muted text-xs leading-relaxed">
            📋 Podés salirte sin penalización si avisás con más de 3 horas de anticipación. Si avisás con menos tiempo o no aparecés, puede afectar tu reputación.
          </p>
        </div>
      </div>
    </div>
  );
}
