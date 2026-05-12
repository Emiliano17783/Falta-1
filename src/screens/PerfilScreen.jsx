import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfil } from '../firebase/firestore';

const POSICIONES = ['Arquero', 'Defensa', 'Mediocampista', 'Delantero', 'Por definir'];

// Niveles de carrera estilo Appito — adaptados al Uruguay
const NIVELES_CARRERA = [
  { min: 0,  max: 5,  titulo: 'Peladero',        color: '#cd7f32', tier: 'bronce' },
  { min: 6,  max: 15, titulo: 'Rey de la Pelada', color: '#c0c0c0', tier: 'plata' },
  { min: 16, max: 30, titulo: 'Promesa',          color: '#ffd700', tier: 'oro' },
  { min: 31, max: 50, titulo: 'Profesional',      color: '#ffd700', tier: 'oro' },
  { min: 51, max: 80, titulo: 'Crack',            color: '#c4f54b', tier: 'platino' },
  { min: 81, max: 120,titulo: 'Ídolo',            color: '#c4f54b', tier: 'platino' },
  { min: 121,max: 999,titulo: 'LEYENDA',          color: '#c4f54b', tier: 'platino' },
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
  { cancha: 'Boston River F5', fecha: '3 mayo', resultado: 'Asistió ✅' },
  { cancha: 'Aerosur F5',      fecha: '29 abril', resultado: 'Asistió ✅' },
  { cancha: '2 Cabezas',       fecha: '24 abril', resultado: 'Asistió ✅' },
  { cancha: 'Centro Gallego',  fecha: '18 abril', resultado: 'Asistió ✅' },
  { cancha: 'Enfoque Deportivo',fecha: '10 abril', resultado: 'Asistió ✅' },
];

const PERFIL_DEMO = {
  nombre: 'Jugador', posicion: 'Mediocampista', ciudad: 'Montevideo',
  partidosJugados: 0, reputacion: 5, noShows: 0,
  insignias: [], penalizacionHasta: null, bloqueado: false, advertencia: false,
};

export default function PerfilScreen({ setTab }) {
  const { user, perfil, logout, refrescarPerfil } = useAuth();
  const [editando, setEditando] = useState(false);
  const [posicion, setPosicion] = useState(perfil?.posicion || 'Por definir');
  const [guardando, setGuardando] = useState(false);

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

  // Atributos calculados (simulados como Appito)
  const atributos = [
    { label: 'ATQ', val: Math.min(99, Math.round(overall * 1.05)) },
    { label: 'PAS', val: Math.min(99, Math.round(overall * 0.98)) },
    { label: 'DEF', val: Math.min(99, Math.round(overall * 0.92)) },
    { label: 'VEL', val: Math.min(99, Math.round(overall * 1.02)) },
  ];

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
              {POSICIONES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          ) : (
            <p className="text-f-muted text-sm mt-1">{p.posicion} · {p.ciudad}</p>
          )}

          {/* Atributos */}
          <div className="grid grid-cols-4 gap-2 mt-6">
            {atributos.map(a => (
              <div key={a.label} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                     style={{ background: `${nivel.color}15`, color: nivel.color }}>
                  {a.val}
                </div>
                <p className="text-f-muted text-xs font-bold uppercase">{a.label}</p>
              </div>
            ))}
          </div>

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
                ✏️ Editar posición
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

        {/* ── ESTADÍSTICAS ─────────────────────────────────────── */}
        <div className="card p-5">
          <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Estadísticas</p>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <StatBox valor={p.partidosJugados} label="Partidos" color="#c4f54b" />
            <StatBox valor={`${p.reputacion}/5`} label="Reputación" color="#fbbf24" />
            <StatBox valor={p.noShows || 0} label="No-shows" color={p.noShows > 0 ? '#f87171' : '#c4f54b'} />
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

        {/* ── REGLAS DE PENALIZACIÓN ──────────────────────────── */}
        <div className="card p-5">
          <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Sistema de penalizaciones</p>
          <div className="space-y-3">
            {[
              { icon: '✅', texto: 'Cancelás con +2 horas de anticipación', color: '#c4f54b' },
              { icon: '⚠️', texto: '1er no-show: advertencia en la cuenta', color: '#fbbf24' },
              { icon: '🔴', texto: '2do no-show: suspensión de 1 mes', color: '#f97316' },
              { icon: '⛔', texto: '3er no-show: ban permanente', color: '#f87171' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-7 text-center flex-shrink-0">{r.icon}</span>
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
          Falta 1 — Fútbol amateur Montevideo 🇺🇾
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
