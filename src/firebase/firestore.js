import {
 doc, setDoc, getDoc, updateDoc, deleteDoc, collection,
 query, where, orderBy, onSnapshot, addDoc,
 serverTimestamp, increment, arrayUnion, arrayRemove, getDocs,
 limit, runTransaction, deleteField,
} from 'firebase/firestore';
import { db } from './config';

// CANCHAS 

export function suscribirCanchas(callback) {
 const q = query(collection(db, 'canchas'), orderBy('nombre'));
 return onSnapshot(q, (snap) => {
 callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
 });
}

export async function crearCancha(datos) {
 const ref = await addDoc(collection(db, 'canchas'), {
 ...datos,
 creadoEn: serverTimestamp(),
 });
 return ref.id;
}

export async function actualizarCancha(id, datos) {
 await updateDoc(doc(db, 'canchas', id), datos);
}

export async function eliminarCancha(id) {
 await deleteDoc(doc(db, 'canchas', id));
}

// Carga inicial de las canchas (solo si la colección está vacía)
export async function seedCanchas(canchas) {
 const snap = await getDocs(collection(db, 'canchas'));
 if (!snap.empty) return 'ya_existe';
 for (const c of canchas) {
 const { id: _id, ...datos } = c;
 await addDoc(collection(db, 'canchas'), datos);
 }
 return 'ok';
}

// USUARIOS 

export async function crearOActualizarUsuario(user, extras = {}) {
 const ref = doc(db, 'usuarios', user.uid);
 const snap = await getDoc(ref);
 const nombre = snap.exists() ? (snap.data().nombre || user.displayName || 'Jugador') : (user.displayName || 'Jugador');
 const foto = snap.exists() ? (snap.data().foto || user.photoURL || null) : (user.photoURL || null);
 if (!snap.exists()) {
  await setDoc(ref, {
   uid: user.uid,
   nombre,
   email: user.email,
   foto,
   telefono: extras.telefono || null,
   telefonoVerificado: extras.telefonoVerificado || false,
   posicion: 'Por definir',
   nivelFutbol: 'Intermedio',
   ciudad: 'Montevideo',
   partidosJugados: 0,
   reputacion: 5,
   noShows: 0,
   advertencia: false,
   insignias: [],
   penalizacionHasta: null,
   bloqueado: false,
   deudaPendiente: false,
   deudaPartidoId: null,
   admin: false,
   rol: 'jugador',
   creadoEn: serverTimestamp(),
  });
 }
 // Sincronizar perfil público en cada login (crea o actualiza)
 try {
  const pubData = snap.exists() ? snap.data() : {};
  await setDoc(doc(db, 'usuarios_publicos', user.uid), {
   uid: user.uid,
   nombre,
   foto,
   ciudad: pubData.ciudad || 'Montevideo',
   nivelFutbol: pubData.nivelFutbol || 'Intermedio',
   reputacion: pubData.reputacion ?? 5,
   partidosJugados: pubData.partidosJugados || 0,
   ...(pubData.perfilFutbol ? { perfilFutbol: pubData.perfilFutbol } : {}),
   ...(pubData.perfilPadel ? { perfilPadel: pubData.perfilPadel } : {}),
  }, { merge: true });
 } catch { /* si falla no bloquea el login */ }
 return ref;
}

export async function obtenerUsuario(uid) {
 const snap = await getDoc(doc(db, 'usuarios', uid));
 return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function suscribirUsuario(uid, callback) {
 return onSnapshot(doc(db, 'usuarios', uid), (snap) => {
 if (snap.exists()) callback({ id: snap.id, ...snap.data() });
 else callback(null);
 });
}

export async function actualizarPerfil(uid, datos) {
 await updateDoc(doc(db, 'usuarios', uid), datos);
}

// Admin: obtener todos los usuarios
export async function obtenerTodosUsuarios() {
 const snap = await getDocs(collection(db, 'usuarios'));
 return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function banearUsuario(uid, permanente = false) {
 const updates = permanente
 ? { bloqueado: true }
 : { penalizacionHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
 await updateDoc(doc(db, 'usuarios', uid), updates);
}

export async function levantarBan(uid) {
 await updateDoc(doc(db, 'usuarios', uid), {
 bloqueado: false,
 penalizacionHasta: null,
 advertencia: false,
 noShows: 0,
 });
}

// PARTIDOS 

export function suscribirPartidos(callback, filtros = {}) {
 const q = query(collection(db, 'partidos'), orderBy('fechaHora'));
 return onSnapshot(q, (snap) => {
 let partidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
 .filter(p => p.activo === true && p.estado === 'confirmado');
 if (filtros.deporte) partidos = partidos.filter(p => p.deporte === filtros.deporte);
 if (filtros.modalidad) partidos = partidos.filter(p => p.modalidad === filtros.modalidad);
 if (filtros.barrio) partidos = partidos.filter(p => p.barrio === filtros.barrio);
 callback(partidos);
 });
}

// Admin: todos los partidos
export function suscribirTodosPartidos(callback) {
 const q = query(collection(db, 'partidos'), orderBy('fechaHora', 'desc'));
 return onSnapshot(q, (snap) => {
 callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
 });
}

// Partidos pendientes para una cancha (por canchaId)
// Orden: client-side para no requerir índice compuesto en Firestore
export function suscribirPartidosPendientesCancha(canchaId, callback) {
 const q = query(
 collection(db, 'partidos'),
 where('canchaId', '==', canchaId),
 where('estado', '==', 'pendiente'),
 );
 return onSnapshot(q, (snap) => {
 const partidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
 partidos.sort((a, b) => {
 const ta = a.creadoEn?.toDate?.() ?? new Date(0);
 const tb = b.creadoEn?.toDate?.() ?? new Date(0);
 return tb - ta; // desc
 });
 callback(partidos);
 }, (err) => {
 console.error('[suscribirPartidosPendientesCancha] Error:', err);
 callback([]);
 });
}

// Todos los partidos de una cancha
// Orden: client-side para no requerir índice compuesto en Firestore
export function suscribirPartidosCancha(canchaId, callback) {
 const q = query(
 collection(db, 'partidos'),
 where('canchaId', '==', canchaId),
 );
 return onSnapshot(q, (snap) => {
 const partidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
 partidos.sort((a, b) => new Date(a.fechaHora || 0) - new Date(b.fechaHora || 0)); // asc
 callback(partidos);
 }, (err) => {
 console.error('[suscribirPartidosCancha] Error:', err);
 callback([]);
 });
}

// Devuelve array de horas ocupadas ("20:00", "21:00", etc.) para una cancha en una fecha dada
// Incluye partidos activos Y horarios bloqueados manualmente por la cancha
export async function getHorariosOcupados(canchaId, fecha) {
 const startOfDay = new Date(fecha); startOfDay.setHours(0, 0, 0, 0);
 const endOfDay = new Date(fecha); endOfDay.setHours(23, 59, 59, 999);
 const fechaStr = startOfDay.toISOString().split('T')[0];

 const ocupados = [];

 // Partidos activos — se ejecuta independientemente para no bloquear los horarios bloqueados
 try {
   const qPartidos = query(
     collection(db, 'partidos'),
     where('canchaId', '==', canchaId),
     where('activo', '==', true),
   );
   const snapPartidos = await getDocs(qPartidos);
   snapPartidos.forEach(d => {
     const p = d.data();
     const f = new Date(p.fechaHora);
     if (f >= startOfDay && f <= endOfDay) {
       ocupados.push(`${String(f.getHours()).padStart(2,'0')}:${String(f.getMinutes()).padStart(2,'0')}`);
     }
   });
 } catch (err) {
   console.error('[getHorariosOcupados] Error en partidos:', err);
 }

 // Horarios bloqueados manualmente — se ejecuta independientemente
 try {
   const qBloqueados = query(
     collection(db, 'horarios_bloqueados'),
     where('canchaId', '==', canchaId),
     where('fecha', '==', fechaStr),
   );
   const snapBloqueados = await getDocs(qBloqueados);
   snapBloqueados.forEach(d => {
     const b = d.data();
     if (!ocupados.includes(b.hora)) ocupados.push(b.hora);
   });
 } catch (err) {
   console.error('[getHorariosOcupados] Error en horarios bloqueados:', err);
 }

 return ocupados;
}

// Suscripción en tiempo real a los horarios ocupados de una cancha en una fecha
// Combina partidos activos + horarios bloqueados; llama callback cada vez que algo cambia
export function suscribirHorariosOcupados(canchaId, fecha, callback) {
 const startOfDay = new Date(fecha); startOfDay.setHours(0, 0, 0, 0);
 const endOfDay = new Date(fecha); endOfDay.setHours(23, 59, 59, 999);
 const fechaStr = startOfDay.toISOString().split('T')[0];

 let horasPartidos = [];
 let horasBloqueadas = [];

 const notificar = () => {
 const combinados = [...new Set([...horasPartidos, ...horasBloqueadas])];
 callback(combinados);
 };

 // Listener 1: partidos activos de esta cancha
 const qPartidos = query(
 collection(db, 'partidos'),
 where('canchaId', '==', canchaId),
 where('activo', '==', true),
 );
 const unsubPartidos = onSnapshot(qPartidos, (snap) => {
 horasPartidos = [];
 snap.forEach(d => {
 const p = d.data();
 const f = new Date(p.fechaHora);
 if (f >= startOfDay && f <= endOfDay) {
 horasPartidos.push(`${String(f.getHours()).padStart(2,'0')}:${String(f.getMinutes()).padStart(2,'0')}`);
 }
 });
 notificar();
 }, (err) => {
 console.error('[suscribirHorariosOcupados] Error en partidos:', err);
 });

 // Listener 2: horarios bloqueados manualmente para esta cancha+fecha
 const qBloqueados = query(
 collection(db, 'horarios_bloqueados'),
 where('canchaId', '==', canchaId),
 where('fecha', '==', fechaStr),
 );
 const unsubBloqueados = onSnapshot(qBloqueados, (snap) => {
 horasBloqueadas = [];
 snap.forEach(d => horasBloqueadas.push(d.data().hora));
 notificar();
 }, (err) => {
 console.error('[suscribirHorariosOcupados] Error en bloqueados:', err);
 });

 return () => { unsubPartidos(); unsubBloqueados(); };
}

// Crear partido — queda en estado "pendiente" hasta que la cancha confirme
export async function crearPartido(datos, uid) {
 // Verificar estado del usuario antes de crear
 const userSnap = await getDoc(doc(db, 'usuarios', uid));
 const jugadoresMeta = {};
 if (userSnap.exists()) {
 const u = userSnap.data();
 if (u.bloqueado) {
 throw new Error('Tu cuenta está bloqueada permanentemente');
 }
 if (u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date()) {
 const dias = Math.ceil((new Date(u.penalizacionHasta) - new Date()) / 86400000);
 throw new Error(`Tu cuenta está suspendida. Te quedan ${dias} día${dias !== 1 ? 's' : ''}`);
 }
 jugadoresMeta[uid] = { nombre: u.nombre || datos.organizador || 'Jugador', foto: u.foto || null };
 }
 const ref = await addDoc(collection(db, 'partidos'), {
 ...datos,
 creadoPor: uid,
 jugadoresAnotados: 1,
 jugadores: [uid],
 jugadoresMeta,
 activo: true,
 estado: 'confirmado',
 pagos: {},
 pagoCanchaConfirmado: false,
 creadoEn: serverTimestamp(),
 });
 return ref.id;
}

// Cancha confirma la reserva → el partido se publica
export async function confirmarReserva(partidoId) {
 await updateDoc(doc(db, 'partidos', partidoId), {
 activo: true,
 estado: 'confirmado',
 confirmadoEn: serverTimestamp(),
 });
}

// Cancha rechaza la reserva
export async function rechazarReserva(partidoId, motivo = '') {
 await updateDoc(doc(db, 'partidos', partidoId), {
 activo: false,
 estado: 'cancelado',
 motivoRechazo: motivo,
 rechazadoEn: serverTimestamp(),
 });
}

// Cancha confirma que recibió el pago en efectivo (solo cancha puede hacer esto)
export async function confirmarPagoCancha(partidoId) {
 await updateDoc(doc(db, 'partidos', partidoId), {
 pagoCanchaConfirmado: true,
 pagoCanchaFecha: serverTimestamp(),
 estado: 'finalizado',
 });
}

// Organizador marca que un jugador le pagó (siempre queda como "no verificado")
export async function registrarPagoJugador(partidoId, jugadorUid, marcado) {
 await updateDoc(doc(db, 'partidos', partidoId), {
 [`pagos.${jugadorUid}.marcadoPorOrganizador`]: marcado,
 });
}

// Obtener un partido por ID
export async function obtenerPartido(partidoId) {
 const snap = await getDoc(doc(db, 'partidos', partidoId));
 return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Suscribirse a un partido específico (para detalle en tiempo real)
export function suscribirPartido(partidoId, callback) {
 return onSnapshot(doc(db, 'partidos', partidoId), (snap) => {
 if (snap.exists()) callback({ id: snap.id, ...snap.data() });
 else callback(null);
 });
}

export async function anotarseAPartido(partidoId, uid) {
 const ref = doc(db, 'partidos', partidoId);
 const snap = await getDoc(ref);
 if (!snap.exists()) throw new Error('Partido no encontrado');

 const partido = snap.data();

 if ((partido.jugadores || []).includes(uid)) {
 throw new Error('Ya estás anotado en este partido');
 }

 if (partido.jugadoresAnotados >= partido.cupoTotal) {
 throw new Error('El partido está lleno');
 }

 // Verificar estado del usuario (ban/suspensión/deuda)
 const userSnap = await getDoc(doc(db, 'usuarios', uid));
 if (userSnap.exists()) {
 const u = userSnap.data();
 if (u.bloqueado) {
 throw new Error('Tu cuenta está bloqueada permanentemente');
 }
 if (u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date()) {
 const dias = Math.ceil((new Date(u.penalizacionHasta) - new Date()) / 86400000);
 throw new Error(`Tu cuenta está suspendida. Te quedan ${dias} día${dias !== 1 ? 's' : ''}`);
 }
 if (u.deudaPendiente) {
 throw new Error('Tenés una deuda pendiente de un partido anterior');
 }
 }

 const nuevosAnotados = (partido.jugadoresAnotados || 0) + 1;
 const lleno = nuevosAnotados >= partido.cupoTotal;

 // Cargar foto del jugador desde usuarios_publicos para guardarla en el partido
 let metaJugador = { nombre: '', foto: null };
 try {
 const pubSnap = await getDoc(doc(db, 'usuarios_publicos', uid));
 if (pubSnap.exists()) {
  const pd = pubSnap.data();
  metaJugador = { nombre: pd.nombre || '', foto: pd.foto || null };
 }
 } catch { /* ignorar si falla — no es crítico */ }

 await updateDoc(ref, {
 jugadores: arrayUnion(uid),
 jugadoresAnotados: increment(1),
 [`jugadoresMeta.${uid}`]: metaJugador,
 ...(lleno ? { activo: false, estado: 'lleno' } : {}),
 });
}

// Desanotarse — umbral de 1 hora y 30 minutos según las reglas de la plataforma
export async function desanotarseDePartido(partidoId, uid) {
 const ref = doc(db, 'partidos', partidoId);
 const snap = await getDoc(ref);
 if (!snap.exists()) throw new Error('Partido no encontrado');

 const partido = snap.data();
 const fechaPartido = new Date(partido.fechaHora);
 const ahora = new Date();
 const diffMs = fechaPartido - ahora;
 const limiteMs = 90 * 60 * 1000; // 1 hora y 30 minutos
 const esMenosDelLimite = diffMs > 0 && diffMs < limiteMs;
 const yaPaso = diffMs <= 0;

 await updateDoc(ref, {
 jugadores: arrayRemove(uid),
 jugadoresAnotados: increment(-1),
 [`jugadoresMeta.${uid}`]: deleteField(),
 ...(partido.estado === 'lleno' ? { activo: true, estado: 'confirmado' } : {}),
 });

 // Solo penalizar si cancela con menos de 1h30m o ya pasó (no-show)
 if (esMenosDelLimite || yaPaso) {
 await aplicarPenalizacion(uid, yaPaso);
 }
}

async function aplicarPenalizacion(uid, esNoShow = false) {
 const userRef = doc(db, 'usuarios', uid);
 const userSnap = await getDoc(userRef);
 if (!userSnap.exists()) return;

 const userData = userSnap.data();
 const updates = {};

 if (esNoShow) {
 const noShows = (userData.noShows || 0) + 1;
 updates.noShows = noShows;

 if (noShows >= 3) {
 // 3+ no-shows: bloqueo permanente
 updates.bloqueado = true;
 } else if (noShows >= 2) {
 // 2 no-shows: suspensión 1 mes
 const hasta = new Date();
 hasta.setMonth(hasta.getMonth() + 1);
 updates.penalizacionHasta = hasta.toISOString();
 } else {
 // 1 no-show: suspensión 7 días
 const hasta = new Date();
 hasta.setDate(hasta.getDate() + 7);
 updates.penalizacionHasta = hasta.toISOString();
 }
 } else {
 // Cancelación con menos de 1h30m → primer aviso
 updates.advertencia = true;
 }

 await updateDoc(userRef, updates);
}

// POST-PARTIDO 

// Organizador confirma quiénes asistieron y quiénes pagaron
export async function confirmarAsistenciaPartido(partidoId, noAsistentesUids = [], noPagadoresUids = []) {
 await updateDoc(doc(db, 'partidos', partidoId), {
 asistenciaConfirmada: true,
 noAsistentes: noAsistentesUids,
 deudores: noPagadoresUids,
 estado: 'finalizado',
 asistenciaConfirmadaEn: serverTimestamp(),
 });

 // Aplicar penalización de no-show a quienes no asistieron
 for (const uid of noAsistentesUids) {
 await aplicarPenalizacion(uid, true);
 }

 // Marcar deuda en perfil de quienes no pagaron
 for (const uid of noPagadoresUids) {
 await updateDoc(doc(db, 'usuarios', uid), {
 deudaPendiente: true,
 deudaPartidoId: partidoId,
 });
 }
}

// Organizador confirma que un jugador le pagó la deuda → levanta la deuda
export async function levantarDeudaJugador(jugadorUid, partidoId) {
 await updateDoc(doc(db, 'usuarios', jugadorUid), {
 deudaPendiente: false,
 deudaPartidoId: null,
 });
 if (partidoId) {
 await updateDoc(doc(db, 'partidos', partidoId), {
 deudores: arrayRemove(jugadorUid),
 });
 }
}

// Suscribirse a partidos del organizador que necesitan confirmación de asistencia
export function suscribirPartidosParaConfirmar(uid, callback) {
 const q = query(
 collection(db, 'partidos'),
 where('creadoPor', '==', uid),
 limit(30),
 );
 return onSnapshot(q, (snap) => {
 const ahora = new Date();
 const noventaMin = 90 * 60 * 1000;
 const pendientes = snap.docs
 .map(d => ({ id: d.id, ...d.data() }))
 .filter(p => {
 if (p.asistenciaConfirmada) return false;
 if (!['confirmado', 'lleno'].includes(p.estado)) return false;
 const fecha = new Date(p.fechaHora);
 return ahora > new Date(fecha.getTime() + noventaMin);
 });
 callback(pendientes);
 });
}

export async function eliminarPartido(partidoId, uid) {
 const ref = doc(db, 'partidos', partidoId);
 const snap = await getDoc(ref);
 if (!snap.exists()) throw new Error('Partido no encontrado');
 const partido = snap.data();
 if (partido.creadoPor !== uid) throw new Error('No tenés permiso para eliminar este partido');
 await deleteDoc(ref);
}

// Admin: eliminar cualquier partido
export async function eliminarPartidoAdmin(partidoId) {
 await deleteDoc(doc(db, 'partidos', partidoId));
}

// CHAT DE PARTIDOS 

export function suscribirMensajes(partidoId, callback) {
 const q = query(
 collection(db, 'partidos', partidoId, 'mensajes'),
 orderBy('creadoEn', 'asc'),
 limit(200),
 );
 return onSnapshot(q, (snap) => {
 callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
 });
}

export async function enviarMensaje(partidoId, uid, nombre, foto, texto) {
 await addDoc(collection(db, 'partidos', partidoId, 'mensajes'), {
 uid,
 nombre,
 foto: foto || null,
 texto,
 creadoEn: serverTimestamp(),
 });
}

export async function fijarMensaje(partidoId, mensajeId) {
 await updateDoc(doc(db, 'partidos', partidoId, 'mensajes', mensajeId), {
 fijado: true,
 });
}

// CHATS ACTIVOS DEL USUARIO

// Partidos donde el usuario está anotado — sin orderBy para evitar requerir índice compuesto con array-contains
export function suscribirMisPartidos(uid, callback) {
 const q = query(
 collection(db, 'partidos'),
 where('jugadores', 'array-contains', uid),
 );
 return onSnapshot(q, (snap) => {
 const partidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
 partidos.sort((a, b) => new Date(b.fechaHora || 0) - new Date(a.fechaHora || 0)); // desc
 callback(partidos);
 }, (err) => {
 console.error('[suscribirMisPartidos] Error:', err);
 callback([]);
 });
}

// RESERVAS 

export async function crearReserva(datos, uid) {
 const ref = await addDoc(collection(db, 'reservas'), {
 ...datos,
 uid,
 estado: 'pendiente',
 creadoEn: serverTimestamp(),
 });
 return ref.id;
}

export async function obtenerReservasCancha(canchaId, fecha) {
 const q = query(
 collection(db, 'reservas'),
 where('canchaId', '==', canchaId),
 where('fecha', '==', fecha),
 where('estado', '!=', 'cancelada'),
 );
 const snap = await getDocs(q);
 return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function suscribirMisReservas(uid, callback) {
 const q = query(
 collection(db, 'reservas'),
 where('uid', '==', uid),
 orderBy('creadoEn', 'desc'),
 );
 return onSnapshot(q, (snap) => {
 callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
 });
}

// MODO "BUSCO RIVAL" 

// Crear un partido en modo "busco rival" — el organizador ya tiene su equipo completo
export async function crearPartidoBuscoRival(datos, uid) {
 const userSnap = await getDoc(doc(db, 'usuarios', uid));
 const jugadoresMeta = {};
 if (userSnap.exists()) {
 const u = userSnap.data();
 if (u.bloqueado) throw new Error('Tu cuenta está bloqueada permanentemente');
 if (u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date()) {
 const dias = Math.ceil((new Date(u.penalizacionHasta) - new Date()) / 86400000);
 throw new Error(`Tu cuenta está suspendida. Te quedan ${dias} día${dias !== 1 ? 's' : ''}`);
 }
 jugadoresMeta[uid] = { nombre: u.nombre || datos.organizador || 'Jugador', foto: u.foto || null };
 }
 const ref = await addDoc(collection(db, 'partidos'), {
 ...datos,
 creadoPor: uid,
 modoBuscoRival: true,
 organizador1: uid,
 organizador2: null,
 rival: null,
 activo: true,
 estado: 'confirmado',
 jugadores: [uid],
 jugadoresMeta,
 jugadoresAnotados: datos.jugadoresPorEquipo || 5,
 pagos: {},
 pagoCanchaConfirmado: false,
 creadoEn: serverTimestamp(),
 });
 return ref.id;
}

// Aceptar el desafío de un partido "busco rival"
export async function aceptarDesafioRival(partidoId, organizador2Uid, organizador2Nombre) {
 const ref = doc(db, 'partidos', partidoId);
 const snap = await getDoc(ref);
 if (!snap.exists()) throw new Error('Partido no encontrado');
 const p = snap.data();
 if (p.organizador2) throw new Error('El desafío ya fue aceptado por otro equipo');

 await updateDoc(ref, {
 organizador2: organizador2Uid,
 rival: organizador2Nombre,
 jugadores: arrayUnion(organizador2Uid),
 estado: 'rival_encontrado',
 rivalAceptadoEn: serverTimestamp(),
 });
}

// CANCELACIÓN AUTOMÁTICA POR PARTIDO INCOMPLETO 

// Marca que se notificó al organizador (1h15m antes) — guarda timestamp
export async function marcarNotificacionIncompleto(partidoId) {
 await updateDoc(doc(db, 'partidos', partidoId), {
 notificacionIncompletoEn: new Date().toISOString(),
 });
}

// Organizador confirma que juega igual con los que hay
export async function confirmarPartidoIncompleto(partidoId) {
 await updateDoc(doc(db, 'partidos', partidoId), {
 confirmadoIncompleto: true,
 notificacionIncompletoEn: null,
 });
}

// Cancelar partido automáticamente por falta de jugadores
export async function cancelarPartidoAutomatico(partidoId) {
 await updateDoc(doc(db, 'partidos', partidoId), {
 estado: 'cancelado',
 activo: false,
 motivoRechazo: 'Cancelado automáticamente — falta de jugadores',
 canceladoAutomaticoEn: new Date().toISOString(),
 notificacionIncompletoEn: null,
 });
}

// HORARIOS BLOQUEADOS (Cancha bloquea manualmente) 

// Bloquear un horario manualmente (por reserva externa)
export async function bloquearHorario(canchaId, fecha, hora, motivo = '') {
 const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0];
 const ref = await addDoc(collection(db, 'horarios_bloqueados'), {
 canchaId, fecha: fechaStr, hora, motivo,
 creadoEn: serverTimestamp(),
 });
 return ref.id;
}

// Desbloquear un horario
export async function desbloquearHorario(bloqueId) {
 await deleteDoc(doc(db, 'horarios_bloqueados', bloqueId));
}

// Obtener horarios bloqueados para una cancha/fecha
export async function getHorariosBloqueados(canchaId, fecha) {
 const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0];
 const q = query(
 collection(db, 'horarios_bloqueados'),
 where('canchaId', '==', canchaId),
 where('fecha', '==', fechaStr),
 );
 const snap = await getDocs(q);
 return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Suscripción en tiempo real a bloqueos de una cancha (todos los días)
export function suscribirHorariosBloqueados(canchaId, callback) {
 const q = query(
 collection(db, 'horarios_bloqueados'),
 where('canchaId', '==', canchaId),
 );
 return onSnapshot(q, (snap) => {
 callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
 });
}

// FOTOS DE PERFIL (Cloudinary)

// Guarda en Firestore la URL de la foto ya subida a Cloudinary
export async function actualizarFotoPerfil(uid, url) {
 await updateDoc(doc(db, 'usuarios', uid), { foto: url });
 try { await updateDoc(doc(db, 'usuarios_publicos', uid), { foto: url }); } catch { /* ok */ }
}

// Buscar usuario por email (para asignar rol cancha desde AdminScreen)
export async function obtenerUsuarioPorEmail(email) {
 const q = query(collection(db, 'usuarios'), where('email', '==', email), limit(1));
 const snap = await getDocs(q);
 if (snap.empty) return null;
 return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// Asignar rol cancha a un usuario existente
export async function asignarRolCancha(uid, canchaId, nombreCancha) {
 await updateDoc(doc(db, 'usuarios', uid), {
 rol: 'cancha',
 canchaId,
 nombre: nombreCancha,
 });
}

// Cargar perfiles públicos de varios usuarios a la vez (para MatchDetailScreen)
export async function obtenerPerfilesJugadores(uids) {
 const perfiles = {};
 await Promise.all(uids.map(async (uid) => {
 try {
 const snap = await getDoc(doc(db, 'usuarios_publicos', uid));
 if (snap.exists()) perfiles[uid] = { id: snap.id, ...snap.data() };
 } catch { /* ignorar errores individuales */ }
 }));
 return perfiles;
}

// CÉDULAS DE IDENTIDAD

// Verifica si una cédula está disponible (pre-chequeo no-transaccional)
export async function verificarCedulaDisponible(cedula) {
 const cedNorm = cedula.replace(/\D/g, '').padStart(8, '0');
 const snap = await getDoc(doc(db, 'cedulas', cedNorm));
 return !snap.exists();
}

// Reserva atómica: verifica unicidad, crea doc en cedulas y actualiza el perfil del usuario
export async function reservarCedula(uid, cedula) {
 const cedNorm = cedula.replace(/\D/g, '').padStart(8, '0');
 await runTransaction(db, async (tx) => {
 const cedulaRef = doc(db, 'cedulas', cedNorm);
 const snap = await tx.get(cedulaRef);
 if (snap.exists() && snap.data().uid !== uid) {
 throw new Error('Esta cédula ya tiene una cuenta registrada. Usá la opción Ingresar.');
 }
 tx.set(cedulaRef, { uid });
 tx.update(doc(db, 'usuarios', uid), { cedula: cedNorm });
 });
}

// Admin: actualizar la cédula de un usuario (elimina la vieja y registra la nueva)
export async function actualizarCedulaAdmin(uid, cedulaVieja, cedulaNueva) {
 const cedNorm = cedulaNueva.replace(/\D/g, '').padStart(8, '0');
 await runTransaction(db, async (tx) => {
 if (cedulaVieja) {
 const viejaNorm = cedulaVieja.replace(/\D/g, '').padStart(8, '0');
 tx.delete(doc(db, 'cedulas', viejaNorm));
 }
 const nuevaRef = doc(db, 'cedulas', cedNorm);
 const snap = await tx.get(nuevaRef);
 if (snap.exists() && snap.data().uid !== uid) {
 throw new Error('Esa cédula ya pertenece a otro usuario.');
 }
 tx.set(nuevaRef, { uid });
 tx.update(doc(db, 'usuarios', uid), { cedula: cedNorm });
 });
}

// PERFILES POR DEPORTE

export async function actualizarPerfilesDeporte(uid, perfilFutbol, perfilPadel) {
 const updates = { perfilFutbol, perfilPadel };
 await updateDoc(doc(db, 'usuarios', uid), updates);
 try { await updateDoc(doc(db, 'usuarios_publicos', uid), updates); } catch { /* ok */ }
}

// BUSCAR JUGADORES (búsqueda client-side sobre usuarios_publicos)

export async function buscarJugadores(textoBusqueda) {
 const snap = await getDocs(collection(db, 'usuarios_publicos'));
 const texto = textoBusqueda.toLowerCase().trim();
 if (!texto) return [];
 return snap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(u => u.nombre?.toLowerCase().includes(texto));
}

// BUSCAR CANCHAS (búsqueda client-side sobre colección canchas)

export async function buscarCanchasPublicas(textoBusqueda) {
 const snap = await getDocs(collection(db, 'canchas'));
 const texto = textoBusqueda.toLowerCase().trim();
 if (!texto) return [];
 return snap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(c => c.nombre?.toLowerCase().includes(texto));
}

// BLOQUEAR / DESBLOQUEAR JUGADORES

export async function bloquearJugador(uid, bloqueadoUid) {
 await updateDoc(doc(db, 'usuarios', uid), {
  bloqueados: arrayUnion(bloqueadoUid),
 });
}

export async function desbloquearJugador(uid, bloqueadoUid) {
 await updateDoc(doc(db, 'usuarios', uid), {
  bloqueados: arrayRemove(bloqueadoUid),
 });
}

export async function obtenerPerfilesBloqueados(uids) {
 if (!uids?.length) return [];
 const perfiles = [];
 await Promise.all(uids.map(async (uid) => {
  try {
   const snap = await getDoc(doc(db, 'usuarios_publicos', uid));
   if (snap.exists()) perfiles.push({ id: snap.id, ...snap.data() });
  } catch { /* ok */ }
 }));
 return perfiles;
}

// SUGERENCIAS

export async function enviarSugerencia(uid, texto) {
 await addDoc(collection(db, 'sugerencias'), {
  uid,
  texto: texto.trim(),
  creadoEn: serverTimestamp(),
 });
}

// REPORTES / SOPORTE

export async function enviarReporte(uid, texto) {
 await addDoc(collection(db, 'reportes'), {
  uid,
  texto: texto.trim(),
  creadoEn: serverTimestamp(),
 });
}

// MENSAJES DIRECTOS

function getConvId(uid1, uid2) {
 return [uid1, uid2].sort().join('_');
}

export async function enviarMensajeDirecto(uid1, uid2, texto, nombre1, foto1) {
 const convId = getConvId(uid1, uid2);
 const convRef = doc(db, 'conversaciones', convId);
 const convSnap = await getDoc(convRef);
 if (!convSnap.exists()) {
  let nombre2 = 'Jugador', foto2 = null;
  try {
   const pub = await getDoc(doc(db, 'usuarios_publicos', uid2));
   if (pub.exists()) { nombre2 = pub.data().nombre || 'Jugador'; foto2 = pub.data().foto || null; }
  } catch {}
  await setDoc(convRef, {
   participantes: [uid1, uid2].sort(),
   nombres: { [uid1]: nombre1 || 'Jugador', [uid2]: nombre2 },
   fotos: { [uid1]: foto1 || null, [uid2]: foto2 },
   ultimoMensaje: texto,
   ultimaFecha: serverTimestamp(),
  });
 } else {
  await updateDoc(convRef, {
   [`nombres.${uid1}`]: nombre1 || 'Jugador',
   [`fotos.${uid1}`]: foto1 || null,
   ultimoMensaje: texto,
   ultimaFecha: serverTimestamp(),
  });
 }
 await addDoc(collection(db, 'conversaciones', convId, 'mensajes'), {
  de: uid1,
  texto,
  fecha: serverTimestamp(),
 });
}

export function suscribirConversaciones(uid, callback) {
 const q = query(
  collection(db, 'conversaciones'),
  where('participantes', 'array-contains', uid),
  orderBy('ultimaFecha', 'desc'),
 );
 return onSnapshot(q, (snap) => {
  callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
 }, () => callback([]));
}

export function suscribirMensajesDirectos(convId, callback) {
 const q = query(
  collection(db, 'conversaciones', convId, 'mensajes'),
  orderBy('fecha', 'asc'),
  limit(200),
 );
 return onSnapshot(q, (snap) => {
  callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
 }, () => callback([]));
}
