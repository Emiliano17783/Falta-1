import { useState, useEffect, useRef } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfil, actualizarFotoPerfil, suscribirMisPartidos } from '../firebase/firestore';
import { CIUDADES } from '../data/canchas';
import { formatearCedula } from '../utils/cedula';

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'g4toapow';
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'falta1_uploads';

const POSICIONES = ['Arquero', 'Defensa', 'Mediocampista', 'Delantero', 'Por definir'];
const NIVELES_PADEL = ['Principiante', 'Intermedio', 'Avanzado'];

// Niveles de carrera
const NIVELES_CARRERA = [
 { min: 0, max: 15, titulo: 'Principiante', color: '#cd7f32', tier: 'bronce' },
 { min: 16, max: 30, titulo: 'Promesa', color: '#c0c0c0', tier: 'plata' },
 { min: 31, max: 50, titulo: 'Crack', color: '#ffd700', tier: 'oro' },
 { min: 51, max: 80, titulo: 'Profesional', color: '#f59e0b', tier: 'oro' },
 { min: 81, max: 120, titulo: 'Ídolo', color: '#54b5f0', tier: 'platino' },
 { min: 121, max: 999, titulo: 'Leyenda', color: '#a78bfa', tier: 'platino' },
];

function getNivelCarrera(partidosJugados) {
 return NIVELES_CARRERA.find(n => partidosJugados >= n.min && partidosJugados <= n.max)
 || NIVELES_CARRERA[0];
}


const PERFIL_DEMO = {
 nombre: 'Sebas V.', posicion: 'Mediocampista', ciudad: 'Montevideo',
 partidosJugados: 27, reputacion: 5, noShows: 0,
 penalizacionHasta: null, bloqueado: false, advertencia: false,
};

/* Modal editar perfil */
function ModalEditarPerfil({ perfil, user, nivelColor, onClose, onGuardado, onActualizarLocal }) {
 const [nombre, setNombre] = useState(perfil?.nombre || user?.displayName || '');
 const [posicion, setPosicion] = useState(perfil?.posicion || 'Por definir');
 const [nivelFutbol, setNivelFutbol] = useState(perfil?.nivelFutbol || 'Intermedio');
 const [ciudad, setCiudad] = useState(perfil?.ciudad || 'Montevideo');
 const [previewFoto, setPreviewFoto] = useState(perfil?.foto || user?.photoURL || null);
 const [subiendoFoto, setSubiendoFoto] = useState(false);
 const [guardando, setGuardando] = useState(false);
 const [error, setError] = useState(null);
 const fileInputRef = useRef(null);

 const handleAbrirSelector = () => {
 fileInputRef.current?.click();
 };

 const handleArchivoSeleccionado = async (e) => {
 const file = e.target.files[0];
 if (!file) return;
 e.target.value = '';

 setSubiendoFoto(true);
 setError(null);
 try {
 const formData = new FormData();
 formData.append('file', file);
 formData.append('upload_preset', CLOUDINARY_PRESET);

 const res = await fetch(
 `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
 { method: 'POST', body: formData }
 );
 if (!res.ok) throw new Error('Error al subir');

 const data = await res.json();
 const url = data.secure_url;
 setPreviewFoto(url);
 await actualizarFotoPerfil(user.uid, url);
 await updateProfile(auth.currentUser, { photoURL: url });
 onActualizarLocal?.({ foto: url });
 } catch {
 setError('No se pudo subir la foto. Intentá de nuevo.');
 }
 setSubiendoFoto(false);
 };

 const handleGuardar = async () => {
 if (!user) return;
 setGuardando(true);
 setError(null);
 try {
 const nombreNuevo = nombre.trim();
 const updates = { posicion, nivelFutbol, ciudad };

 // Actualizar nombre en Firebase Auth y en Firestore
 if (nombreNuevo && nombreNuevo !== (perfil?.nombre || user.displayName)) {
 await updateProfile(auth.currentUser, { displayName: nombreNuevo });
 updates.nombre = nombreNuevo;
 }

 // Actualizar Firestore (nombre + posicion + ciudad en un solo write)
 await actualizarPerfil(user.uid, updates);
 onActualizarLocal?.(updates);
 await onGuardado();
 onClose();
 } catch {
 setError('No se pudo guardar. Intentá de nuevo.');
 } finally {
 setGuardando(false);
 }
 };

 return (
 <div className="modal-overlay" onClick={onClose}>
 <div className="modal-content" onClick={e => e.stopPropagation()}>
 <div className="px-5 pt-6 pb-2 flex items-center justify-between">
 <h2 className="text-white font-black text-xl uppercase">Editar perfil</h2>
 <button onClick={onClose} className="text-f-muted text-2xl leading-none">&times;</button>
 </div>

 <div className="px-5 pb-8 space-y-5 mt-2">

 {/* Foto — selector nativo de archivos */}
 <div className="flex flex-col items-center gap-3">
 <input
 ref={fileInputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 className="hidden"
 onChange={handleArchivoSeleccionado}
 />
 <div className="relative">
 <div className="w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center text-4xl font-black cursor-pointer"
 style={{ borderColor: nivelColor, background: '#0c0c0c' }}
 onClick={handleAbrirSelector}>
 {subiendoFoto ? (
 <div className="w-8 h-8 border-2 border-f-border border-t-f-accent rounded-full animate-spin" />
 ) : previewFoto ? (
 <img src={previewFoto} alt="avatar" className="w-full h-full object-cover" />
 ) : (
 <span className="text-f-text">{(perfil?.nombre || user?.displayName || 'J')[0].toUpperCase()}</span>
 )}
 {!subiendoFoto && (
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity">
 <span className="text-white text-xs font-bold">Cambiar</span>
 </div>
 )}
 </div>
 </div>
 <button
 type="button"
 onClick={handleAbrirSelector}
 disabled={subiendoFoto}
 className="text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
 style={{ color: nivelColor }}>
 {subiendoFoto ? 'Subiendo...' : 'Cambiar foto'}
 </button>
 </div>

 {/* Nombre */}
 <div>
 <label className="text-f-muted text-xs font-bold uppercase tracking-widest block mb-2">
 Nombre
 </label>
 <input
 type="text"
 value={nombre}
 onChange={e => setNombre(e.target.value)}
 placeholder="Tu nombre"
 className="input-base"
 />
 </div>

 {/* Posición / Nivel */}
 <div>
 <label className="text-f-muted text-xs font-bold uppercase tracking-widest block mb-2">
 Posición / Nivel
 </label>
 <select
 value={posicion}
 onChange={e => setPosicion(e.target.value)}
 className="input-base">
 <optgroup label="Fútbol">
 {POSICIONES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
 </optgroup>
 <optgroup label="Pádel">
 {NIVELES_PADEL.map(n => (
 <option key={`padel-${n}`} value={`Pádel ${n}`}>Pádel {n}</option>
 ))}
 </optgroup>
 </select>
 </div>

 {/* Nivel de fútbol */}
 <div>
 <label className="text-f-muted text-xs font-bold uppercase tracking-widest block mb-2">
 Nivel de fútbol
 </label>
 <div className="flex gap-2">
 {['Principiante', 'Intermedio', 'Avanzado'].map(n => (
 <button key={n} type="button" onClick={() => setNivelFutbol(n)}
 className="flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all"
 style={nivelFutbol === n
 ? { background: n === 'Principiante' ? '#22c55e' : n === 'Intermedio' ? '#f59e0b' : '#ef4444',
 borderColor: 'transparent', color: '#fff' }
 : { borderColor: 'rgba(255,255,255,0.1)', color: '#5a5a5a' }}>
 {n}
 </button>
 ))}
 </div>
 </div>

 {/* Ciudad */}
 <div>
 <label className="text-f-muted text-xs font-bold uppercase tracking-widest block mb-2">
 Ciudad
 </label>
 <select
 value={ciudad}
 onChange={e => setCiudad(e.target.value)}
 className="input-base">
 {CIUDADES.map(c => (
 <option key={c.id} value={c.id}>{c.label}</option>
 ))}
 </select>
 </div>

 {error && <p className="text-red-400 text-sm">{error}</p>}

 <div className="flex gap-3 pt-2">
 <button onClick={onClose}
 className="flex-1 py-3 rounded-xl border border-f-border text-f-muted font-bold text-sm uppercase">
 Cancelar
 </button>
 <button onClick={handleGuardar} disabled={guardando}
 className="flex-1 py-3 rounded-xl font-black text-sm uppercase disabled:opacity-50"
 style={{ background: nivelColor, color: '#0c0c0c' }}>
 {guardando ? 'Guardando...' : 'Guardar'}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

/* Pantalla principal */
export default function PerfilScreen({ setTab, onVerDetalle }) {
 const { user, perfil, logout, refrescarPerfil, actualizarPerfilLocal } = useAuth();
 const [modalEditando, setModalEditando] = useState(false);
 const [misPartidos, setMisPartidos] = useState([]);

 useEffect(() => {
 if (!user) return;
 const unsub = suscribirMisPartidos(user.uid, setMisPartidos);
 return () => unsub();
 }, [user]);

 const p = perfil || PERFIL_DEMO;
 const nivel = getNivelCarrera(p.partidosJugados);
 const hoy = new Date();
 const penalizado = p.penalizacionHasta && new Date(p.penalizacionHasta) > hoy;
 const diasPenalizacion = penalizado
 ? Math.ceil((new Date(p.penalizacionHasta) - hoy) / 86400000) : 0;

 const fotoActual = perfil?.foto || user?.photoURL;

 return (
 <div className="min-h-svh bg-f-bg pb-28">

 {/* Header con gradiente sutil */}
 <div className="px-5 pt-10 pb-4"
 style={{ background: `linear-gradient(to bottom, ${nivel.color}12 0%, transparent 100%)` }}>
 <h1 className="text-f-text font-black text-2xl uppercase tracking-tight">Mi perfil</h1>
 </div>

 <div className="px-4 md:px-12 space-y-4">

 {/* TARJETA JUGADOR */}
 <div className={`player-card ${nivel.tier}`}
 style={{ borderTop: `3px solid ${nivel.color}` }}>

 {/* Espacio superior */}
 <div className="mb-5" />

 {/* Avatar */}
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

 {/* Nombre con color del nivel */}
 <p className="text-xl font-black uppercase leading-tight" style={{ color: nivel.color }}>
 {perfil?.nombre || user?.displayName || p.nombre}
 </p>
 <p className="text-f-muted text-sm mt-1">{p.posicion} · {p.ciudad}</p>
 {perfil?.cedula && (
 <p className="text-xs mt-1" style={{ color: '#3a3a3a' }}>CI {formatearCedula(perfil.cedula)}</p>
 )}

 {/* Botón editar perfil */}
 <div className="mt-5">
 <button onClick={() => setModalEditando(true)}
 className="w-full py-2.5 rounded-xl border font-bold text-sm uppercase transition-colors"
 style={{ borderColor: `${nivel.color}40`, color: nivel.color }}>
 Editar perfil
 </button>
 </div>
 </div>

 {/* DEUDA PENDIENTE */}
 {perfil?.deudaPendiente && !perfil?.bloqueado && (
 <div className="bg-yellow-950/60 border border-yellow-700/50 rounded-2xl p-4">
 <p className="text-yellow-400 font-black text-base uppercase">Deuda pendiente</p>
 <p className="text-yellow-300/80 text-sm mt-1">
 Tenés un pago pendiente de un partido anterior. No podés anotarte a nuevos partidos hasta que lo saldes con el organizador.
 </p>
 </div>
 )}

 {/* ALERTA PENALIZACIÓN */}
 {p.bloqueado && (
 <div className="bg-red-950/60 border border-red-800/50 rounded-2xl p-4">
 <p className="text-red-400 font-black text-base uppercase">Cuenta bloqueada</p>
 <p className="text-red-300/80 text-sm mt-1">Cuenta suspendida por incumplimiento reiterado. Contactá al soporte.</p>
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
 {p.advertencia && !p.bloqueado && !penalizado && (
 <div className="bg-yellow-950/50 border border-yellow-800/50 rounded-2xl p-4">
 <p className="text-yellow-400 font-black text-sm uppercase">Primera advertencia</p>
 <p className="text-yellow-300/70 text-xs mt-1">Una falta más y serás suspendido por 1 mes.</p>
 </div>
 )}

 {/* MIS PARTIDOS */}
 <div className="card p-5">
 <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Mis partidos</p>
 {misPartidos.length === 0 ? (
 <p className="text-f-muted text-sm text-center py-4">Todavía no tenés partidos.</p>
 ) : (
 <div className="space-y-0">
 {misPartidos.map(p => {
 const fecha = new Date(p.fechaHora);
 const ahora = new Date();
 const terminado = fecha.getTime() + 90 * 60 * 1000 < ahora.getTime();
 const estadoEfectivo = terminado && !['cancelado','finalizado'].includes(p.estado) ? 'finalizado' : p.estado;
 const estadoConfig = {
 pendiente:  { label: 'Pendiente',  bg: 'bg-yellow-950', border: 'border-yellow-800', text: 'text-yellow-300' },
 confirmado: { label: 'Confirmado', bg: 'bg-green-950',  border: 'border-green-800',  text: 'text-green-300' },
 lleno:      { label: 'Lleno',      bg: 'bg-orange-950', border: 'border-orange-800', text: 'text-orange-300' },
 cancelado:  { label: 'Cancelado',  bg: 'bg-red-950',    border: 'border-red-800',    text: 'text-red-400'   },
 finalizado: { label: 'Finalizado', bg: 'bg-f-surface',  border: 'border-f-border',   text: 'text-f-muted'   },
 }[estadoEfectivo] || { label: estadoEfectivo, bg: 'bg-f-surface', border: 'border-f-border', text: 'text-f-muted' };
 return (
 <button key={p.id}
 onClick={() => onVerDetalle?.(p)}
 className="w-full text-left py-3 border-b last:border-b-0 transition-colors"
 style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
 <div className="flex items-center justify-between gap-2">
 <div className="min-w-0">
 <p className="text-f-text text-sm font-bold leading-tight truncate">{p.nombreCancha}</p>
 <p className="text-f-muted text-xs mt-0.5">
 {fecha.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' })} · {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
 </p>
 </div>
 <div className="flex items-center gap-1.5 flex-shrink-0">
 <span className={`text-xs font-black px-2 py-1 rounded-lg border ${estadoConfig.bg} ${estadoConfig.border} ${estadoConfig.text}`}>
 {estadoConfig.label}
 </span>
 <span className="text-f-muted text-xs">›</span>
 </div>
 </div>
 {p.estado === 'cancelado' && p.motivoRechazo && (
 <p className="text-red-400 text-xs mt-1 leading-snug">
 Motivo: {p.motivoRechazo}
 </p>
 )}
 </button>
 );
 })}
 </div>
 )}
 </div>

 {/* ESTADÍSTICAS */}
 <div className="card p-5">
 <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-4">Estadísticas</p>
 <div className="grid grid-cols-2 gap-3 mb-4">
 <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(84,181,240,0.06)' }}>
 <p className="text-3xl font-black" style={{ color: '#54b5f0' }}>{p.partidosJugados}</p>
 <p className="text-f-muted text-xs font-bold uppercase mt-0.5">Partidos</p>
 </div>
 <div className="text-center p-3 rounded-xl"
 style={{ background: p.noShows > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(84,181,240,0.06)' }}>
 <p className="text-3xl font-black" style={{ color: p.noShows > 0 ? '#f87171' : '#54b5f0' }}>{p.noShows || 0}</p>
 <p className="text-f-muted text-xs font-bold uppercase mt-0.5">No asistió</p>
 </div>
 </div>
 <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
 <p className="text-f-muted text-xs font-bold uppercase">Nivel</p>
 <div className="text-right">
 <p className="font-black text-sm" style={{ color: nivel.color }}>{nivel.titulo}</p>
 <p className="text-f-muted text-xs">
 {nivel.max < 999 ? `Próximo nivel: ${nivel.max + 1} partidos` : 'Nivel máximo'}
 </p>
 </div>
 </div>
 </div>

 {/* REGLAS DE PENALIZACIÓN */}
 <div className="card p-5">
 <p className="text-white font-black text-base uppercase mb-4">Sistema de penalizaciones</p>
 <div className="space-y-3">
 {[
 { texto: 'Cancelás con +1h30m → Sin penalización' },
 { texto: 'Cancelás con −1h30m → Primer aviso (antes de suspensión)' },
 { texto: 'No aparecés sin avisar → Suspensión 7 días' },
 { texto: '2 veces no aparecés → Suspensión 1 mes' },
 { texto: '3 veces no aparecés → Cuenta bloqueada permanentemente' },
 ].map((r, i) => (
 <div key={i}>
 <p className="text-f-text text-sm">{r.texto}</p>
 </div>
 ))}
 </div>
 </div>

 {/* ADMIN */}
 {perfil?.admin && (
 <button onClick={() => setTab('admin')}
 className="w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-colors
 flex items-center justify-center gap-2"
 style={{ border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
 Panel de Administración
 </button>
 )}

 {/* CERRAR SESIÓN */}
 <button onClick={logout}
 className="w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-colors"
 style={{ border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
 Cerrar sesión
 </button>

 <p className="text-center text-f-muted text-xs pb-4">
 Falta 1 — Fútbol · Pádel · Uruguay 
 </p>
 </div>

 {/* Modal editar perfil */}
 {modalEditando && (
 <ModalEditarPerfil
 perfil={perfil}
 user={user}
 nivelColor={nivel.color}
 onClose={() => setModalEditando(false)}
 onGuardado={refrescarPerfil}
 onActualizarLocal={actualizarPerfilLocal}
 />
 )}
 </div>
 );
}
