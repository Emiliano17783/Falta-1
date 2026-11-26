import { useState, useEffect, useRef } from 'react';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import {
 actualizarPerfil, actualizarFotoPerfil, actualizarPerfilesDeporte,
 suscribirMisPartidos,
 buscarJugadores, buscarCanchasPublicas,
 bloquearJugador, desbloquearJugador, obtenerPerfilesBloqueados,
 enviarSugerencia, enviarReporte,
 enviarMensajeDirecto, suscribirConversaciones, suscribirMensajesDirectos,
} from '../firebase/firestore';
import { CIUDADES } from '../data/canchas';
import { formatearCedula } from '../utils/cedula';

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'g4toapow';
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'falta1_uploads';

const POSICIONES_FUTBOL = ['Arquero', 'Defensa', 'Mediocampista', 'Delantero', 'Por definir'];
const POSICIONES_PADEL = ['Reves', 'Drive', 'Por definir'];
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];

const NIVELES_CARRERA = [
 { min: 0,   max: 15,  titulo: 'Principiante', color: '#cd7f32', tier: 'bronce' },
 { min: 16,  max: 30,  titulo: 'Promesa',       color: '#c0c0c0', tier: 'plata' },
 { min: 31,  max: 50,  titulo: 'Crack',          color: '#ffd700', tier: 'oro' },
 { min: 51,  max: 80,  titulo: 'Profesional',    color: '#f59e0b', tier: 'oro' },
 { min: 81,  max: 120, titulo: 'Ídolo',          color: '#54b5f0', tier: 'platino' },
 { min: 121, max: 999, titulo: 'Leyenda',        color: '#a78bfa', tier: 'platino' },
];

function getNivelCarrera(n) {
 return NIVELES_CARRERA.find(x => n >= x.min && n <= x.max) || NIVELES_CARRERA[0];
}

// ─── Componente sub-pantalla genérica con header ───────────────────────────
function SubScreen({ titulo, onBack, children }) {
 return (
  <div className="min-h-svh bg-f-bg pb-28">
   <div className="flex items-center gap-3 px-5 pt-10 pb-4 bg-f-card border-b border-f-border sticky top-0 z-10">
    <button onClick={onBack} className="text-f-muted active:scale-90 transition-transform mr-1">
     <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
     </svg>
    </button>
    <h1 className="text-white font-black text-xl uppercase tracking-tight">{titulo}</h1>
   </div>
   <div>{children}</div>
  </div>
 );
}

// ─── Fila de menú ──────────────────────────────────────────────────────────
function MenuRow({ label, sub, onPress, danger, icon }) {
 return (
  <button
   onClick={onPress}
   className="w-full flex items-center justify-between px-5 py-4 border-b active:bg-white/5 transition-colors text-left"
   style={{ borderColor: 'rgba(255,255,255,0.05)' }}
  >
   <div className="flex items-center gap-3">
    {icon && <span className="text-lg">{icon}</span>}
    <div>
     <p className={`font-bold text-sm ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
     {sub && <p className="text-f-muted text-xs mt-0.5">{sub}</p>}
    </div>
   </div>
   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5a5a5a', flexShrink: 0 }}>
    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
   </svg>
  </button>
 );
}

// ─── Sección header ────────────────────────────────────────────────────────
function SectionHeader({ label }) {
 return (
  <p className="text-f-muted text-xs font-black uppercase tracking-widest px-5 pt-5 pb-2">
   {label}
  </p>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function PerfilScreen({ setTab, onVerDetalle }) {
 const { user, perfil, logout, refrescarPerfil, actualizarPerfilLocal } = useAuth();
 const [vista, setVista] = useState('main');
 const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
 const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
 const [convInicial, setConvInicial] = useState(null);

 const p = perfil || {};
 const nivel = getNivelCarrera(p.partidosJugados || 0);
 const hoy = new Date();
 const penalizado = p.penalizacionHasta && new Date(p.penalizacionHasta) > hoy;
 const diasPenalizacion = penalizado
  ? Math.ceil((new Date(p.penalizacionHasta) - hoy) / 86400000) : 0;
 const fotoActual = perfil?.foto || user?.photoURL;

 const irA = (v) => setVista(v);
 const volver = () => setVista('main');

 // ── Sub-pantallas ──────────────────────────────────────────────────────────
 if (vista === 'historial') {
  return <HistorialPartidos onBack={volver} onVerDetalle={onVerDetalle} />;
 }
 if (vista === 'editarPerfil') {
  return <EditarPerfilDeporte perfil={perfil} user={user} nivelColor={nivel.color}
   onBack={volver} onGuardado={refrescarPerfil} onActualizarLocal={actualizarPerfilLocal} />;
 }
 if (vista === 'infoPersonal') {
  return <InfoPersonal perfil={perfil} user={user} nivelColor={nivel.color}
   onBack={volver} onGuardado={refrescarPerfil} onActualizarLocal={actualizarPerfilLocal} />;
 }
 if (vista === 'buscarJugadores') {
  return <BuscarJugadores onBack={volver} myUid={user?.uid}
   onVerPerfil={(j) => { setJugadorSeleccionado(j); setVista('perfilJugador'); }} />;
 }
 if (vista === 'perfilJugador') {
  return <PerfilJugadorPublico jugador={jugadorSeleccionado} myUid={user?.uid}
   onBack={() => setVista('buscarJugadores')} bloqueados={perfil?.bloqueados || []}
   onEnviarMensaje={(j) => {
    setConvInicial({ id: [user.uid, j.id].sort().join('_'), otroUid: j.id, otroNombre: j.nombre, otroFoto: j.foto || null });
    setVista('mensajes');
   }} />;
 }
 if (vista === 'buscarCancha') {
  return <BuscarCancha onBack={volver}
   onVerDetalle={(c) => { setCanchaSeleccionada(c); setVista('detalleCancha'); }} />;
 }
 if (vista === 'detalleCancha') {
  return <DetalleCanchaPublica cancha={canchaSeleccionada}
   onBack={() => setVista('buscarCancha')} />;
 }
 if (vista === 'bloqueados') {
  return <UsuariosBloqueados myUid={user?.uid} bloqueados={perfil?.bloqueados || []}
   onBack={volver} onRecargar={refrescarPerfil} />;
 }
 if (vista === 'sugerencias') {
  return <Sugerencias uid={user?.uid} onBack={volver} />;
 }
 if (vista === 'privacidad') {
  return <PoliticaPrivacidad onBack={volver} />;
 }
 if (vista === 'terminos') {
  return <TerminosCondiciones onBack={volver} />;
 }
 if (vista === 'soporte') {
  return <SoporteDenuncias uid={user?.uid} onBack={volver} />;
 }
 if (vista === 'gestionCuenta') {
  return <GestionCuenta user={user} onBack={volver} />;
 }
 if (vista === 'mensajes') {
  return <Mensajes uid={user?.uid} perfil={perfil} onBack={volver} initialConv={convInicial} />;
 }

 // ── Vista principal ────────────────────────────────────────────────────────
 return (
  <div className="min-h-svh bg-f-bg pb-28">

   {/* Header */}
   <div className="px-5 pt-10 pb-4"
    style={{ background: `linear-gradient(to bottom, ${nivel.color}12 0%, transparent 100%)` }}>
    <h1 className="text-f-text font-black text-2xl uppercase tracking-tight">Mi perfil</h1>
   </div>

   <div className="px-4 md:px-12 space-y-4 pb-4">

    {/* Tarjeta jugador */}
    <div className={`player-card ${nivel.tier}`} style={{ borderTop: `3px solid ${nivel.color}` }}>
     <div className="mb-5" />
     <div className="flex justify-center mb-4">
      <div className="relative">
       <div className="w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center text-4xl font-black"
        style={{ borderColor: nivel.color, background: '#0c0c0c' }}>
        {fotoActual
         ? <img src={fotoActual} alt="avatar" className="w-full h-full object-cover" />
         : <span className="text-f-text">{(user?.displayName || 'J')[0].toUpperCase()}</span>
        }
       </div>
       {!p.bloqueado && !penalizado && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-f-bg"
         style={{ background: nivel.color }} />
       )}
      </div>
     </div>
     <p className="text-xl font-black uppercase leading-tight" style={{ color: nivel.color }}>
      {perfil?.nombre || user?.displayName || 'Jugador'}
     </p>
     <p className="text-f-muted text-sm mt-1">
      {p.perfilFutbol?.posicion || p.posicion || 'Por definir'} · {p.ciudad || 'Montevideo'}
     </p>
     {perfil?.cedula && (
      <p className="text-xs mt-1" style={{ color: '#3a3a3a' }}>CI {formatearCedula(perfil.cedula)}</p>
     )}
     <div className="flex gap-3 mt-4 mb-1">
      <div className="flex-1 text-center p-2 rounded-xl" style={{ background: 'rgba(84,181,240,0.06)' }}>
       <p className="text-2xl font-black" style={{ color: '#54b5f0' }}>{p.partidosJugados || 0}</p>
       <p className="text-f-muted text-xs font-bold uppercase">Partidos</p>
      </div>
      <div className="flex-1 text-center p-2 rounded-xl"
       style={{ background: (p.noShows || 0) > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(84,181,240,0.06)' }}>
       <p className="text-2xl font-black" style={{ color: (p.noShows || 0) > 0 ? '#f87171' : '#54b5f0' }}>{p.noShows || 0}</p>
       <p className="text-f-muted text-xs font-bold uppercase">No asistió</p>
      </div>
      <div className="flex-1 text-center p-2 rounded-xl" style={{ background: 'rgba(84,181,240,0.06)' }}>
       <p className="text-sm font-black" style={{ color: nivel.color }}>{nivel.titulo}</p>
       <p className="text-f-muted text-xs font-bold uppercase">Nivel</p>
      </div>
     </div>
     <div className="mt-4">
      <button onClick={() => irA('editarPerfil')}
       className="w-full py-2.5 rounded-xl border font-bold text-sm uppercase transition-colors"
       style={{ borderColor: `${nivel.color}40`, color: nivel.color }}>
       Editar perfil
      </button>
     </div>
    </div>

    {/* Alertas */}
    {perfil?.deudaPendiente && !perfil?.bloqueado && (
     <div className="bg-yellow-950/60 border border-yellow-700/50 rounded-2xl p-4">
      <p className="text-yellow-400 font-black text-base uppercase">Deuda pendiente</p>
      <p className="text-yellow-300/80 text-sm mt-1">
       Tenés un pago pendiente de un partido anterior.
      </p>
     </div>
    )}
    {p.bloqueado && (
     <div className="bg-red-950/60 border border-red-800/50 rounded-2xl p-4">
      <p className="text-red-400 font-black text-base uppercase">Cuenta bloqueada</p>
      <p className="text-red-300/80 text-sm mt-1">Contactá al soporte.</p>
     </div>
    )}
    {penalizado && !p.bloqueado && (
     <div className="bg-orange-950/50 border border-orange-800/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
       <p className="text-orange-400 font-black text-base uppercase">Suspensión activa</p>
       <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {diasPenalizacion} día{diasPenalizacion !== 1 ? 's' : ''}
       </span>
      </div>
      <p className="text-orange-300/80 text-sm">No podés anotarte a partidos hasta que venza la suspensión.</p>
     </div>
    )}
   </div>

   {/* ── Secciones del menú ── */}
   <div>

    {/* ACTIVIDAD */}
    <SectionHeader label="Actividad" />
    <div className="bg-f-card border-y border-f-border">
     <MenuRow label="Partidos" sub="Tu historial de partidos" icon="" onPress={() => irA('historial')} />
    </div>

    {/* CUENTA */}
    <SectionHeader label="Cuenta" />
    <div className="bg-f-card border-y border-f-border">
     <MenuRow label="Información personal" sub="Nombre, foto y ciudad" icon="" onPress={() => irA('infoPersonal')} />
     <MenuRow label="Mensajes" sub="Tus conversaciones con jugadores" icon="💬" onPress={() => { setConvInicial(null); irA('mensajes'); }} />
     <MenuRow label="Buscar jugadores" sub="Encontrá otros jugadores" icon="" onPress={() => irA('buscarJugadores')} />
     <MenuRow label="Buscar cancha" sub="Info de canchas disponibles" icon="" onPress={() => irA('buscarCancha')} />
    </div>

    {/* AJUSTES */}
    <SectionHeader label="Ajustes" />
    <div className="bg-f-card border-y border-f-border">
     <MenuRow label="Usuarios bloqueados" sub={`${(perfil?.bloqueados || []).length} bloqueados`} icon="" onPress={() => irA('bloqueados')} />
     <MenuRow label="Sugerencias" sub="Compartí tus ideas" icon="" onPress={() => irA('sugerencias')} />
    </div>

    {/* LEGAL Y CUENTA */}
    <SectionHeader label="Legal y cuenta" />
    <div className="bg-f-card border-y border-f-border">
     <MenuRow label="Política de privacidad" icon="" onPress={() => irA('privacidad')} />
     <MenuRow label="Términos y condiciones" icon="" onPress={() => irA('terminos')} />
     <MenuRow label="Soporte y denuncias" sub="Reportar un problema" icon="" onPress={() => irA('soporte')} />
     <MenuRow label="Gestión de cuenta" sub="Cambiar contraseña" icon="" onPress={() => irA('gestionCuenta')} />
    </div>

    {/* Admin */}
    {perfil?.admin && (
     <div className="px-4 mt-5">
      <button onClick={() => setTab('admin')}
       className="w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-colors
       flex items-center justify-center gap-2"
       style={{ border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
       Panel de Administración
      </button>
     </div>
    )}

    {/* Cerrar sesión */}
    <div className="px-4 mt-4 mb-2">
     <button onClick={logout}
      className="w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-colors"
      style={{ border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
      Cerrar sesión
     </button>
    </div>

    <p className="text-center text-f-muted text-xs py-4 pb-6">
     Falta 1 — Fútbol · Pádel · Uruguay
    </p>
   </div>
  </div>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// HISTORIAL DE PARTIDOS
// ══════════════════════════════════════════════════════════════════════════════
function HistorialPartidos({ onBack, onVerDetalle }) {
 const { user } = useAuth();
 const [misPartidos, setMisPartidos] = useState([]);

 useEffect(() => {
  if (!user) return;
  const unsub = suscribirMisPartidos(user.uid, setMisPartidos);
  return () => unsub();
 }, [user]);

 const estadoConfig = {
  pendiente:  { label: 'Pendiente',  bg: 'bg-yellow-950', border: 'border-yellow-800', text: 'text-yellow-300' },
  confirmado: { label: 'Confirmado', bg: 'bg-green-950',  border: 'border-green-800',  text: 'text-green-300' },
  lleno:      { label: 'Lleno',      bg: 'bg-orange-950', border: 'border-orange-800', text: 'text-orange-300' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-red-950',    border: 'border-red-800',    text: 'text-red-400'   },
  finalizado: { label: 'Finalizado', bg: 'bg-f-surface',  border: 'border-f-border',   text: 'text-f-muted'   },
 };

 return (
  <SubScreen titulo="Mis partidos" onBack={onBack}>
   <div className="px-4 py-4">
    {misPartidos.length === 0 ? (
     <p className="text-f-muted text-sm text-center py-12">Todavía no tenés partidos.</p>
    ) : (
     <div className="space-y-0 bg-f-card border border-f-border rounded-2xl overflow-hidden">
      {misPartidos.map(p => {
       const fecha = new Date(p.fechaHora);
       const ahora = new Date();
       const terminado = fecha.getTime() + 90 * 60 * 1000 < ahora.getTime();
       const estadoEfectivo = terminado && !['cancelado','finalizado'].includes(p.estado) ? 'finalizado' : p.estado;
       const cfg = estadoConfig[estadoEfectivo] || estadoConfig.finalizado;
       return (
        <button key={p.id} onClick={() => onVerDetalle?.(p)}
         className="w-full text-left py-3 px-4 border-b last:border-b-0 transition-colors active:bg-f-bg"
         style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
         <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
           <p className="text-f-text text-sm font-bold leading-tight truncate">{p.nombreCancha}</p>
           <p className="text-f-muted text-xs mt-0.5">
            {fecha.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' })} · {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
           </p>
          </div>
          <span className={`text-xs font-black px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
           {cfg.label}
          </span>
         </div>
        </button>
       );
      })}
     </div>
    )}
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// EDITAR PERFIL POR DEPORTE
// ══════════════════════════════════════════════════════════════════════════════
function EditarPerfilDeporte({ perfil, user, nivelColor, onBack, onGuardado, onActualizarLocal }) {
 const [tab, setTabDeporte] = useState('futbol');
 const [futbol, setFutbol] = useState({
  posicion: perfil?.perfilFutbol?.posicion || perfil?.posicion || 'Por definir',
  nivel: perfil?.perfilFutbol?.nivel || perfil?.nivelFutbol || 'Intermedio',
 });
 const [padel, setPadel] = useState({
  posicion: perfil?.perfilPadel?.posicion || 'Por definir',
  nivel: perfil?.perfilPadel?.nivel || 'Principiante',
 });
 const [guardando, setGuardando] = useState(false);
 const [exito, setExito] = useState(false);

 const handleGuardar = async () => {
  if (!user) return;
  setGuardando(true);
  try {
   await actualizarPerfilesDeporte(user.uid, futbol, padel);
   onActualizarLocal?.({ perfilFutbol: futbol, perfilPadel: padel });
   await onGuardado?.();
   setExito(true);
   setTimeout(() => setExito(false), 2000);
  } catch { /* ignore */ }
  setGuardando(false);
 };

 const nivelBg = { Principiante: '#22c55e', Intermedio: '#f59e0b', Avanzado: '#ef4444' };

 return (
  <SubScreen titulo="Editar perfil" onBack={onBack}>
   {/* Tabs */}
   <div className="flex border-b border-f-border">
    {['futbol', 'padel'].map(d => (
     <button key={d} onClick={() => setTabDeporte(d)}
      className={`flex-1 py-3 font-black text-sm uppercase transition-all
      ${tab === d ? 'text-f-accent border-b-2 border-f-accent' : 'text-f-muted'}`}>
      {d === 'futbol' ? 'Fútbol' : 'Pádel'}
     </button>
    ))}
   </div>

   <div className="px-5 py-6 space-y-6">
    {tab === 'futbol' ? (
     <>
      <div>
       <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-3">Posición</label>
       <div className="flex flex-wrap gap-2">
        {POSICIONES_FUTBOL.map(pos => (
         <button key={pos} onClick={() => setFutbol(f => ({ ...f, posicion: pos }))}
          className={`px-4 py-2 rounded-xl border font-bold text-sm transition-all
          ${futbol.posicion === pos ? 'text-white' : 'bg-f-card border-f-border text-f-muted'}`}
          style={futbol.posicion === pos ? { background: nivelColor, borderColor: nivelColor } : {}}>
          {pos}
         </button>
        ))}
       </div>
      </div>
      <div>
       <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-3">Nivel</label>
       <div className="flex gap-2">
        {NIVELES.map(n => (
         <button key={n} onClick={() => setFutbol(f => ({ ...f, nivel: n }))}
          className={`flex-1 py-3 rounded-xl border font-bold text-sm uppercase transition-all
          ${futbol.nivel === n ? 'text-white border-transparent' : 'bg-f-card border-f-border text-f-muted'}`}
          style={futbol.nivel === n ? { background: nivelBg[n] } : {}}>
          {n}
         </button>
        ))}
       </div>
      </div>
     </>
    ) : (
     <>
      <div>
       <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-3">Puesto</label>
       <div className="flex gap-2">
        {POSICIONES_PADEL.map(pos => (
         <button key={pos} onClick={() => setPadel(p => ({ ...p, posicion: pos }))}
          className={`flex-1 py-3 rounded-xl border font-bold text-sm uppercase transition-all
          ${padel.posicion === pos ? 'text-white' : 'bg-f-card border-f-border text-f-muted'}`}
          style={padel.posicion === pos ? { background: nivelColor, borderColor: nivelColor } : {}}>
          {pos}
         </button>
        ))}
       </div>
      </div>
      <div>
       <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-3">Nivel</label>
       <div className="flex gap-2">
        {NIVELES.map(n => (
         <button key={n} onClick={() => setPadel(p => ({ ...p, nivel: n }))}
          className={`flex-1 py-3 rounded-xl border font-bold text-sm uppercase transition-all
          ${padel.nivel === n ? 'text-white border-transparent' : 'bg-f-card border-f-border text-f-muted'}`}
          style={padel.nivel === n ? { background: nivelBg[n] } : {}}>
          {n}
         </button>
        ))}
       </div>
      </div>
     </>
    )}

    {exito && (
     <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-3 text-center">
      <p className="text-green-300 font-bold text-sm">¡Guardado!</p>
     </div>
    )}

    <button onClick={handleGuardar} disabled={guardando}
     className="w-full py-4 rounded-2xl font-black text-sm uppercase text-white disabled:opacity-50"
     style={{ background: nivelColor }}>
     {guardando ? 'Guardando...' : 'Guardar cambios'}
    </button>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// INFORMACIÓN PERSONAL
// ══════════════════════════════════════════════════════════════════════════════
function InfoPersonal({ perfil, user, nivelColor, onBack, onGuardado, onActualizarLocal }) {
 const [nombre, setNombre] = useState(perfil?.nombre || user?.displayName || '');
 const [ciudad, setCiudad] = useState(perfil?.ciudad || 'Montevideo');
 const [previewFoto, setPreviewFoto] = useState(perfil?.foto || user?.photoURL || null);
 const [subiendoFoto, setSubiendoFoto] = useState(false);
 const [guardando, setGuardando] = useState(false);
 const [error, setError] = useState(null);
 const fileInputRef = useRef(null);

 const handleFoto = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  setSubiendoFoto(true); setError(null);
  try {
   const formData = new FormData();
   formData.append('file', file);
   formData.append('upload_preset', CLOUDINARY_PRESET);
   const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: formData });
   if (!res.ok) throw new Error();
   const data = await res.json();
   setPreviewFoto(data.secure_url);
   await actualizarFotoPerfil(user.uid, data.secure_url);
   await updateProfile(auth.currentUser, { photoURL: data.secure_url });
   onActualizarLocal?.({ foto: data.secure_url });
  } catch { setError('No se pudo subir la foto.'); }
  setSubiendoFoto(false);
 };

 const handleGuardar = async () => {
  if (!user) return;
  setGuardando(true); setError(null);
  try {
   const updates = { ciudad };
   const nombreNuevo = nombre.trim();
   if (nombreNuevo && nombreNuevo !== (perfil?.nombre || user.displayName)) {
    await updateProfile(auth.currentUser, { displayName: nombreNuevo });
    updates.nombre = nombreNuevo;
   }
   await actualizarPerfil(user.uid, updates);
   onActualizarLocal?.(updates);
   await onGuardado?.();
   onBack();
  } catch { setError('No se pudo guardar.'); }
  setGuardando(false);
 };

 return (
  <SubScreen titulo="Información personal" onBack={onBack}>
   <div className="px-5 py-6 space-y-5">
    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFoto} />

    {/* Foto */}
    <div className="flex flex-col items-center gap-3">
     <div className="w-24 h-24 rounded-full overflow-hidden border-4 cursor-pointer"
      style={{ borderColor: nivelColor, background: '#0c0c0c' }}
      onClick={() => fileInputRef.current?.click()}>
      {subiendoFoto
       ? <div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-f-border border-t-f-accent rounded-full animate-spin" /></div>
       : previewFoto
        ? <img src={previewFoto} alt="avatar" className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-f-text">{(nombre || 'J')[0].toUpperCase()}</div>
      }
     </div>
     <button onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto}
      className="text-xs font-bold uppercase tracking-wide disabled:opacity-50"
      style={{ color: nivelColor }}>
      {subiendoFoto ? 'Subiendo...' : 'Cambiar foto'}
     </button>
    </div>

    {/* Nombre */}
    <div>
     <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-2">Nombre</label>
     <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" className="input-base" />
    </div>

    {/* Ciudad */}
    <div>
     <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-2">Ciudad</label>
     <select value={ciudad} onChange={e => setCiudad(e.target.value)} className="input-base">
      {CIUDADES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
     </select>
    </div>

    {/* CI (solo lectura) */}
    {perfil?.cedula && (
     <div>
      <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-2">Cédula de identidad</label>
      <div className="input-base opacity-50 select-none">{formatearCedula(perfil.cedula)}</div>
     </div>
    )}

    {error && <p className="text-red-400 text-sm">{error}</p>}

    <div className="flex gap-3 pt-2">
     <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-f-border text-f-muted font-bold text-sm uppercase">Cancelar</button>
     <button onClick={handleGuardar} disabled={guardando}
      className="flex-1 py-3 rounded-xl font-black text-sm uppercase disabled:opacity-50"
      style={{ background: nivelColor, color: '#0c0c0c' }}>
      {guardando ? 'Guardando...' : 'Guardar'}
     </button>
    </div>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// BUSCAR JUGADORES
// ══════════════════════════════════════════════════════════════════════════════
function BuscarJugadores({ onBack, myUid, onVerPerfil }) {
 const [texto, setTexto] = useState('');
 const [resultados, setResultados] = useState([]);
 const [buscando, setBuscando] = useState(false);
 const [buscado, setBuscado] = useState(false);

 const handleBuscar = async () => {
  if (!texto.trim()) return;
  setBuscando(true);
  const res = await buscarJugadores(texto);
  setResultados(res.filter(u => u.id !== myUid));
  setBuscado(true);
  setBuscando(false);
 };

 return (
  <SubScreen titulo="Buscar jugadores" onBack={onBack}>
   <div className="px-5 py-4 space-y-4">
    <div className="flex gap-2">
     <input
      type="text"
      value={texto}
      onChange={e => setTexto(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleBuscar()}
      placeholder="Nombre del jugador..."
      className="flex-1 bg-f-card border border-f-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-f-muted focus:outline-none focus:border-f-accent"
     />
     <button onClick={handleBuscar} disabled={buscando || !texto.trim()}
      className="px-5 py-3 rounded-xl font-black text-sm uppercase text-white disabled:opacity-50"
      style={{ background: '#0ea5e9' }}>
      {buscando ? '...' : 'Buscar'}
     </button>
    </div>

    {buscado && resultados.length === 0 && (
     <p className="text-f-muted text-sm text-center py-6">No se encontraron jugadores con ese nombre.</p>
    )}

    <div className="space-y-2">
     {resultados.map(j => (
      <button key={j.id} onClick={() => onVerPerfil(j)}
       className="w-full flex items-center gap-3 p-3 bg-f-card border border-f-border rounded-xl active:bg-f-bg transition-colors">
       <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-f-green flex items-center justify-center">
        {j.foto
         ? <img src={j.foto} alt={j.nombre} className="w-full h-full object-cover" />
         : <span className="text-white font-black">{(j.nombre || 'J')[0].toUpperCase()}</span>
        }
       </div>
       <div className="flex-1 min-w-0 text-left">
        <p className="text-white font-bold text-sm truncate">{j.nombre}</p>
        <p className="text-f-muted text-xs">
         {j.perfilFutbol?.posicion || j.posicion || 'Por definir'} · {j.ciudad || 'Montevideo'}
        </p>
       </div>
       <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5a5a5a' }}>
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
       </svg>
      </button>
     ))}
    </div>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// PERFIL PÚBLICO DE JUGADOR
// ══════════════════════════════════════════════════════════════════════════════
function PerfilJugadorPublico({ jugador, myUid, onBack, bloqueados, onEnviarMensaje }) {
 const [esBloqueado, setEsBloqueado] = useState(bloqueados.includes(jugador?.id));
 const [cargando, setCargando] = useState(false);

 if (!jugador) return null;

 const toggleBloquear = async () => {
  if (!myUid) return;
  setCargando(true);
  if (esBloqueado) {
   await desbloquearJugador(myUid, jugador.id);
   setEsBloqueado(false);
  } else {
   await bloquearJugador(myUid, jugador.id);
   setEsBloqueado(true);
  }
  setCargando(false);
 };

 const jFutbol = jugador.perfilFutbol;
 const jPadel = jugador.perfilPadel;
 const deportes = [];
 if (jFutbol && (jFutbol.posicion !== 'Por definir' || jFutbol.nivel)) deportes.push('Fútbol');
 if (jPadel && (jPadel.posicion !== 'Por definir' || jPadel.nivel)) deportes.push('Pádel');

 return (
  <SubScreen titulo="Perfil del jugador" onBack={onBack}>
   <div className="px-5 py-6">
    {/* Avatar y nombre */}
    <div className="flex flex-col items-center mb-6">
     <div className="w-24 h-24 rounded-full overflow-hidden bg-f-green flex items-center justify-center mb-3"
      style={{ border: '3px solid #54b5f0' }}>
      {jugador.foto
       ? <img src={jugador.foto} alt={jugador.nombre} className="w-full h-full object-cover" />
       : <span className="text-white text-3xl font-black">{(jugador.nombre || 'J')[0].toUpperCase()}</span>
      }
     </div>
     <p className="text-white text-xl font-black uppercase">{jugador.nombre}</p>
     <p className="text-f-muted text-sm">{jugador.ciudad || 'Montevideo'}</p>
    </div>

    {/* Info pública */}
    <div className="bg-f-card border border-f-border rounded-2xl overflow-hidden mb-5">
     {jFutbol && (
      <div className="px-4 py-3 border-b border-f-border">
       <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1"> Fútbol</p>
       <p className="text-white text-sm">
        {jFutbol.posicion || 'Por definir'} · <span className="text-f-accent">{jFutbol.nivel || 'Intermedio'}</span>
       </p>
      </div>
     )}
     {jPadel && (
      <div className="px-4 py-3 border-b border-f-border">
       <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1"> Pádel</p>
       <p className="text-white text-sm">
        {jPadel.posicion || 'Por definir'} · <span className="text-f-accent">{jPadel.nivel || 'Principiante'}</span>
       </p>
      </div>
     )}
     <div className="px-4 py-3">
      <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1">Partidos jugados</p>
      <p className="text-white text-sm font-black">{jugador.partidosJugados || 0}</p>
     </div>
    </div>

    {/* Enviar mensaje */}
    {myUid && myUid !== jugador.id && onEnviarMensaje && (
     <button onClick={() => onEnviarMensaje(jugador)}
      className="w-full py-3.5 rounded-2xl font-black text-sm uppercase mb-3"
      style={{ background: '#0ea5e9', color: '#000' }}>
      Enviar mensaje
     </button>
    )}

    {/* Bloquear */}
    <button onClick={toggleBloquear} disabled={cargando}
     className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-colors disabled:opacity-50
     ${esBloqueado ? 'border border-f-border text-f-muted' : 'border border-red-900/50 text-red-400'}`}>
     {cargando ? '...' : esBloqueado ? 'Desbloquear usuario' : 'Bloquear usuario'}
    </button>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// BUSCAR CANCHA
// ══════════════════════════════════════════════════════════════════════════════
function BuscarCancha({ onBack, onVerDetalle }) {
 const [texto, setTexto] = useState('');
 const [resultados, setResultados] = useState([]);
 const [buscando, setBuscando] = useState(false);
 const [buscado, setBuscado] = useState(false);

 const handleBuscar = async () => {
  if (!texto.trim()) return;
  setBuscando(true);
  const res = await buscarCanchasPublicas(texto);
  setResultados(res);
  setBuscado(true);
  setBuscando(false);
 };

 return (
  <SubScreen titulo="Buscar cancha" onBack={onBack}>
   <div className="px-5 py-4 space-y-4">
    <div className="flex gap-2">
     <input
      type="text"
      value={texto}
      onChange={e => setTexto(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleBuscar()}
      placeholder="Nombre de la cancha..."
      className="flex-1 bg-f-card border border-f-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-f-muted focus:outline-none focus:border-f-accent"
     />
     <button onClick={handleBuscar} disabled={buscando || !texto.trim()}
      className="px-5 py-3 rounded-xl font-black text-sm uppercase text-white disabled:opacity-50"
      style={{ background: '#0ea5e9' }}>
      {buscando ? '...' : 'Buscar'}
     </button>
    </div>

    {buscado && resultados.length === 0 && (
     <p className="text-f-muted text-sm text-center py-6">No se encontraron canchas con ese nombre.</p>
    )}

    <div className="space-y-2">
     {resultados.map(c => (
      <button key={c.id} onClick={() => onVerDetalle(c)}
       className="w-full flex items-center gap-3 p-3 bg-f-card border border-f-border rounded-xl active:bg-f-bg transition-colors text-left">
       <div className="w-10 h-10 rounded-xl bg-sky-900 flex items-center justify-center flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#54b5f0' }}>
         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
       </div>
       <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{c.nombre}</p>
        <p className="text-f-muted text-xs">{c.barrio} · {c.ciudad}</p>
       </div>
       <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5a5a5a' }}>
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
       </svg>
      </button>
     ))}
    </div>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// DETALLE CANCHA PÚBLICA
// ══════════════════════════════════════════════════════════════════════════════
function DetalleCanchaPublica({ cancha, onBack }) {
 if (!cancha) return null;
 return (
  <SubScreen titulo="Cancha" onBack={onBack}>
   <div className="px-5 py-6">
    <p className="text-white text-2xl font-black uppercase mb-1">{cancha.nombre}</p>
    <p className="text-f-muted text-sm mb-5">{cancha.barrio} · {cancha.ciudad}</p>
    <div className="bg-f-card border border-f-border rounded-2xl overflow-hidden">
     {cancha.deporte && (
      <div className="px-4 py-3 border-b border-f-border">
       <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1">Deporte</p>
       <p className="text-white text-sm capitalize">{cancha.deporte}</p>
      </div>
     )}
     {cancha.tipo && (
      <div className="px-4 py-3 border-b border-f-border">
       <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1">Tipo</p>
       <p className="text-white text-sm">{cancha.tipo}</p>
      </div>
     )}
     {cancha.modalidades?.length > 0 && (
      <div className="px-4 py-3 border-b border-f-border">
       <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1">Modalidades</p>
       <p className="text-white text-sm">{cancha.modalidades.join(', ')}</p>
      </div>
     )}
     {cancha.precioPorHora > 0 && (
      <div className="px-4 py-3 border-b border-f-border">
       <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1">Precio</p>
       <p className="text-f-accent font-black text-lg">${cancha.precioPorHora?.toLocaleString('es-UY')}/h</p>
      </div>
     )}
     {cancha.direccion && (
      <div className="px-4 py-3 border-b border-f-border">
       <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1">Dirección</p>
       <p className="text-white text-sm">{cancha.direccion}</p>
      </div>
     )}
     {cancha.telefono && (
      <div className="px-4 py-3">
       <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1">Teléfono</p>
       <p className="text-white text-sm">{cancha.telefono}</p>
      </div>
     )}
    </div>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// USUARIOS BLOQUEADOS
// ══════════════════════════════════════════════════════════════════════════════
function UsuariosBloqueados({ myUid, bloqueados, onBack, onRecargar }) {
 const [perfiles, setPerfiles] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [desbloqueando, setDesbloqueando] = useState(null);

 useEffect(() => {
  obtenerPerfilesBloqueados(bloqueados)
   .then(setPerfiles)
   .finally(() => setCargando(false));
 }, []);

 const handleDesbloquear = async (uid) => {
  setDesbloqueando(uid);
  await desbloquearJugador(myUid, uid);
  setPerfiles(p => p.filter(x => x.id !== uid));
  onRecargar?.();
  setDesbloqueando(null);
 };

 return (
  <SubScreen titulo="Usuarios bloqueados" onBack={onBack}>
   <div className="px-5 py-4">
    {cargando ? (
     <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom" />
     </div>
    ) : perfiles.length === 0 ? (
     <p className="text-f-muted text-sm text-center py-12">No tenés usuarios bloqueados.</p>
    ) : (
     <div className="space-y-2">
      {perfiles.map(j => (
       <div key={j.id} className="flex items-center gap-3 p-3 bg-f-card border border-f-border rounded-xl">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-f-green flex items-center justify-center flex-shrink-0">
         {j.foto
          ? <img src={j.foto} alt={j.nombre} className="w-full h-full object-cover" />
          : <span className="text-white font-black">{(j.nombre || '?')[0].toUpperCase()}</span>
         }
        </div>
        <p className="flex-1 text-white font-bold text-sm">{j.nombre}</p>
        <button
         onClick={() => handleDesbloquear(j.id)}
         disabled={desbloqueando === j.id}
         className="text-xs font-bold px-3 py-1.5 rounded-lg border border-f-border text-f-muted active:scale-95 disabled:opacity-50">
         {desbloqueando === j.id ? '...' : 'Desbloquear'}
        </button>
       </div>
      ))}
     </div>
    )}
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUGERENCIAS
// ══════════════════════════════════════════════════════════════════════════════
function Sugerencias({ uid, onBack }) {
 const [texto, setTexto] = useState('');
 const [enviando, setEnviando] = useState(false);
 const [enviado, setEnviado] = useState(false);

 const handleEnviar = async () => {
  if (!texto.trim() || !uid) return;
  setEnviando(true);
  await enviarSugerencia(uid, texto);
  setEnviado(true);
  setTexto('');
  setEnviando(false);
 };

 return (
  <SubScreen titulo="Sugerencias" onBack={onBack}>
   <div className="px-5 py-6 space-y-4">
    <p className="text-f-muted text-sm leading-relaxed">
     ¿Tenés alguna idea para mejorar Falta 1? Contanos.
    </p>
    {enviado && (
     <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-3">
      <p className="text-green-300 font-bold text-sm">¡Gracias por tu sugerencia!</p>
     </div>
    )}
    <textarea
     value={texto}
     onChange={e => setTexto(e.target.value)}
     placeholder="Escribí tu sugerencia acá..."
     rows={5}
     className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-f-muted focus:outline-none focus:border-f-accent resize-none"
    />
    <button onClick={handleEnviar} disabled={enviando || !texto.trim()}
     className="w-full py-4 rounded-2xl font-black text-sm uppercase text-white disabled:opacity-40"
     style={{ background: '#0ea5e9' }}>
     {enviando ? 'Enviando...' : 'Enviar sugerencia'}
    </button>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// POLÍTICA DE PRIVACIDAD
// ══════════════════════════════════════════════════════════════════════════════
function PoliticaPrivacidad({ onBack }) {
 return (
  <SubScreen titulo="Política de privacidad" onBack={onBack}>
   <div className="px-5 py-6 space-y-4">
    <p className="text-f-muted text-xs font-black uppercase tracking-widest">Última actualización: Noviembre 2026</p>
    <p className="text-white font-black text-lg">Uso de tus datos</p>
    <p className="text-f-muted text-sm leading-relaxed">
     Falta 1 recopila únicamente la información necesaria para brindarte el servicio: nombre, email, cédula de identidad y ciudad. Estos datos se almacenan de forma segura en servidores de Google Firebase y no se comparten con terceros con fines comerciales.
    </p>
    <p className="text-white font-black text-lg">Datos de partidos</p>
    <p className="text-f-muted text-sm leading-relaxed">
     La información sobre los partidos en los que participás (historial, calificaciones, estado de cuenta) se utiliza exclusivamente para el funcionamiento de la plataforma y la mejora del servicio.
    </p>
    <p className="text-white font-black text-lg">Fotos de perfil</p>
    <p className="text-f-muted text-sm leading-relaxed">
     Las fotos de perfil se almacenan en Cloudinary y son visibles para otros usuarios de la plataforma. Podés cambiar o eliminar tu foto desde la sección de perfil.
    </p>
    <p className="text-white font-black text-lg">Contacto</p>
    <p className="text-f-muted text-sm leading-relaxed">
     Para consultas sobre privacidad o solicitudes de eliminación de datos, utilizá la sección de "Soporte y denuncias" en la app.
    </p>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// TÉRMINOS Y CONDICIONES
// ══════════════════════════════════════════════════════════════════════════════
function TerminosCondiciones({ onBack }) {
 return (
  <SubScreen titulo="Términos y condiciones" onBack={onBack}>
   <div className="px-5 py-6 space-y-4">
    <p className="text-f-muted text-xs font-black uppercase tracking-widest">Última actualización: Noviembre 2026</p>
    <p className="text-white font-black text-lg">Uso de la plataforma</p>
    <p className="text-f-muted text-sm leading-relaxed">
     Al registrarte en Falta 1, aceptás cumplir con las reglas de la comunidad: asistir a los partidos a los que te anotás, avisar con anticipación si no podés ir, y tratar a todos los jugadores con respeto.
    </p>
    <p className="text-white font-black text-lg">Sistema de penalizaciones</p>
    <p className="text-f-muted text-sm leading-relaxed">
     El incumplimiento reiterado de las normas puede resultar en suspensión temporal o bloqueo permanente de la cuenta. Las penalizaciones se aplican de forma automática y transparente según las reglas publicadas.
    </p>
    <p className="text-white font-black text-lg">Pagos</p>
    <p className="text-f-muted text-sm leading-relaxed">
     Falta 1 no procesa pagos. Los pagos de las canchas se realizan en efectivo directamente. La plataforma no es responsable de conflictos económicos entre usuarios.
    </p>
    <p className="text-white font-black text-lg">Responsabilidad</p>
    <p className="text-f-muted text-sm leading-relaxed">
     Falta 1 es una plataforma de coordinación. No somos responsables por lesiones, accidentes u otros incidentes que ocurran durante los partidos.
    </p>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// SOPORTE Y DENUNCIAS
// ══════════════════════════════════════════════════════════════════════════════
function SoporteDenuncias({ uid, onBack }) {
 const [texto, setTexto] = useState('');
 const [enviando, setEnviando] = useState(false);
 const [enviado, setEnviado] = useState(false);

 const handleEnviar = async () => {
  if (!texto.trim() || !uid) return;
  setEnviando(true);
  await enviarReporte(uid, texto);
  setEnviado(true);
  setTexto('');
  setEnviando(false);
 };

 return (
  <SubScreen titulo="Soporte y denuncias" onBack={onBack}>
   <div className="px-5 py-6 space-y-4">
    <p className="text-f-muted text-sm leading-relaxed">
     ¿Tenés algún problema o querés reportar a un usuario? Describilo acá y lo vamos a revisar.
    </p>
    {enviado && (
     <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-3">
      <p className="text-green-300 font-bold text-sm">¡Reporte enviado! Lo vamos a revisar a la brevedad.</p>
     </div>
    )}
    <textarea
     value={texto}
     onChange={e => setTexto(e.target.value)}
     placeholder="Describí el problema o la denuncia..."
     rows={6}
     className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-f-muted focus:outline-none focus:border-f-accent resize-none"
    />
    <button onClick={handleEnviar} disabled={enviando || !texto.trim()}
     className="w-full py-4 rounded-2xl font-black text-sm uppercase text-white disabled:opacity-40"
     style={{ background: '#0ea5e9' }}>
     {enviando ? 'Enviando...' : 'Enviar reporte'}
    </button>
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// GESTIÓN DE CUENTA
// ══════════════════════════════════════════════════════════════════════════════
function GestionCuenta({ user, onBack }) {
 const [passActual, setPassActual] = useState('');
 const [passNueva, setPassNueva] = useState('');
 const [passNueva2, setPassNueva2] = useState('');
 const [guardando, setGuardando] = useState(false);
 const [error, setError] = useState(null);
 const [exito, setExito] = useState(false);

 // Solo email/password users pueden cambiar contraseña
 const esEmailUser = user?.providerData?.some(p => p.providerId === 'password');

 const handleCambiarPass = async () => {
  setError(null);
  if (passNueva !== passNueva2) { setError('Las contraseñas no coinciden.'); return; }
  if (passNueva.length < 6) { setError('La contraseña necesita al menos 6 caracteres.'); return; }
  setGuardando(true);
  try {
   const credential = EmailAuthProvider.credential(user.email, passActual);
   await reauthenticateWithCredential(auth.currentUser, credential);
   await updatePassword(auth.currentUser, passNueva);
   setExito(true);
   setPassActual(''); setPassNueva(''); setPassNueva2('');
  } catch (err) {
   if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
    setError('La contraseña actual es incorrecta.');
   } else {
    setError('No se pudo cambiar la contraseña. Intentá de nuevo.');
   }
  }
  setGuardando(false);
 };

 return (
  <SubScreen titulo="Gestión de cuenta" onBack={onBack}>
   <div className="px-5 py-6 space-y-5">
    <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
     <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-1">Email</p>
     <p className="text-white text-sm">{user?.email}</p>
    </div>

    {esEmailUser ? (
     <>
      <p className="text-white font-black text-base uppercase">Cambiar contraseña</p>

      {exito && (
       <div className="bg-green-950 border border-green-800 rounded-xl px-4 py-3">
        <p className="text-green-300 font-bold text-sm">¡Contraseña actualizada!</p>
       </div>
      )}

      <div className="space-y-3">
       <div>
        <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-2">Contraseña actual</label>
        <input type="password" value={passActual} onChange={e => setPassActual(e.target.value)} placeholder="••••••••" className="input-base" />
       </div>
       <div>
        <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-2">Nueva contraseña</label>
        <input type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)} placeholder="••••••••" className="input-base" />
       </div>
       <div>
        <label className="text-f-muted text-xs font-black uppercase tracking-widest block mb-2">Repetir nueva contraseña</label>
        <input type="password" value={passNueva2} onChange={e => setPassNueva2(e.target.value)} placeholder="••••••••" className="input-base" />
       </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={handleCambiarPass} disabled={guardando || !passActual || !passNueva || !passNueva2}
       className="w-full py-4 rounded-2xl font-black text-sm uppercase text-white disabled:opacity-40"
       style={{ background: '#0ea5e9' }}>
       {guardando ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
     </>
    ) : (
     <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
      <p className="text-f-muted text-sm">Iniciaste sesión con Google. Para cambiar tu contraseña, hacelo desde tu cuenta de Google.</p>
     </div>
    )}
   </div>
  </SubScreen>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONVERSACIÓN (chat directo entre dos jugadores)
// ══════════════════════════════════════════════════════════════════════════════
function Conversacion({ conv, uid, perfil, onBack }) {
 const [mensajes, setMensajes] = useState([]);
 const [texto, setTexto] = useState('');
 const [enviando, setEnviando] = useState(false);
 const endRef = useRef(null);

 useEffect(() => {
  return suscribirMensajesDirectos(conv.id, setMensajes);
 }, [conv.id]);

 useEffect(() => {
  endRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [mensajes]);

 const handleEnviar = async () => {
  const t = texto.trim();
  if (!t || enviando) return;
  setTexto('');
  setEnviando(true);
  try {
   await enviarMensajeDirecto(uid, conv.otroUid, t, perfil?.nombre || 'Jugador', perfil?.foto || null);
  } finally {
   setEnviando(false);
  }
 };

 return (
  <div className="min-h-svh bg-f-bg flex flex-col">
   {/* Header */}
   <div className="flex items-center gap-3 px-5 pt-10 pb-4 bg-f-card border-b border-f-border sticky top-0 z-10">
    <button onClick={onBack} className="text-f-muted active:scale-90 transition-transform mr-1">
     <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
     </svg>
    </button>
    <div className="w-9 h-9 rounded-full overflow-hidden bg-f-green flex items-center justify-center flex-shrink-0">
     {conv.otroFoto
      ? <img src={conv.otroFoto} alt={conv.otroNombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      : <span className="text-white font-black text-base">{(conv.otroNombre || 'J')[0].toUpperCase()}</span>
     }
    </div>
    <p className="text-white font-black text-lg uppercase tracking-tight truncate">{conv.otroNombre || 'Jugador'}</p>
   </div>

   {/* Mensajes */}
   <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ paddingBottom: 100 }}>
    {mensajes.length === 0 && (
     <p className="text-center text-f-muted text-sm py-8">Empezá la conversación.</p>
    )}
    {mensajes.map(m => {
     const esMio = m.de === uid;
     const fecha = m.fecha?.toDate?.();
     return (
      <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
       <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm break-words
        ${esMio ? 'rounded-br-sm text-black' : 'rounded-bl-sm border border-f-border text-white bg-f-card'}`}
        style={esMio ? { background: '#0ea5e9' } : {}}>
        <p>{m.texto}</p>
        {fecha && (
         <p className={`text-[10px] mt-1 ${esMio ? 'text-black/50' : 'text-f-muted'}`}>
          {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
         </p>
        )}
       </div>
      </div>
     );
    })}
    <div ref={endRef} />
   </div>

   {/* Input */}
   <div className="fixed bottom-0 left-0 right-0 px-4 bg-f-card border-t border-f-border"
    style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 72px)', paddingTop: 12 }}>
    <div className="flex gap-2 max-w-2xl mx-auto">
     <input
      value={texto}
      onChange={e => setTexto(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
      placeholder="Escribí un mensaje..."
      maxLength={500}
      className="flex-1 bg-f-bg border border-f-border rounded-xl px-4 py-3 text-white text-sm outline-none"
      style={{ caretColor: '#0ea5e9' }}
     />
     <button onClick={handleEnviar} disabled={!texto.trim() || enviando}
      className="px-5 rounded-xl font-black text-sm uppercase disabled:opacity-40 transition-opacity"
      style={{ background: '#0ea5e9', color: '#000' }}>
      {enviando ? '...' : 'Enviar'}
     </button>
    </div>
   </div>
  </div>
 );
}

// ══════════════════════════════════════════════════════════════════════════════
// LISTA DE MENSAJES (conversaciones)
// ══════════════════════════════════════════════════════════════════════════════
function Mensajes({ uid, perfil, onBack, initialConv }) {
 const [subVista, setSubVista] = useState(initialConv ? 'chat' : 'lista');
 const [convActiva, setConvActiva] = useState(initialConv || null);
 const [convs, setConvs] = useState(null);

 useEffect(() => {
  if (!uid) return;
  return suscribirConversaciones(uid, setConvs);
 }, [uid]);

 const abrirConv = (conv) => {
  const otroUid = conv.participantes?.find(p => p !== uid);
  setConvActiva({
   id: conv.id,
   otroUid,
   otroNombre: conv.nombres?.[otroUid] || 'Jugador',
   otroFoto: conv.fotos?.[otroUid] || null,
  });
  setSubVista('chat');
 };

 if (subVista === 'chat' && convActiva) {
  return <Conversacion conv={convActiva} uid={uid} perfil={perfil}
   onBack={() => { setConvActiva(null); setSubVista('lista'); }} />;
 }

 return (
  <SubScreen titulo="Mensajes" onBack={onBack}>
   {convs === null ? (
    <div className="flex justify-center py-16">
     <div className="w-8 h-8 rounded-full border-2 border-f-accent border-t-transparent animate-spin" />
    </div>
   ) : convs.length === 0 ? (
    <div className="text-center py-16 px-8">
     <p className="text-4xl mb-3">💬</p>
     <p className="text-white font-bold text-base mb-1">Sin conversaciones</p>
     <p className="text-f-muted text-sm">Buscá un jugador y enviále un mensaje desde su perfil.</p>
    </div>
   ) : (
    <div>
     {convs.map(conv => {
      const otroUid = conv.participantes?.find(p => p !== uid);
      const nombre = conv.nombres?.[otroUid] || 'Jugador';
      const foto = conv.fotos?.[otroUid];
      const ultimo = conv.ultimoMensaje || '';
      const fecha = conv.ultimaFecha?.toDate?.();
      return (
       <button key={conv.id} onClick={() => abrirConv(conv)}
        className="w-full flex items-center gap-4 px-5 py-4 border-b active:bg-white/5 transition-colors text-left"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="w-12 h-12 rounded-full bg-f-green flex items-center justify-center overflow-hidden flex-shrink-0">
         {foto
          ? <img src={foto} alt={nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          : <span className="text-white font-black text-lg">{nombre[0]?.toUpperCase()}</span>
         }
        </div>
        <div className="flex-1 min-w-0">
         <p className="text-white font-bold text-sm truncate">{nombre}</p>
         <p className="text-f-muted text-xs truncate mt-0.5">{ultimo}</p>
        </div>
        {fecha && (
         <span className="text-f-muted text-[10px] flex-shrink-0">
          {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
         </span>
        )}
       </button>
      );
     })}
    </div>
   )}
  </SubScreen>
 );
}
