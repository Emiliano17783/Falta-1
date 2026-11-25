import { useState, useEffect } from 'react';
import { crearPartido, crearPartidoBuscoRival, suscribirHorariosOcupados, suscribirPartido } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { CANCHAS_FUTBOL, CANCHAS_PADEL, CIUDADES } from '../data/canchas';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];
const HORARIOS = [
 '08:00', '09:00', '10:00', '11:00', '12:00',
 '13:00', '14:00', '15:00', '16:00', '17:00',
 '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

const nivelColor = {
 Principiante: '#22c55e',
 Intermedio: '#f59e0b',
 Avanzado: '#ef4444',
};

export default function CrearScreen({ canchaPreseleccionada, setTab }) {
 const { user, perfil } = useAuth();

 // Sport selection
 const [modo, setModo] = useState('abierto');
 const [deporte, setDeporte] = useState(
 canchaPreseleccionada?.deporte === 'padel' ? 'padel' : 'futbol'
 );
 const [modalidad, setModalidad] = useState('F5');
 const [nivel, setNivel] = useState('Intermedio');
 const [ciudad, setCiudad] = useState(perfil?.ciudad || 'Montevideo');
 const [fecha, setFecha] = useState(0);
 const [horario, setHorario] = useState('20:00');
 const [canchaId, setCanchaId] = useState(canchaPreseleccionada?.id || '');
 const [llamadaConfirmada, setLlamadaConfirmada] = useState(!!canchaPreseleccionada);
 const [paso, setPaso] = useState('form');
 const [errorMsg, setErrorMsg] = useState('');
 const [mostrarCanchas, setMostrarCanchas] = useState(false);
 const [horariosOcupados, setHorariosOcupados] = useState([]);
 const [partidoIdCreado, setPartidoIdCreado] = useState(null);
 const [estadoCreado, setEstadoCreado] = useState('pendiente');

 useEffect(() => {
 if (!partidoIdCreado) return;
 const unsub = suscribirPartido(partidoIdCreado, (p) => {
 if (p?.estado) setEstadoCreado(p.estado);
 });
 return () => unsub();
 }, [partidoIdCreado]);

 const OPCIONES_FECHA = Array.from({ length: 30 }, (_, i) => {
 const d = new Date();
 d.setDate(d.getDate() + i);
 d.setHours(0, 0, 0, 0);
 return {
  label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-UY', { weekday: 'short' }).replace('.', ''),
  date: d,
 };
 });

 const canchasList = deporte === 'padel' ? CANCHAS_PADEL : CANCHAS_FUTBOL;
 const canchasDisponibles = deporte === 'futbol'
 ? canchasList.filter(c => c.modalidades.includes(modalidad))
 : canchasList;

 const cupoTotal = deporte === 'padel' ? 4 : modalidad === 'F5' ? 10 : 14;
 const modalidadFinal = deporte === 'padel' ? 'Pádel' : modalidad;
 const fechaDate = OPCIONES_FECHA[fecha].date;

 // Solo mostrar horarios con al menos 1 hora de anticipación (para hoy)
 const horariosDisponibles = HORARIOS.filter(h => {
 if (fecha !== 0) return true;
 const [hh, mm] = h.split(':').map(Number);
 const horaPartido = new Date();
 horaPartido.setHours(hh, mm, 0, 0);
 return horaPartido.getTime() - new Date().getTime() >= 60 * 60 * 1000;
 });

 const getFechaReal = () => {
 const base = OPCIONES_FECHA[fecha].date;
 const [h, m] = horario.split(':');
 const d = new Date(base);
 d.setHours(Number(h), Number(m), 0, 0);
 return d.toISOString();
 };

 const canchaSelec = canchasList.find(c => c.id === canchaId);

 // Precio auto-calculado desde los datos de la cancha
 const precioTotalCancha = canchaSelec?.precioPorHora || 0;
 const precioPorJugador = precioTotalCancha > 0 ? Math.ceil(precioTotalCancha / cupoTotal) : 0;

 // Cuando cambia deporte, resetear la cancha si no coincide
 useEffect(() => {
 if (canchaId) {
 const listaActual = deporte === 'padel' ? CANCHAS_PADEL : CANCHAS_FUTBOL;
 if (!listaActual.find(c => c.id === canchaId)) {
 setCanchaId('');
 setLlamadaConfirmada(false);
 setHorariosOcupados([]);
 }
 }
 }, [deporte]);

 // Suscripción en tiempo real a horarios ocupados (partidos activos + bloqueados por cancha)
 useEffect(() => {
 if (!canchaId || !llamadaConfirmada) { setHorariosOcupados([]); return; }
 const unsub = suscribirHorariosOcupados(canchaId, fechaDate, setHorariosOcupados);
 return () => unsub();
 }, [canchaId, fecha, llamadaConfirmada]);

 // Si el horario seleccionado queda ocupado o ya pasó (hoy), resetear
 useEffect(() => {
 if (horariosOcupados.includes(horario) || !horariosDisponibles.includes(horario)) setHorario('');
 }, [horariosOcupados, horariosDisponibles]);

 const handleSeleccionarCancha = (c) => {
 setCanchaId(c.id);
 setLlamadaConfirmada(true);
 setMostrarCanchas(false);
 setHorario('');
 };

 const handleCambiarCancha = () => {
 setCanchaId('');
 setLlamadaConfirmada(false);
 setMostrarCanchas(true);
 setHorariosOcupados([]);
 };

 const handlePublicar = async () => {
 if (!canchaId || !horario) {
 setErrorMsg('Completá todos los campos antes de publicar.');
 return;
 }
 if (horariosOcupados.includes(horario)) {
 setErrorMsg('Ese horario ya está reservado en esta cancha. Elegí otro.');
 return;
 }
 setPaso('publicando');
 setErrorMsg('');
 try {
 const datos = {
 deporte,
 nombreCancha: canchaSelec?.nombre || 'Cancha propia',
 canchaId,
 barrio: canchaSelec?.barrio || '',
 ciudad,
 modalidad: modalidadFinal,
 nivel,
 fechaHora: getFechaReal(),
 cupoTotal,
 precioPorJugador,
 precioTotalCancha,
 organizador: perfil?.nombre || user?.displayName || 'Vos',
 };
 let nuevoId;
 if (modo === 'rival') {
 nuevoId = await crearPartidoBuscoRival(
 { ...datos, jugadoresPorEquipo: Math.ceil(cupoTotal / 2) },
 user.uid
 );
 } else {
 nuevoId = await crearPartido(datos, user.uid);
 }
 setPartidoIdCreado(nuevoId);
 setEstadoCreado('pendiente');
 setPaso('exito');
 } catch (err) {
 console.error(err);
 setErrorMsg('No se pudo publicar. Intentá de nuevo.');
 setPaso('form');
 }
 };

 if (paso === 'publicando') {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center font-barlow bg-f-bg px-5">
 <div className="w-16 h-16 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom mb-6" />
 <p className="text-white text-2xl font-black uppercase">Enviando solicitud...</p>
 <p className="text-f-muted text-base mt-2">Esperando confirmación de la cancha</p>
 </div>
 );
 }

 if (paso === 'exito') {
 return (
 <div className="min-h-screen flex flex-col items-center justify-center font-barlow bg-f-bg px-5 animate-fade-in">
  <h2 className="text-f-accent text-3xl font-black uppercase text-center">
 {modo === 'rival' ? '¡DESAFÍO PUBLICADO!' : '¡SOLICITUD ENVIADA!'}
 </h2>
 <p className="text-f-text text-lg text-center mt-3 px-4">
 {modo === 'rival'
 ? 'Tu desafío fue enviado a la cancha. Cuando confirmen, aparecerá en el feed para que otro equipo lo acepte.'
 : 'Tu solicitud fue enviada a la cancha. Cuando confirmen, el partido se publicará en el feed.'}
 </p>
 {modo === 'rival' ? (
 <div className="bg-f-card border border-f-border rounded-xl p-4 mt-6 w-full max-w-xs">
 <p className="text-f-muted text-sm text-center leading-snug">
 Cuando otro equipo acepte el desafío, quedan coordinados entre organizadores.
 </p>
 </div>
 ) : estadoCreado === 'confirmado' ? (
 <div className="bg-green-950 border border-green-700 rounded-xl p-4 mt-6 w-full max-w-xs animate-fade-in">
 <p className="text-green-300 text-sm text-center font-black leading-snug uppercase">
 ¡Partido confirmado por la cancha!
 </p>
 <p className="text-green-400/70 text-xs text-center mt-1">
 Ya aparece en el feed para que se anoten jugadores.
 </p>
 </div>
 ) : estadoCreado === 'cancelado' ? (
 <div className="bg-red-950 border border-red-800 rounded-xl p-4 mt-6 w-full max-w-xs animate-fade-in">
 <p className="text-red-300 text-sm text-center font-black leading-snug uppercase">
 La cancha rechazó la solicitud
 </p>
 </div>
 ) : (
 <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-4 mt-6 w-full max-w-xs">
 <p className="text-yellow-300 text-sm text-center font-medium leading-snug">
 Esperando confirmación de la cancha...
 </p>
 </div>
 )}
 <div className="bg-f-card border border-f-border rounded-xl p-4 mt-3 w-full max-w-xs">
 <p className="text-f-muted text-sm text-center leading-snug">
 El pago de la cancha se hace en efectivo en caja el día del partido.
 </p>
 </div>
 {partidoIdCreado && (
 <button
 onClick={async () => {
 const url = `${window.location.origin}/?partido=${partidoIdCreado}`;
 const fechaLabel = OPCIONES_FECHA[fecha]?.label?.toLowerCase() || '';
 const text = modo === 'rival'
 ? `¡Buscamos rival! ${canchaSelec?.nombre || ''} — ${fechaLabel} a las ${horario}hs`
 : `¡Unite al partido! ${canchaSelec?.nombre || ''} — ${fechaLabel} a las ${horario}hs`;
 if (navigator.share) {
 try { await navigator.share({ title: 'Falta 1', text, url }); } catch (_) {}
 } else {
 try { await navigator.clipboard.writeText(url); } catch (_) {}
 }
 }}
 className="w-full max-w-xs py-3.5 rounded-2xl font-bold text-sm uppercase mt-6 active:scale-95 transition-transform flex items-center justify-center gap-2"
 style={{ border: '1px solid rgba(84,181,240,0.25)', color: '#54b5f0' }}>
 <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
 <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
 </svg>
 Invitá amigos
 </button>
 )}
 <button
 onClick={() => { setPaso('form'); setTab('inicio'); }}
 className="w-full max-w-xs bg-f-green text-white font-black text-xl uppercase
 py-4 rounded-2xl mt-3 active:scale-95 transition-transform"
 >
 IR AL INICIO
 </button>
 <button
 onClick={() => setPaso('form')}
 className="text-f-muted text-base py-3 mt-2"
 >
 {modo === 'rival' ? 'Publicar otro desafío' : 'Crear otro partido'}
 </button>
 </div>
 );
 }

 return (
 <div className="font-barlow pb-28">
 <div className="px-5 pt-12 pb-4 bg-f-card border-b border-f-border">
 <h1 className="text-white text-3xl font-black uppercase">Crear partido</h1>
 <p className="text-f-muted text-base">Completá los datos y enviá la solicitud a la cancha</p>
 </div>

 <div className="px-5 pt-5 space-y-6">

 {/* Deporte */}
 <div>
 <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
 Deporte
 </label>
 <div className="flex gap-3">
 {[
 { id: 'futbol', label: 'Fútbol' },
 { id: 'padel', label: 'Pádel' },
 ].map(d => (
 <button key={d.id} onClick={() => setDeporte(d.id)}
 className={`flex-1 py-4 rounded-2xl font-black text-xl uppercase border transition-all
 ${deporte === d.id
 ? 'bg-f-green border-f-green text-white'
 : 'bg-f-card border-f-border text-f-muted'}`}>
  <span className="text-base">{d.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Modo */}
 <div>
 <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
 Tipo de partido
 </label>
 <div className="flex gap-3">
 {[
 { id: 'abierto', label: 'Partido abierto', desc: 'Cualquiera se anota' },
 { id: 'rival', label: 'Busco rival', desc: 'Tengo mi equipo' },
 ].map(m => (
 <button key={m.id} onClick={() => setModo(m.id)}
 className={`flex-1 py-4 rounded-2xl font-black text-base uppercase border transition-all flex flex-col items-center gap-1
 ${modo === m.id
 ? 'bg-f-green border-f-green text-white'
 : 'bg-f-card border-f-border text-f-muted'}`}>
  {m.label}
 <span className="text-xs font-medium normal-case opacity-70">{m.desc}</span>
 </button>
 ))}
 </div>
 {modo === 'rival' && (
 <div className="mt-3 bg-f-card border border-f-border rounded-xl px-4 py-3">
 <p className="text-f-muted text-sm leading-relaxed">
 Este modo es para cuando ya tenés tu equipo completo. Necesitás exactamente{' '}
 <span className="text-f-text font-bold">
 {deporte === 'padel' ? '2' : modalidad === 'F7' ? '7' : '5'} jugadores
 </span>{' '}
 listos. Si todavía te faltan jugadores, usá el modo "Partido abierto".
 </p>
 </div>
 )}
 </div>

 {/* Ciudad */}
 <div>
 <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
 Ciudad
 </label>
 <div className="flex gap-3">
 {CIUDADES.map(c => (
 <button key={c.id} onClick={() => setCiudad(c.id)}
 className={`flex-1 py-3 rounded-xl font-black text-base uppercase border transition-all
 ${ciudad === c.id
 ? 'bg-f-green border-f-green text-white'
 : 'bg-f-card border-f-border text-f-muted'}`}>
  <span className="text-sm">{c.id === 'Flores' ? 'Flores' : 'Montevideo'}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Modalidad (solo fútbol) */}
 {deporte === 'futbol' && (
 <div>
 <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
 Modalidad
 </label>
 <div className="flex gap-3">
 {['F5', 'F7'].map(m => (
 <button key={m} onClick={() => setModalidad(m)}
 className={`flex-1 py-4 rounded-2xl font-black text-xl uppercase border transition-all
 ${modalidad === m
 ? 'bg-f-green border-f-green text-white'
 : 'bg-f-card border-f-border text-f-muted'}`}>
 {m === 'F5' ? 'Fútbol 5' : 'Fútbol 7'}<br />
 <span className="text-sm font-medium">({m === 'F5' ? '10' : '14'} jugadores)</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Aviso cancelación automática */}
 {modo === 'abierto' && (
 <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
 <p className="text-f-muted text-sm leading-relaxed">
 Si 45 minutos antes del partido no llegás a la mitad de jugadores,
 el partido se cancela automáticamente y todos los anotados reciben una notificación.
 </p>
 </div>
 )}

 {/* Pádel info */}
 {deporte === 'padel' && (
 <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
 <p className="text-f-text text-sm font-bold"> Partida de pádel — 4 jugadores (2 vs 2)</p>
 <p className="text-f-muted text-xs mt-1">
 El costo de la cancha se divide entre los 4 jugadores. El organizador paga en caja.
 </p>
 </div>
 )}

 {/* Nivel */}
 <div>
 <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
 Nivel
 </label>
 <div className="flex gap-2">
 {NIVELES.map(n => (
 <button key={n} onClick={() => setNivel(n)}
 className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase border transition-all
 ${nivel === n
 ? 'text-white border-transparent'
 : 'bg-f-card border-f-border text-f-muted'}`}
 style={nivel === n ? { background: nivelColor[n], borderColor: nivelColor[n] } : {}}>
 {n}
 </button>
 ))}
 </div>
 </div>

 {/* Fecha */}
 <div>
 <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
 Fecha
 </label>
 <div className="flex gap-2 overflow-x-auto pb-1">
 {OPCIONES_FECHA.map((op, i) => (
 <button key={i} onClick={() => setFecha(i)}
 className={`flex-shrink-0 px-4 py-3 rounded-xl font-bold text-sm uppercase border transition-all text-center
 ${fecha === i
 ? 'bg-f-green border-f-green text-white'
 : 'bg-f-card border-f-border text-f-muted'}`}>
 {op.label}<br />
 <span className="text-xs font-medium normal-case">
 {op.date.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
 </span>
 </button>
 ))}
 </div>
 </div>

 {/* Cancha */}
 <div>
 <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
 Cancha
 </label>

 {!canchaId ? (
 <>
 <button onClick={() => setMostrarCanchas(true)}
 className="w-full border-2 border-dashed border-f-border rounded-xl py-6
 text-f-muted text-lg font-bold flex flex-col items-center gap-2">
 <span className="text-3xl">{deporte === 'padel' ? '' : ''}</span>
 Elegir cancha de {deporte === 'padel' ? 'pádel' : 'fútbol'}
 </button>
 {mostrarCanchas && (
 <div className="mt-2 bg-f-card border border-f-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
 {canchasDisponibles.map(c => (
 <button key={c.id} onClick={() => handleSeleccionarCancha(c)}
 className="w-full text-left px-4 py-3 border-b border-f-border last:border-b-0
 flex justify-between items-center hover:bg-f-bg transition-colors">
 <div>
 <p className="text-white font-bold">{c.nombre}</p>
 <p className="text-f-muted text-sm">{c.barrio} · {c.telefono || 'Sin teléfono'}</p>
 </div>
 <span className="text-f-accent font-bold text-sm flex-shrink-0 ml-2">
 ${c.precioPorHora.toLocaleString('es-UY')}/h
 </span>
 </button>
 ))}
 </div>
 )}
 </>
 ) : (
 /* Cancha seleccionada */
 <div className="bg-f-card border border-f-accent rounded-xl p-4 flex justify-between items-center">
 <div>
 <p className="text-white text-lg font-bold">{canchaSelec?.nombre}</p>
 <p className="text-f-muted text-sm">{canchaSelec?.barrio}{canchaSelec?.direccion ? ` · ${canchaSelec.direccion}` : ''}</p>
 </div>
 <button onClick={handleCambiarCancha}
 className="text-f-muted text-sm underline flex-shrink-0 ml-3">
 Cambiar
 </button>
 </div>
 )}
 </div>

 {/* Horario — solo si confirmada */}
 {llamadaConfirmada && (
 <div>
 <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
 Horario
 {horariosOcupados.length > 0 && (
 <span className="ml-2 text-red-400 text-xs font-medium normal-case">
 · {horariosOcupados.length} horario{horariosOcupados.length > 1 ? 's' : ''} ocupado{horariosOcupados.length > 1 ? 's' : ''}
 </span>
 )}
 </label>
 <div className="grid grid-cols-4 gap-2">
 {horariosDisponibles.map(h => {
 const ocupado = horariosOcupados.includes(h);
 return (
 <button key={h} onClick={() => !ocupado && setHorario(h)} disabled={ocupado}
 className={`py-2.5 rounded-xl font-bold text-base border transition-all
 ${ocupado
 ? 'bg-red-950/50 border-red-900 text-red-700 cursor-not-allowed line-through'
 : horario === h
 ? 'bg-f-green border-f-green text-white'
 : 'bg-f-card border-f-border text-f-muted'}`}>
 {h}
 </button>
 );
 })}
 </div>
 <p className="text-f-muted text-xs mt-2"> Tachado = ya hay un partido en esa cancha a esa hora</p>
 </div>
 )}

 {/* Precio (calculado desde la cancha) — solo si horario elegido */}
 {llamadaConfirmada && horario && precioTotalCancha > 0 && (
 <div className="bg-f-card border border-f-border rounded-xl p-4 space-y-2">
 <p className="text-f-muted text-xs font-bold uppercase tracking-wider">Precio</p>
 <div className="flex items-end justify-between">
 <div>
 <span className="text-f-accent font-black text-3xl">
 ${precioPorJugador.toLocaleString('es-UY')}
 </span>
 <span className="text-f-muted text-sm font-medium"> por jugador</span>
 </div>
 <div className="text-right">
 <p className="text-f-muted text-xs">Total cancha</p>
 <p className="text-f-text font-black text-lg">
 ${precioTotalCancha.toLocaleString('es-UY')}
 </p>
 </div>
 </div>
 <p className="text-f-muted text-xs">
 {cupoTotal} jugadores × ${precioPorJugador.toLocaleString('es-UY')} = ${precioTotalCancha.toLocaleString('es-UY')}
 </p>
 </div>
 )}

 {/* Resumen */}
 {canchaSelec && llamadaConfirmada && horario && (
 <div className="bg-sky-950 border border-f-green rounded-xl p-4 animate-fade-in">
 <p className="text-f-accent text-base font-bold uppercase mb-2">Resumen del partido</p>
 <div className="space-y-1 text-f-text text-base">
 <p> {canchaSelec.nombre} — {canchaSelec.barrio}</p>
 <p>{deporte === 'padel' ? ' Pádel' : ` ${modalidadFinal}`} · {nivel}</p>
 <p> {OPCIONES_FECHA[fecha]?.label} a las {horario}hs</p>
 <p> {cupoTotal} jugadores</p>
 <p> ${Number(precioPorJugador).toLocaleString('es-UY')} por jugador (en efectivo)</p>
 </div>
 <div className="mt-3 pt-3 border-t border-f-border">
 <p className="text-yellow-300 text-xs">
 El partido queda pendiente hasta que la cancha confirme desde su panel.
 </p>
 </div>
 </div>
 )}

 {/* Aviso de pagos */}
 {llamadaConfirmada && (
 <div className="bg-f-card border border-f-border rounded-xl p-4">
 <p className="text-f-muted text-sm leading-relaxed">
 <strong className="text-f-text">Pago 100% en efectivo</strong> — No hay pagos digitales en Falta 1. El organizador junta la plata de los jugadores y paga en caja el día del partido. La cancha confirma el pago desde su panel.
 </p>
 </div>
 )}

 {errorMsg && (
 <div className="bg-red-950 border border-red-800 rounded-xl p-3">
 <p className="text-red-400 text-base font-medium">{errorMsg}</p>
 </div>
 )}

 {/* Botón publicar */}
 {llamadaConfirmada && (
 <button onClick={handlePublicar}
 disabled={!canchaId || !horario}
 className="w-full bg-f-green text-white font-black text-2xl uppercase
 py-5 rounded-2xl transition-all active:scale-95
 disabled:opacity-40 disabled:cursor-not-allowed"
 style={{ boxShadow: '0 6px 20px rgba(14,165,233,0.5)' }}>
 {modo === 'rival' ? ' PUBLICAR DESAFÍO' : ' SOLICITAR RESERVA'}
 </button>
 )}
 </div>
 </div>
 );
}
