import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
 suscribirPartidosPendientesCancha,
 suscribirPartidosCancha,
 confirmarReserva,
 rechazarReserva,
 confirmarPagoCancha,
 bloquearHorario,
 desbloquearHorario,
 suscribirHorariosBloqueados,
} from '../firebase/firestore';

const HORARIOS_PANEL = [
 '08:00','09:00','10:00','11:00','12:00',
 '13:00','14:00','15:00','16:00','17:00',
 '18:00','19:00','20:00','21:00','22:00','23:00',
];

// Panel exclusivo para usuarios con rol "cancha"
export default function CanchaPanel() {
 const { perfil, logout } = useAuth();
 const [seccion, setSeccion] = useState('solicitudes');
 const [deporteTab, setDeporteTab] = useState('futbol');
 const [pendientes, setPendientes] = useState([]);
 const [todosPartidos, setTodosPartidos] = useState([]);
 const [motivoRechazo, setMotivoRechazo] = useState({});
 const [procesando, setProcesando] = useState({});
 const [toast, setToast] = useState(null);
 const [horariosBloqueados, setHorariosBloqueados] = useState([]);
 const [fechaBloqueo, setFechaBloqueo] = useState(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
 });
 const [bloqueando, setBloqueando] = useState(null);
 const [diaIdx, setDiaIdx] = useState(0); // 0 = hoy, 1 = mañana, etc.

 const OPCIONES_DIA = Array.from({ length: 7 }, (_, i) => {
 const d = new Date();
 d.setDate(d.getDate() + i);
 d.setHours(0, 0, 0, 0);
 return {
  label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-UY', { weekday: 'short' }).replace('.', ''),
  date: d,
  fechaStr: d.toISOString().split('T')[0],
 };
 });

 const diaSeleccionado = OPCIONES_DIA[diaIdx].date;

 const mostrarToast = (msg, tipo = 'ok') => {
 setToast({ msg, tipo });
 setTimeout(() => setToast(null), 3000);
 };

 // canchaId viene del perfil del usuario de la cancha — .trim() por si tiene espacios en Firestore
 const canchaId = perfil?.canchaId?.trim() || '';
 const nombreCancha = perfil?.nombre || 'Cancha';

 useEffect(() => {
 if (!canchaId) return;
 const unsub1 = suscribirPartidosPendientesCancha(canchaId, setPendientes);
 const unsub2 = suscribirPartidosCancha(canchaId, setTodosPartidos);
 const unsub3 = suscribirHorariosBloqueados(canchaId, setHorariosBloqueados);
 return () => { unsub1(); unsub2(); unsub3(); };
 }, [canchaId]);

 useEffect(() => {
 setFechaBloqueo(OPCIONES_DIA[diaIdx].fechaStr);
 }, [diaIdx]);

 const handleBloquearHorario = async (hora) => {
 setBloqueando(hora);
 try {
 await bloquearHorario(canchaId, fechaBloqueo, hora);
 mostrarToast(`Horario ${hora} bloqueado para ${fechaBloqueo}`);
 } catch {
 mostrarToast('Error al bloquear horario', 'error');
 }
 setBloqueando(null);
 };

 const handleDesbloquearHorario = async (bloqueId, hora) => {
 setBloqueando(hora);
 try {
 await desbloquearHorario(bloqueId);
 mostrarToast(`Horario ${hora} desbloqueado`);
 } catch {
 mostrarToast('Error al desbloquear', 'error');
 }
 setBloqueando(null);
 };

 // Horarios bloqueados para la fecha seleccionada
 const bloqueosDelDia = horariosBloqueados.filter(b => b.fecha === fechaBloqueo);

 // Siempre mostrar tabs de deporte para facilitar el filtrado
 const tieneFutbol = [...pendientes, ...todosPartidos].some(p => p.deporte === 'futbol');
 const tienePadel = [...pendientes, ...todosPartidos].some(p => p.deporte === 'padel');

 // Filtrar por deporte activo
 const pendientesFiltrados = pendientes.filter(p => p.deporte === deporteTab);
 const todosFiltrados = todosPartidos.filter(p => p.deporte === deporteTab);

 const partidos_dia = todosFiltrados.filter(p => {
 const f = new Date(p.fechaHora);
 return f.toDateString() === diaSeleccionado.toDateString() && p.estado === 'confirmado';
 });

 const pendientesDia = pendientesFiltrados.filter(p => {
 const f = new Date(p.fechaHora);
 return f.toDateString() === diaSeleccionado.toDateString();
 });

 const dosHoras = 2 * 60 * 60 * 1000;
 const pagosVencidos = todosFiltrados.filter(p => {
 if (p.pagoCanchaConfirmado) return false;
 if (p.estado === 'cancelado') return false;
 const f = new Date(p.fechaHora);
 return new Date() > new Date(f.getTime() + dosHoras);
 });

 const handleConfirmar = async (partidoId) => {
 setProcesando(prev => ({ ...prev, [partidoId]: 'confirmando' }));
 try {
 await confirmarReserva(partidoId);
 mostrarToast('Reserva confirmada — el partido ya está publicado', 'ok');
 } catch (e) {
 console.error(e);
 mostrarToast('Error al confirmar. Intentá de nuevo.', 'error');
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
 mostrarToast('Error al rechazar. Intentá de nuevo.', 'error');
 }
 setProcesando(prev => ({ ...prev, [partidoId]: null }));
 };

 const handlePagoRecibido = async (partidoId) => {
 setProcesando(prev => ({ ...prev, [partidoId]: 'pago' }));
 try {
 await confirmarPagoCancha(partidoId);
 mostrarToast('Pago registrado correctamente', 'ok');
 } catch (e) {
 console.error(e);
 mostrarToast('Error al registrar pago.', 'error');
 }
 setProcesando(prev => ({ ...prev, [partidoId]: null }));
 };

 // Contadores por deporte (para badges en tabs de deporte)
 const pendientesFutbol = pendientes.filter(p => p.deporte === 'futbol');
 const pendientesPadel = pendientes.filter(p => p.deporte === 'padel');

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

 {/* Selector de día */}
 <div className="mt-5">
  <p className="text-f-muted text-xs font-black uppercase tracking-widest mb-2">Viendo el día</p>
  <div className="flex gap-2 overflow-x-auto pb-1">
  {OPCIONES_DIA.map((op, i) => (
   <button key={i} onClick={() => setDiaIdx(i)}
   className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs uppercase border transition-all text-center
   ${diaIdx === i ? 'text-f-bg' : 'border-f-border text-f-muted'}`}
   style={diaIdx === i
    ? { background: '#0ea5e9', borderColor: '#0ea5e9' }
    : { background: 'rgba(255,255,255,0.03)' }}>
   {op.label}<br />
   <span className="normal-case font-medium">
    {op.date.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
   </span>
   </button>
  ))}
  </div>
 </div>

 {/* Tabs de deporte */}
 <div className="flex gap-2 mt-5 mb-1">
 {[
 { id: 'futbol', icon: '', label: 'Fútbol', badge: pendientesFutbol.length },
 { id: 'padel', icon: '', label: 'Pádel', badge: pendientesPadel.length },
 ].map(t => (
 <button key={t.id} onClick={() => { setDeporteTab(t.id); setSeccion('solicitudes'); }}
 className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase border transition-all
 ${deporteTab === t.id
 ? 'text-f-bg border-transparent'
 : 'border-f-border text-f-muted'}`}
 style={deporteTab === t.id ? { background: t.id === 'futbol' ? '#0ea5e9' : '#22c55e' } : {}}>
 <span className="text-base">{t.icon}</span>
 {t.label}
 {t.badge > 0 && (
 <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
 {t.badge}
 </span>
 )}
 </button>
 ))}
 </div>

 {/* Alerta pagos vencidos */}
 {pagosVencidos.length > 0 && (
 <div className="mt-4 rounded-2xl px-4 py-3"
 style={{ background: 'rgba(194,65,12,0.2)', border: '1px solid rgba(234,88,12,0.4)' }}>
 <p className="text-orange-400 font-black text-sm uppercase">
 {pagosVencidos.length} pago{pagosVencidos.length !== 1 ? 's' : ''} sin confirmar
 {` — ${deporteTab === 'futbol' ? 'Fútbol' : 'Pádel'}`}
 </p>
 <p className="text-orange-300/70 text-xs mt-0.5">
 Hay partidos de hace más de 2 horas con pago pendiente. El organizador debería haber pagado en caja.
 </p>
 </div>
 )}

 {/* Tabs de sección */}
 <div className="flex gap-2 mt-5 flex-wrap">
 {[
 { id: 'solicitudes', label: 'Solicitudes', badge: pendientesDia.length },
 { id: 'hoy', label: OPCIONES_DIA[diaIdx].label, badge: partidos_dia.length },
 { id: 'todos', label: 'Todos', badge: pagosVencidos.length || null },
 { id: 'horarios', label: 'Bloquear horarios', badge: null },
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

 {/* SOLICITUDES PENDIENTES */}
 {seccion === 'solicitudes' && (
 <div className="space-y-4">
 <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-4">
 {pendientesDia.length === 0
 ? `Sin solicitudes para ${OPCIONES_DIA[diaIdx].label.toLowerCase()}`
 : `${pendientesDia.length} solicitud${pendientesDia.length !== 1 ? 'es' : ''} pendiente${pendientesDia.length !== 1 ? 's' : ''}`}
 <span className="ml-2 opacity-60">· {deporteTab === 'futbol' ? 'Fútbol' : 'Pádel'} · {OPCIONES_DIA[diaIdx].label}</span>
 </p>

 {pendientesDia.length === 0 ? (
 <div className="flex flex-col items-center py-20 text-center">

 <p className="text-f-text text-xl font-black uppercase">Todo al día</p>
 <p className="text-f-muted text-sm mt-1">No hay solicitudes de reserva para este día</p>
 </div>
 ) : pendientesDia.map(p => {
 const fecha = new Date(p.fechaHora);
 const estado = procesando[p.id];
 const deporte = p.deporte === 'padel' ? '' : '';
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
 Pendiente
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
 {estado === 'confirmando' ? '...' : ' Confirmar'}
 </button>
 <button
 onClick={() => handleRechazar(p.id)}
 disabled={!!estado}
 className="flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all active:scale-95 disabled:opacity-50 border border-red-700 text-red-400">
 {estado === 'rechazando' ? '...' : ' Rechazar'}
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* PARTIDOS DE HOY */}
 {seccion === 'hoy' && (
 <div className="space-y-4">
 <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-4">
 {partidos_dia.length === 0
 ? `Sin partidos el ${OPCIONES_DIA[diaIdx].label.toLowerCase()}`
 : `${partidos_dia.length} partido${partidos_dia.length !== 1 ? 's' : ''} el ${OPCIONES_DIA[diaIdx].label.toLowerCase()}`}
 <span className="ml-2 opacity-60">· {deporteTab === 'futbol' ? 'Fútbol' : 'Pádel'}</span>
 </p>

 {partidos_dia.length === 0 ? (
 <div className="flex flex-col items-center py-20 text-center">

 <p className="text-f-text text-xl font-black uppercase">Sin partidos</p>
 </div>
 ) : partidos_dia.map(p => {
 const fecha = new Date(p.fechaHora);
 const ahora = new Date();
 const yaTermino = ahora > new Date(fecha.getTime() + 90 * 60 * 1000);
 const estado = procesando[p.id];
 const deporte = p.deporte === 'padel' ? '' : '';
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
 Pago confirmado
 </span>
 ) : (
 <span className="bg-yellow-950 border border-yellow-800 text-yellow-300 text-xs font-black px-2.5 py-1 rounded-lg">
 Pago pendiente
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
 {estado === 'pago' ? '...' : ' PAGO RECIBIDO EN CAJA'}
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
 Confirmaste que recibiste el pago completo
 </p>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* TODOS LOS PARTIDOS */}
 {seccion === 'todos' && (
 <div className="space-y-3">
 <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-4">
 {todosFiltrados.length} partido{todosFiltrados.length !== 1 ? 's' : ''} en total
 <span className="ml-2 opacity-60">· {deporteTab === 'futbol' ? 'Fútbol' : 'Pádel'}</span>
 </p>
 {todosFiltrados.length === 0 ? (
 <div className="flex flex-col items-center py-20 text-center">

 <p className="text-f-text text-xl font-black uppercase">Sin partidos</p>
 </div>
 ) : todosFiltrados.map(p => {
 const fecha = new Date(p.fechaHora);
 const deporte = p.deporte === 'padel' ? '' : '';
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
 <span className="text-xs text-green-400">Pagado</span>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* BLOQUEAR HORARIOS */}
 {seccion === 'horarios' && (
 <div>
 <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-4">
 Bloquear horarios manualmente
 </p>
 <div className="bg-f-card border border-f-border rounded-2xl p-4 mb-5">
 <p className="text-f-muted text-xs leading-relaxed">
 Usá esto para bloquear horarios que ya tienen reservas externas que no pasaron por la app. Los horarios bloqueados no aparecen como disponibles para los jugadores.
 </p>
 </div>

 {/* Selector de fecha */}
 <div className="mb-5">
 <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-2">
 Fecha
 </label>
 <input
 type="date"
 value={fechaBloqueo}
 onChange={e => setFechaBloqueo(e.target.value)}
 className="bg-f-bg border border-f-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-f-accent transition-colors"
 />
 </div>

 {/* Grilla de horarios */}
 <p className="text-f-muted text-xs font-bold uppercase tracking-wider mb-3">
 Horarios del {fechaBloqueo} — tocá para bloquear/desbloquear
 </p>
 <div className="grid grid-cols-4 gap-2">
 {HORARIOS_PANEL.map(hora => {
 const bloqueo = bloqueosDelDia.find(b => b.hora === hora);
 const estaBloqueado = !!bloqueo;
 const procesando = bloqueando === hora;
 return (
 <button
 key={hora}
 onClick={() => estaBloqueado
 ? handleDesbloquearHorario(bloqueo.id, hora)
 : handleBloquearHorario(hora)
 }
 disabled={procesando}
 className="py-2.5 rounded-xl font-bold text-sm border transition-all active:scale-95 disabled:opacity-50"
 style={estaBloqueado
 ? { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)', color: '#f87171' }
 : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#5a5a5a' }}>
 {procesando ? '...' : hora}
 {estaBloqueado && <div className="text-xs font-black mt-0.5"></div>}
 </button>
 );
 })}
 </div>

 {bloqueosDelDia.length > 0 && (
 <div className="mt-4 bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-3">
 <p className="text-red-400 text-xs font-black uppercase mb-1">
 {bloqueosDelDia.length} horario{bloqueosDelDia.length !== 1 ? 's' : ''} bloqueado{bloqueosDelDia.length !== 1 ? 's' : ''} el {fechaBloqueo}
 </p>
 <p className="text-red-300/60 text-xs">
 {bloqueosDelDia.map(b => b.hora).join(' · ')}
 </p>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
