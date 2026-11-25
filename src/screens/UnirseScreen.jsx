import { useState, useEffect } from 'react';
import { suscribirPartidos, anotarseAPartido, desanotarseDePartido, aceptarDesafioRival } from '../firebase/firestore';
import { PARTIDOS_DEMO } from '../data/partidos';
import { BARRIOS_POR_CIUDAD, CIUDADES } from '../data/canchas';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../modals/ChatModal';

export default function UnirseScreen({ onVerDetalle }) {
 const { user, perfil } = useAuth();
 const [partidos, setPartidos] = useState([]);
 const [vista, setVista] = useState('elegir'); // 'elegir' | 'unirme' | 'buscoRival'
 const [deporte, setDeporte] = useState('todos');
 const [ciudad, setCiudad] = useState('Todas');
 const [barrio, setBarrio] = useState('Todos');
 const [cargando, setCargando] = useState(true);
 const [chatPartido, setChatPartido] = useState(null);
 const [fechaFiltro, setFechaFiltro] = useState(null); // null = todos los días

 const estaBaneado = perfil?.bloqueado
 || (perfil?.penalizacionHasta && new Date(perfil.penalizacionHasta) > new Date())
 || perfil?.deudaPendiente;
 const nivelFutbolUsuario = perfil?.nivelFutbol || 'Intermedio';

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

 const OPCIONES_FECHA = Array.from({ length: 7 }, (_, i) => {
 const d = new Date();
 d.setDate(d.getDate() + i);
 d.setHours(0, 0, 0, 0);
 return {
  label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-UY', { weekday: 'short' }).replace('.', ''),
  date: d,
 };
 });

 const handleCambiarVista = (v) => {
 setVista(v);
 setDeporte('todos');
 setCiudad('Todas');
 setBarrio('Todos');
 setFechaFiltro(null);
 };

 const handleCiudadChange = (c) => {
 setCiudad(c);
 setBarrio('Todos');
 };

 const barriosActuales = ciudad === 'Montevideo' ? (BARRIOS_POR_CIUDAD['Montevideo'] || []) : [];

 const filtrados = partidos.filter(p => {
 if (vista === 'unirme' && p.modoBuscoRival) return false;
 if (vista === 'buscoRival' && !p.modoBuscoRival) return false;
 if (deporte === 'futbol' && p.deporte !== 'futbol') return false;
 if (deporte === 'padel' && p.deporte !== 'padel') return false;
 if (ciudad !== 'Todas') {
 if (ciudad === 'Flores') {
 if (p.ciudad !== 'Flores') return false;
 } else {
 const barrios = BARRIOS_POR_CIUDAD[ciudad] || [];
 if (!barrios.includes(p.barrio) && p.ciudad !== ciudad) return false;
 }
 }
 if (barrio !== 'Todos' && p.barrio !== barrio) return false;
 if (fechaFiltro !== null) {
 const diaFiltro = OPCIONES_FECHA[fechaFiltro].date;
 const diaPartido = new Date(p.fechaHora);
 if (diaPartido.toDateString() !== diaFiltro.toDateString()) return false;
 }
 return true;
 });

 const deportesBtns = [
 { id: 'todos', label: 'Todos' },
 { id: 'futbol', label: 'Fútbol' },
 { id: 'padel', label: 'Pádel' },
 ];

 // ── Vista "elegir" ──
 if (vista === 'elegir') {
 return (
 <div className="min-h-svh bg-f-bg">
 <div className="px-5 md:px-12 pt-12 pb-5 border-b border-f-border" style={{ background: '#111' }}>
 <h1 className="text-white font-black text-3xl uppercase leading-tight">
 Unirme a un<br />
 <span style={{ color: '#0ea5e9' }}>partido</span>
 </h1>
 <p className="text-f-muted text-sm mt-1">¿Qué querés hacer?</p>
 </div>
 <div className="px-5 md:px-12 pt-8 flex flex-col gap-4">
 <button
 onClick={() => handleCambiarVista('unirme')}
 className="w-full py-6 rounded-2xl font-black uppercase text-white text-left px-6 transition-all active:scale-95"
 style={{ background: '#0ea5e9', boxShadow: '0 4px 20px rgba(14,165,233,0.35)' }}>
 <p className="text-2xl mb-1">Unirme a un partido</p>
 <p className="text-sm font-medium normal-case opacity-80">Encontrá partidos abiertos y anotate</p>
 </button>
 <button
 onClick={() => handleCambiarVista('buscoRival')}
 className="w-full py-6 rounded-2xl font-black uppercase text-left px-6 transition-all active:scale-95"
 style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', boxShadow: '0 4px 20px rgba(124,58,237,0.15)' }}>
 <p className="text-2xl mb-1">Busco rival</p>
 <p className="text-sm font-medium normal-case opacity-80">Equipos completos que buscan equipo rival</p>
 </button>
 </div>
 {chatPartido && <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />}
 </div>
 );
 }

 // ── Vista "buscoRival" ──
 if (vista === 'buscoRival') {
 return (
 <div className="min-h-svh bg-f-bg">
 <div className="px-5 md:px-12 pt-12 pb-5 border-b border-f-border" style={{ background: '#111' }}>
 <button onClick={() => handleCambiarVista('elegir')}
 className="flex items-center gap-2 text-f-muted text-sm font-bold mb-4 active:opacity-70">
 <span>←</span> Volver
 </button>
 <h1 className="text-white font-black text-3xl uppercase leading-tight">
 Busco<br />
 <span style={{ color: '#a78bfa' }}>rival</span>
 </h1>
 <p className="text-f-muted text-sm mt-1">Equipos completos que buscan rival</p>
 </div>

 <div className="px-5 md:px-12 py-5 border-b border-f-border">
 <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-3">Deporte</p>
 <div className="flex gap-2">
 {deportesBtns.map(d => (
 <button key={d.id} onClick={() => setDeporte(d.id)}
 className="flex-1 py-3 rounded-xl font-black text-sm uppercase border transition-all active:scale-95"
 style={deporte === d.id
 ? { background: '#7c3aed', borderColor: '#7c3aed', color: '#fff' }
 : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#5a5a5a' }}>
 {d.label}
 </button>
 ))}
 </div>
 <p className="text-f-muted text-xs mt-3 leading-snug">
 Para aceptar un desafío necesitás tener tu equipo completo listo.
 </p>
 </div>

 <div className="px-5 md:px-12 py-4 border-b border-f-border">
 <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-3">¿Qué día?</p>
 <div className="flex gap-2 overflow-x-auto pb-1">
 <button onClick={() => setFechaFiltro(null)}
  className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm uppercase border transition-all
  ${fechaFiltro === null
  ? 'text-white'
  : 'border-f-border text-f-muted'}`}
  style={fechaFiltro === null
  ? { background: '#7c3aed', borderColor: '#7c3aed' }
  : { background: 'rgba(255,255,255,0.03)' }}>
  Todos
 </button>
 {OPCIONES_FECHA.map((op, i) => (
  <button key={i} onClick={() => setFechaFiltro(i)}
  className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm uppercase border transition-all text-center
  ${fechaFiltro === i
  ? 'text-white'
  : 'border-f-border text-f-muted'}`}
  style={fechaFiltro === i
  ? { background: '#7c3aed', borderColor: '#7c3aed' }
  : { background: 'rgba(255,255,255,0.03)' }}>
  {op.label}<br />
  <span className="text-xs font-medium normal-case">
   {op.date.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
  </span>
  </button>
 ))}
 </div>
 </div>

 <div className="px-4 md:px-12 py-5">
 {cargando ? (
 <div className="space-y-3">
 {[1,2,3].map(i => <div key={i} className="card h-36 animate-pulse" />)}
 </div>
 ) : filtrados.length === 0 ? (
 <div className="flex flex-col items-center py-20 text-center">
 <p className="text-f-text text-xl font-black uppercase">Sin equipos</p>
 <p className="text-f-muted text-sm mt-1">No hay equipos buscando rival ahora</p>
 </div>
 ) : (
 <>
 <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-4">
 {filtrados.length} equipo{filtrados.length !== 1 ? 's' : ''} buscando rival
 </p>
 <div className="space-y-3">
 {filtrados.map(p => (
 <MiniCard key={p.id} partido={p}
 uid={user?.uid}
 nombreUsuario={perfil?.nombre || user?.displayName || ''}
 baneado={estaBaneado}
 nivelFutbolUsuario={nivelFutbolUsuario}
 onChat={() => setChatPartido(p)}
 onVerDetalle={() => onVerDetalle?.(p)} />
 ))}
 </div>
 </>
 )}
 </div>

 {chatPartido && <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />}
 </div>
 );
 }

 // ── Vista "unirme" ──
 return (
 <div className="min-h-svh bg-f-bg">

 <div className="px-5 md:px-12 pt-12 pb-5 border-b border-f-border" style={{ background: '#111' }}>
 <button onClick={() => handleCambiarVista('elegir')}
 className="flex items-center gap-2 text-f-muted text-sm font-bold mb-4 active:opacity-70">
 <span>←</span> Volver
 </button>
 <h1 className="text-white font-black text-3xl uppercase leading-tight">
 Unirme a un<br />
 <span style={{ color: '#0ea5e9' }}>partido</span>
 </h1>
 <p className="text-f-muted text-sm mt-1">Elegí deporte, ciudad y zona, y anotate</p>
 </div>

 <div className="px-5 md:px-12 py-5 border-b border-f-border">
 <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-3">¿Qué querés jugar?</p>
 <div className="flex gap-2 flex-wrap">
 {deportesBtns.map(d => (
 <button key={d.id} onClick={() => setDeporte(d.id)}
 className="flex-1 py-3 rounded-xl font-black text-sm uppercase border transition-all active:scale-95"
 style={deporte === d.id
 ? { background: '#0ea5e9', borderColor: '#0ea5e9', color: '#fff' }
 : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#5a5a5a' }}>
 {d.label}
 </button>
 ))}
 </div>
 </div>

 <div className="px-5 md:px-12 py-4 border-b border-f-border">
 <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-3">¿Qué día?</p>
 <div className="flex gap-2 overflow-x-auto pb-1">
 <button onClick={() => setFechaFiltro(null)}
  className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm uppercase border transition-all
  ${fechaFiltro === null
  ? 'bg-f-green border-f-green text-white'
  : 'border-f-border text-f-muted'}`}
  style={fechaFiltro !== null ? { background: 'rgba(255,255,255,0.03)' } : {}}>
  Todos
 </button>
 {OPCIONES_FECHA.map((op, i) => (
  <button key={i} onClick={() => setFechaFiltro(i)}
  className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm uppercase border transition-all text-center
  ${fechaFiltro === i
  ? 'bg-f-green border-f-green text-white'
  : 'border-f-border text-f-muted'}`}
  style={fechaFiltro !== i ? { background: 'rgba(255,255,255,0.03)' } : {}}>
  {op.label}<br />
  <span className="text-xs font-medium normal-case">
   {op.date.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
  </span>
  </button>
 ))}
 </div>
 </div>

 <div className="px-5 md:px-12 py-5 border-b border-f-border">
 <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-3">¿En qué ciudad?</p>
 <div className="flex gap-3">
 {[
 { id: 'Todas', label: 'Todas' },
 { id: 'Montevideo', label: 'Montevideo' },
 { id: 'Flores', label: 'Flores' },
 ].map(c => (
 <button key={c.id} onClick={() => handleCiudadChange(c.id)}
 className="flex-1 py-4 rounded-2xl font-black text-base uppercase border transition-all active:scale-95"
 style={ciudad === c.id
 ? { background: '#0ea5e9', borderColor: '#0ea5e9', color: '#0c0c0c' }
 : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#5a5a5a' }}>
 {c.label}
 </button>
 ))}
 </div>
 </div>

 {ciudad === 'Montevideo' && (
 <div className="border-b border-f-border">
 <div className="flex gap-1 overflow-x-auto hide-scrollbar px-4 py-2.5">
 {['Todos', ...barriosActuales].map(b => (
 <button key={b} onClick={() => setBarrio(b)}
 className={`flex-shrink-0 px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wide transition-all
 ${barrio === b ? 'bg-white/10 text-white' : 'text-f-muted'}`}>
 {b}
 </button>
 ))}
 </div>
 </div>
 )}

 <div className="px-4 md:px-12 py-5">
 {cargando ? (
 <div className="space-y-3">
 {[1,2,3].map(i => <div key={i} className="card h-36 animate-pulse" />)}
 </div>
 ) : filtrados.length === 0 ? (
 <div className="flex flex-col items-center py-20 text-center">
 <p className="text-f-text text-xl font-black uppercase">Sin partidos</p>
 <p className="text-f-muted text-sm mt-1">Probá cambiando el deporte, ciudad o zona</p>
 </div>
 ) : ciudad === 'Todas' ? (
 <>
 {['Montevideo', 'Flores'].map(c => {
 const barrosCiudad = BARRIOS_POR_CIUDAD[c] || [];
 const partidosCiudad = filtrados.filter(p =>
 barrosCiudad.includes(p.barrio) || p.ciudad === c
 );
 if (partidosCiudad.length === 0) return null;
 return (
 <div key={c} className="mb-8">
 <div className="flex items-center gap-2 mb-3">
 <p className="text-f-muted text-xs font-black uppercase tracking-widest">{c === 'Flores' ? 'Flores — Trinidad' : c}</p>
 <span className="text-f-muted text-xs">· {partidosCiudad.length} partido{partidosCiudad.length !== 1 ? 's' : ''}</span>
 </div>
 <div className="space-y-3">
 {partidosCiudad.map(p => (
 <MiniCard key={p.id} partido={p}
 uid={user?.uid}
 nombreUsuario={perfil?.nombre || user?.displayName || ''}
 baneado={estaBaneado}
 nivelFutbolUsuario={nivelFutbolUsuario}
 onChat={() => setChatPartido(p)}
 onVerDetalle={() => onVerDetalle?.(p)} />
 ))}
 </div>
 </div>
 );
 })}
 </>
 ) : (
 <>
 <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-4">
 {filtrados.length} partido{filtrados.length !== 1 ? 's' : ''} disponible{filtrados.length !== 1 ? 's' : ''}
 </p>
 <div className="space-y-3">
 {filtrados.map(p => (
 <MiniCard key={p.id} partido={p}
 uid={user?.uid}
 nombreUsuario={perfil?.nombre || user?.displayName || ''}
 baneado={estaBaneado}
 nivelFutbolUsuario={nivelFutbolUsuario}
 onChat={() => setChatPartido(p)}
 onVerDetalle={() => onVerDetalle?.(p)} />
 ))}
 </div>
 </>
 )}
 </div>

 {chatPartido && (
 <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />
 )}
 </div>
 );
}

function MiniCard({ partido, uid, nombreUsuario, baneado, nivelFutbolUsuario, onChat, onVerDetalle }) {
 const jugadores = partido.jugadores || [];
 const estaAnotado = uid && jugadores.includes(uid);
 const anotados = partido.jugadoresAnotados ?? 0;
 const cupo = partido.cupoTotal ?? 10;
 const libres = cupo - anotados;
 const lleno = libres <= 0;
 const pct = Math.min(100, Math.round((anotados / cupo) * 100));
 const [accion, setAccion] = useState(null);
 const [confirmarEquipo, setConfirmarEquipo] = useState(false);

 // Busco rival
 const esBuscoRival = partido.modoBuscoRival === true;
 const rivalEncontrado = esBuscoRival && !!partido.organizador2;
 const esOrganizador1 = uid && uid === partido.creadoPor;
 const jugadoresRequeridos = partido.modalidad === 'Pádel' ? 2 : partido.modalidad === 'F7' ? 7 : 5;

 const fecha = new Date(partido.fechaHora);
 const hoy = new Date();
 const diaLabel = fecha.toDateString() === hoy.toDateString() ? 'HOY'
 : fecha.toDateString() === new Date(Date.now()+86400000).toDateString() ? 'MÑN'
 : fecha.toLocaleDateString('es-UY', { weekday:'short', day:'numeric', month:'short' }).toUpperCase();
 const hora = fecha.toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' });
 const barColor = esBuscoRival
 ? (rivalEncontrado ? '#22c55e' : '#a855f7')
 : (lleno ? '#ef4444' : pct >= 75 ? '#f97316' : '#0ea5e9');

 const handleAnotarse = async () => {
 if (!uid || accion) return;
 setAccion('anotando');
 try { await anotarseAPartido(partido.id, uid); }
 catch {}
 setAccion(null);
 };
 const handleSalirse = async () => {
 if (!uid || accion) return;
 setAccion('saliendo');
 try { await desanotarseDePartido(partido.id, uid); }
 catch {}
 setAccion(null);
 };
 const handleAceptarDesafio = async () => {
 if (!uid || accion) return;
 setAccion('aceptando');
 try { await aceptarDesafioRival(partido.id, uid, nombreUsuario || 'Rival'); }
 catch {}
 setAccion(null);
 };

 const handleClickAceptar = () => {
 if (baneado || accion) return;
 setConfirmarEquipo(true);
 };

 return (
 <>
 {/* Modal confirmación equipo completo */}
 {confirmarEquipo && (
 <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
 style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
 <div className="bg-f-card border border-f-border rounded-2xl p-6 w-full max-w-sm">
 <h3 className="text-white font-black text-lg uppercase mb-3">Confirmar equipo</h3>
 <p className="text-f-muted text-sm leading-relaxed mb-2">
 Para aceptar este desafío necesitás exactamente <span className="text-white font-black">{jugadoresRequeridos} jugadores</span> en tu equipo.
 </p>
 <p className="text-f-muted text-sm mb-6">¿Tenés tu equipo completo?</p>
 <div className="flex gap-3">
 <button onClick={() => setConfirmarEquipo(false)}
 className="flex-1 py-3 rounded-xl border border-f-border text-f-muted font-bold text-sm uppercase">
 Cancelar
 </button>
 <button
 onClick={() => { setConfirmarEquipo(false); handleAceptarDesafio(); }}
 className="flex-1 py-3 rounded-xl font-black text-sm uppercase text-white"
 style={{ background: '#7c3aed' }}>
 Sí, somos {jugadoresRequeridos}
 </button>
 </div>
 </div>
 </div>
 )}
 <div className="rounded-2xl overflow-hidden"
 style={{
 background: '#141414',
 border: esBuscoRival
 ? (rivalEncontrado ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(168,85,247,0.3)')
 : (estaAnotado ? '1px solid rgba(14,165,233,0.3)' : '1px solid #222'),
 }}>
 <div className="flex">
 <div className="w-1 flex-shrink-0" style={{ background: barColor }} />
 <div className="flex-1 p-4">

 {/* Fila 1 */}
 <div className="flex items-start justify-between gap-2 mb-3">
 <div className="flex items-center gap-2.5 min-w-0">
 <span className="text-xl flex-shrink-0">
 {esBuscoRival ? '' : (partido.deporte === 'padel' ? '' : '')}
 </span>
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <p className="text-white font-black text-sm leading-tight truncate">{partido.nombreCancha}</p>
 {esBuscoRival && (
 <span className="flex-shrink-0 text-xs font-black px-1.5 py-0.5 rounded"
 style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
 BUSCO RIVAL
 </span>
 )}
 </div>
 <p className="text-f-muted text-xs">{partido.barrio} · {diaLabel} {hora}hs</p>
 {/* Nivel de juego */}
 {partido.nivel && partido.deporte !== 'padel' && !esBuscoRival && (
 <div className="mt-1">
 <span className="text-xs font-bold px-1.5 py-0.5 rounded"
 style={{
 background: partido.nivel === 'Principiante' ? 'rgba(34,197,94,0.15)'
 : partido.nivel === 'Intermedio' ? 'rgba(245,158,11,0.15)'
 : 'rgba(239,68,68,0.15)',
 color: partido.nivel === 'Principiante' ? '#22c55e'
 : partido.nivel === 'Intermedio' ? '#f59e0b'
 : '#ef4444',
 }}>
 {partido.nivel}
 </span>
 {nivelFutbolUsuario && nivelFutbolUsuario !== partido.nivel && (
 <span className="text-xs text-f-muted ml-2">
 (tu nivel: {nivelFutbolUsuario})
 </span>
 )}
 </div>
 )}
 </div>
 </div>
 <button onClick={onVerDetalle}
 className="text-f-muted text-xs px-2 py-1 rounded-lg flex-shrink-0 active:scale-95"
 style={{ background: 'rgba(255,255,255,0.05)' }}>
 ···
 </button>
 </div>

 {/* Barra jugadores o estado busco rival */}
 {esBuscoRival ? (
 <div className="mb-3 px-3 py-2 rounded-xl"
 style={{ background: 'rgba(168,85,247,0.08)' }}>
 <p className="text-xs font-black" style={{ color: '#c084fc' }}>
 {rivalEncontrado ? 'Rival encontrado' : 'Equipo completo — buscando rival'}
 </p>
 </div>
 ) : (
 <div className="mb-3">
 <div className="flex justify-between text-xs mb-1">
 <span className="text-f-muted">{anotados}/{cupo} jugadores</span>
 <span className="font-black" style={{ color: barColor }}>
 {lleno ? 'LLENO' : `${libres} libre${libres !== 1 ? 's' : ''}`}
 </span>
 </div>
 <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#222' }}>
 <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
 </div>
 </div>
 )}

 {/* Precio + botón */}
 <div className="flex items-center justify-between">
 <div>
 <span className="font-black text-lg" style={{ color: '#54b5f0' }}>
 ${partido.precioPorJugador?.toLocaleString('es-UY') ?? '0'}
 </span>
 <span className="text-f-muted text-xs"> /jug</span>
 </div>
 <div className="flex gap-2">
 {estaAnotado && !esBuscoRival && (
 <>
 <button onClick={onChat}
 className="w-9 h-9 rounded-xl flex items-center justify-center text-sm active:scale-95"
 style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(84,181,240,0.15)', color: '#54b5f0' }}>

 </button>
 <button
 onClick={async () => {
 const url = `${window.location.origin}/?partido=${partido.id}`;
 const text = `¡Unite al partido! ${partido.nombreCancha} — ${diaLabel} a las ${hora}hs`;
 if (navigator.share) {
 try { await navigator.share({ title: 'Falta 1', text, url }); } catch (_) {}
 } else {
 try { await navigator.clipboard.writeText(url); } catch (_) {}
 }
 }}
 className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95"
 style={{ background: 'rgba(84,181,240,0.08)', border: '1px solid rgba(84,181,240,0.15)', color: '#54b5f0' }}>
 <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
 <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
 </svg>
 </button>
 </>
 )}
 {esBuscoRival ? (
 rivalEncontrado || esOrganizador1 ? (
 <span className="px-4 h-9 rounded-xl font-black text-xs uppercase flex items-center"
 style={{ background: '#1c1c1c', color: '#5a5a5a', border: '1px solid #2a2a2a' }}>
 {rivalEncontrado ? ' RIVAL OK' : 'TU DESAFÍO'}
 </span>
 ) : (
 <button onClick={handleClickAceptar}
 disabled={baneado || accion === 'aceptando'}
 className="px-4 h-9 rounded-xl font-black text-xs uppercase active:scale-95 disabled:opacity-50"
 style={baneado
 ? { background: '#1c1c1c', color: '#5a5a5a', border: '1px solid #2a2a2a' }
 : { background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.4)' }}>
 {accion === 'aceptando' ? '...' : baneado ? 'SUSP.' : 'ACEPTO'}
 </button>
 )
 ) : estaAnotado ? (
 <button onClick={handleSalirse} disabled={accion === 'saliendo'}
 className="px-4 h-9 rounded-xl font-black text-xs uppercase active:scale-95 disabled:opacity-50"
 style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
 {accion === 'saliendo' ? '...' : 'Salirme'}
 </button>
 ) : (
 <button onClick={handleAnotarse}
 disabled={lleno || baneado || accion === 'anotando'}
 className="px-5 h-9 rounded-xl font-black text-sm uppercase active:scale-95 disabled:opacity-50"
 style={lleno || baneado
 ? { background: '#1c1c1c', color: '#5a5a5a', border: '1px solid #2a2a2a' }
 : { background: '#0ea5e9', color: '#fff', boxShadow: '0 4px 16px rgba(14,165,233,0.35)' }}>
 {accion === 'anotando' ? '...' : lleno ? 'LLENO' : baneado ? 'SUSP.' : '¡ME ANOTO!'}
 </button>
 )}
 </div>
 </div>

 </div>
 </div>
 </div>
 </>
 );
}
