import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfil, suscribirMisPartidos } from '../firebase/firestore';

const POSICIONES = ['Arquero', 'Defensa', 'Mediocampista', 'Delantero', 'Por definir'];
const NIVELES_PADEL = ['Principiante', 'Intermedio', 'Avanzado'];

const INSIGNIAS_INFO = {
  'capitan_frecuente':  { icon: '🏆', label: 'Capitán frecuente',   desc: 'Organizaste 5 o más partidos' },
  'sin_cancelaciones':  { icon: '✅', label: 'Sin cancelaciones',    desc: 'Nunca cancelaste con menos de 3 horas' },
  'respuesta_rapida':   { icon: '⚡', label: 'Respuesta rápida',     desc: 'Siempre respondés rápido' },
  'buen_companero':     { icon: '🤝', label: 'Buen compañero',       desc: 'Valorado por otros jugadores' },
  'padelero_top':       { icon: '🎾', label: 'Padelero top',         desc: 'Jugaste 10 o más partidas de pádel' },
};

// Niveles de carrera estilo Appito — adaptados al Uruguay
const NIVELES_CARRERA = [
  { min: 0,  max: 5,  titulo: 'Peladero',        color: '#cd7f32', tier: 'bronce' },
  { min: 6,  max: 15, titulo: 'Rey de la Pelada', color: '#c0c0c0', tier: 'plata' },
  { min: 16, max: 30, titulo: 'Promesa',          color: '#ffd700', tier: 'oro' },
  { min: 31, max: 50, titulo: 'Profesional',      color: '#ffd700', tier: 'oro' },
  { min: 51, max: 80, titulo: 'Crack',            color: '#54b5f0', tier: 'platino' },
  { min: 81, max: 120,titulo: 'Ídolo',            color: '#54b5f0', tier: 'platino' },
  { min: 121,max: 999,titulo: 'LEYENDA',          color: '#54b5f0', tier: 'platino' },
];

function getNivelCarrera(partidosJugados) {
  return NIVELES_CARRERA.find(n => partidosJugados >= n.min && partidosJugados <= n.max)
    || NIVELES_CARRERA[0];
}

function getOverall(reputacion, partidosJugados, noShows) {
  const base = Math.round((reputacion / 5) * 60);
  const exp = Math.min(30, Math.round(partidosJugados * 0.6));
  const penalty = Math.min(15, noShows * 5);
  return Math.max(40, Math.min(99, base + exp - penalty));
}

const HISTORIAL_DEMO = [
  { cancha: 'Boston River F5', fecha: '10 jul', deporte: 'futbol', resultado: 'Asistió ✅' },
  { cancha: 'Pádel Pocitos',   fecha: '7 jul',  deporte: 'padel',  resultado: 'Asistió ✅' },
  { cancha: 'Aerosur F5',      fecha: '3 jul',  deporte: 'futbol', resultado: 'Asistió ✅' },
  { cancha: 'Pádel Carrasco',  fecha: '28 jun', deporte: 'padel',  resultado: 'Asistió ✅' },
  { cancha: '2 Cabezas F5',    fecha: '24 jun', deporte: 'futbol', resultado: 'Asistió ✅' },
];

// Demo — "Sebas V." con 27 partidos jugados, 5 estrellas, 0 no-shows, todas las insignias
const PERFIL_DEMO = {
  nombre: 'Sebas V.', posicion: 'Mediocampista', ciudad: 'Montevideo',
  partidosJugados: 27, reputacion: 5, noShows: 0,
  insignias: ['capitan_frecuente', 'sin_cancelaciones', 'respuesta_rapida', 'buen_companero', 'padelero_top'],
  penalizacionHasta: null, bloqueado: false, advertencia: false,
};

export default function PerfilScreen({ setTab }) {
  const { user, perfil, logout, refrescarPerfil } = useAuth();
  const [editando, setEditando] = useState(false);
  const [posicion, setPosicion] = useState(perfil?.posicion || 'Por definir');
  const [guardando, setGuardando] = useState(false);
  const [misPartidos, setMisPartidos] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = suscribirMisPartidos(user.uid, setMisPartidos);
    return () => unsub();
  }, [user]);

  const p = perfil || PERFIL_DEMO;
  const nivel = getNivelCarrera(p.partidosJugados);
  const overall = getOverall(p.reputacion, p.partidosJugados, p.noShows);
  const hoy = new Date();
  const penalizado = p.penalizacionHasta && new Date(p.penalizacionHasta) > hoy;
  const diasPenalizacion = penalizado
    ? Math.ceil((new Date(p.penalizacionHasta) - hoy) / 86400000) : 0;

  const handleGuardar = async () => {
    if (!user) return;
    setGuardando(true);
    await actualizarPerfil(user.uid, { posicion });
    await refrescarPerfil();
    setGuardando(false);
    setEditando(false);
  };


  return (
    <div className="min-h-svh bg-f-bg pb-28">

      {/* Header mínimo */}
      <div className="px-5 pt-10 pb-4">
        <h1 className="text-f-text font-black text-2xl uppercase tracking-tight">Mi perfil</h1>
      </div>

      <div className="px-4 md:px-12 space-y-4">

        {/* ── TARJETA FIFA ─────────────────────────────────────── */}
        <div className={`player-card ${nivel.tier}`}>
          {/* Overall + tier */}
          <div className="flex items-start justify-between mb-5">
            <div className="text-left">
              <p className="text-6xl font-black leading-none" style={{ color: nivel.color }}>{overall}</p>
              <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: nivel.color }}>Overall</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase"
                   style={{ background: `${nivel.color}20`, color: nivel.color, border: `1px solid ${nivel.color}40` }}>
                ★ {nivel.titulo}
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center text-4xl font-black"
                   style={{ borderColor: nivel.color, background: '#0c0c0c' }}>
                {user?.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-f-text">{(user?.displayName || 'J')[0].toUpperCase()}</span>
                }
              </div>
              {!p.bloqueado && !penalizado && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-f-bg"
                     style={{ background: nivel.color }} />
              )}
            </div>
          </div>

          {/* Nombre y posición */}
          <p className="text-f-text text-xl font-black uppercase leading-tight">
            {user?.displayName || p.nombre}
          </p>

          {editando ? (
            <select value={posicion} onChange={e => setPosicion(e.target.value)}
              className="mt-2 bg-f-bg border border-f-border rounded-lg px-3 py-1.5 text-f-text text-sm outline-none mx-auto block">
              <optgroup label="Fútbol">
                {POSICIONES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </optgroup>
              <optgroup label="Pádel">
                {NIVELES_PADEL.map(n => <option key={`padel-${n}`} value={`Pádel ${n}`}>Pádel {n}</option>)}
              </optgroup>
            </select>
          ) : (
            <p className="text-f-muted text-sm mt-1">{p.posicion} · {p.ciudad}</p>
          )}

          {/* Botón editar */}
          <div className="mt-5 flex gap-2">
            {editando ? (
              <>
                <button onClick={handleGuardar} disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl font-black text-sm uppercase text-f-bg disabled:opacity-50"
                  style={{ background: nivel.color }}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => setEditando(false)}
                  className="px-4 py-2.5 rounded-xl border border-f-border text-f-muted font-bold text-sm">
                  Cancelar
                </button>
              </>
            ) : (
              <button onClick={() => setEditando(true)}
                className="w-full py-2.5 rounded-xl border font-bold text-sm uppercase transition-colors"
                style={{ borderColor: `${nivel.color}40`, color: nivel.color }}>
                ✏️ Editar posición / nivel
              </button>
            )}
          </div>
        </div>

        {/* ── ALERTA PENALIZACIÓN ──────────────────────────────── */}
        {p.bloqueado && (
          <div className="bg-red-950/60 border border-red-800/50 rounded-2xl p-4">
            <p className="text-red-400 font-black text-base uppercase">🔴 Cuenta bloqueada</p>
            <p className="text-red-300/80 text-sm mt-1">Cuenta suspendida por incumplimiento reiterado. Contactá al soporte.</p>
          </div>
        )}
        {penalizado && !p.bloqueado && (
          <div className="bg-orange-950/50 border border-orange-800/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-orange-400 font-black text-base uppercase">⏸️ Suspensión activa</p>
              <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {diasPenalizacion} día{diasPenalizacion !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-orange-300/80 text-sm">No podés anotarte a partidos hasta que venza la suspensión.</p>
          </div>
        )}
        {p.advertencia && !p.bloqueado && !penalizado && (
          <div className="bg-yellow-950/50 border border-yellow-800/50 rounded-2xl p-4">
            <p className="text-yellow-400 font-black text-sm uppercase">⚠️ Primera advertencia</p>
            <p className="text-yellow-300/70 text-xs mt-1">Una falta más y serás suspendido por 1 mes.</p>
          </div>
        )}

        {/* ── MIS PARTIDOS ─────────────────────────────────────── */}
        {misPartidos.length > 0 && (
          <div className="card p-5">
            <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Mis partidos</p>
            <div className="space-y-2">
              {misPartidos.slice(0, 5).map(p => {
                const fecha = new Date(p.fechaHora);
                const deporte = p.deporte === 'padel' ? '🎾' : '⚽';
                const estadoConfig = {
                  pendiente:  { label: '⏳ Pendiente',  bg: 'bg-yellow-950', border: 'border-yellow-800', text: 'text-yellow-300' },
                  confirmado: { label: '✅ Confirmado', bg: 'bg-green-950',  border: 'border-green-800',  text: 'text-green-300' },
                  cancelado:  { label: '❌ Cancelado',  bg: 'bg-red-950',    border: 'border-red-800',    text: 'text-red-400' },
                  finalizado: { label: '🏁 Finalizado', bg: 'bg-f-surface',  border: 'border-f-border',   text: 'text-f-muted' },
                }[p.estado] || { label: p.estado, bg: 'bg-f-surface', border: 'border-f-border', text: 'text-f-muted' };
                return (
                  <div key={p.id} className="py-2.5 border-b last:border-b-0"
                       style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg flex-shrink-0">{deporte}</span>
                        <div className="min-w-0">
                          <p className="text-f-text text-sm font-bold leading-tight truncate">{p.nombreCancha}</p>
                          <p className="text-f-muted text-xs">
                            {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })} · {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-black px-2 py-1 rounded-lg border flex-shrink-0 ml-2 ${estadoConfig.bg} ${estadoConfig.border} ${estadoConfig.text}`}>
                        {estadoConfig.label}
                      </span>
                    </div>
                    {p.estado === 'cancelado' && p.motivoRechazo && (
                      <p className="text-red-400 text-xs mt-1.5 ml-7 leading-snug">
                        Motivo: {p.motivoRechazo}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ESTADÍSTICAS ─────────────────────────────────────── */}
        <div className="card p-5">
          <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Estadísticas</p>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <StatBox valor={p.partidosJugados} label="Partidos" color="#54b5f0" />
            <StatBox valor={`${p.reputacion}/5`} label="Reputación" color="#fbbf24" />
            <StatBox valor={p.noShows || 0} label="No-shows" color={p.noShows > 0 ? '#f87171' : '#54b5f0'} />
          </div>
          {/* Barra progreso hacia siguiente nivel */}
          <div>
            <div className="flex justify-between text-xs text-f-muted mb-2">
              <span className="font-bold" style={{ color: nivel.color }}>{nivel.titulo}</span>
              <span>{p.partidosJugados} partidos</span>
            </div>
            <div className="w-full h-2 bg-f-surface rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                   style={{
                     width: `${Math.min(100, ((p.partidosJugados - nivel.min) / (nivel.max - nivel.min + 1)) * 100)}%`,
                     background: nivel.color,
                   }} />
            </div>
            {nivel.max < 999 && (
              <p className="text-f-muted text-xs mt-1 text-right">
                {Math.max(0, nivel.max - p.partidosJugados + 1)} para el próximo nivel
              </p>
            )}
          </div>
        </div>

        {/* ── NIVELES DE CARRERA ───────────────────────────────── */}
        <div className="card p-5">
          <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Carrera</p>
          <div className="space-y-2">
            {NIVELES_CARRERA.map((n, i) => {
              const activo = n.titulo === nivel.titulo;
              const alcanzado = p.partidosJugados >= n.min;
              return (
                <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all
                  ${activo ? 'border' : 'border border-transparent'}`}
                  style={activo ? { borderColor: `${n.color}40`, background: `${n.color}08` } : {}}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                         style={{ background: alcanzado ? `${n.color}20` : 'rgba(255,255,255,0.04)',
                                  color: alcanzado ? n.color : '#3a3a3a' }}>
                      {alcanzado ? '★' : `${i + 1}`}
                    </div>
                    <div>
                      <p className={`text-sm font-black uppercase ${activo ? '' : alcanzado ? 'text-f-text' : 'text-f-muted'}`}
                         style={activo ? { color: n.color } : {}}>
                        {n.titulo}
                      </p>
                      <p className="text-f-muted text-xs">{n.min}–{n.max < 999 ? n.max : '∞'} partidos</p>
                    </div>
                  </div>
                  {activo && (
                    <span className="text-xs font-black uppercase px-2 py-1 rounded-lg"
                          style={{ background: `${n.color}20`, color: n.color }}>
                      Actual
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── HISTORIAL ────────────────────────────────────────── */}
        <div className="card p-5">
          <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Últimos partidos</p>
          <div className="space-y-0">
            {HISTORIAL_DEMO.map((h, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0"
                   style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-f-text text-sm font-semibold">{h.cancha}</p>
                  <p className="text-f-muted text-xs">{h.fecha}</p>
                </div>
                <span className="text-f-accent text-sm font-bold">{h.resultado}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── INSIGNIAS ────────────────────────────────────────── */}
        <div className="card p-5">
          <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Insignias</p>
          {p.insignias && p.insignias.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {p.insignias.map(key => {
                const info = INSIGNIAS_INFO[key];
                if (!info) return null;
                return (
                  <div key={key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-f-border bg-f-surface">
                    <span className="text-2xl flex-shrink-0">{info.icon}</span>
                    <div className="min-w-0">
                      <p className="text-f-text text-xs font-black leading-tight">{info.label}</p>
                      <p className="text-f-muted text-xs leading-tight mt-0.5">{info.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-f-muted text-sm">Todavía no tenés insignias</p>
              <p className="text-f-muted text-xs mt-1">Jugá más partidos para ganarlas</p>
            </div>
          )}
        </div>

        {/* ── REGLAS DE PENALIZACIÓN ──────────────────────────── */}
        <div className="card p-5">
          <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Sistema de penalizaciones</p>
          <div className="space-y-3">
            {[
              { icon: '✅', texto: 'Cancelás con +3 horas de anticipación → sin penalización' },
              { icon: '⚠️', texto: 'Cancelás con −3 horas → depósito pendiente a criterio del organizador' },
              { icon: '📉', texto: 'No aparecés sin avisar (no-show) → reputación baja 0.5 puntos' },
              { icon: '🔴', texto: '2 no-shows → suspensión de 7 días' },
              { icon: '⛔', texto: '3 no-shows → cuenta bloqueada permanentemente' },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg w-7 text-center flex-shrink-0 mt-0.5">{r.icon}</span>
                <p className="text-f-text text-sm">{r.texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ADMIN ────────────────────────────────────────────── */}
        {perfil?.admin && (
          <button onClick={() => setTab('admin')}
            className="w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-colors
                       flex items-center justify-center gap-2"
            style={{ border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
            🛡️ Panel de Administración
          </button>
        )}

        {/* ── CERRAR SESIÓN ─────────────────────────────────────── */}
        <button onClick={logout}
          className="w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-colors"
          style={{ border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
          Cerrar sesión
        </button>

        <p className="text-center text-f-muted text-xs pb-4">
          Falta 1 — ⚽ Fútbol · 🎾 Pádel · Montevideo 🇺🇾
        </p>
      </div>
    </div>
  );
}

function StatBox({ valor, label, color }) {
  return (
    <div className="text-center p-3 rounded-xl" style={{ background: `${color}08` }}>
      <p className="text-3xl font-black" style={{ color }}>{valor}</p>
      <p className="text-f-muted text-xs font-bold uppercase mt-0.5">{label}</p>
    </div>
  );
}
