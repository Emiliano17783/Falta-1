import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, collection,
  query, where, orderBy, onSnapshot, addDoc,
  serverTimestamp, increment, arrayUnion, arrayRemove, getDocs,
  limit,
} from 'firebase/firestore';
import { db } from './config';

// ─── CANCHAS ─────────────────────────────────────────────────────────────────

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

// ─── USUARIOS ───────────────────────────────────────────────────────────────

export async function crearOActualizarUsuario(user) {
  const ref = doc(db, 'usuarios', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      nombre: user.displayName || 'Jugador',
      email: user.email,
      foto: user.photoURL || null,
      posicion: 'Por definir',
      ciudad: 'Montevideo',
      partidosJugados: 0,
      reputacion: 5,
      noShows: 0,
      advertencia: false,
      insignias: [],
      penalizacionHasta: null,
      bloqueado: false,
      admin: false,
      rol: 'jugador',  // jugador | cancha | admin
      creadoEn: serverTimestamp(),
    });
  }
  return ref;
}

export async function obtenerUsuario(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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

// ─── PARTIDOS ────────────────────────────────────────────────────────────────

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
export function suscribirPartidosPendientesCancha(canchaId, callback) {
  const q = query(
    collection(db, 'partidos'),
    where('canchaId', '==', canchaId),
    where('estado', '==', 'pendiente'),
    orderBy('creadoEn', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Todos los partidos confirmados de una cancha
export function suscribirPartidosCancha(canchaId, callback) {
  const q = query(
    collection(db, 'partidos'),
    where('canchaId', '==', canchaId),
    orderBy('fechaHora', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Devuelve array de horas ocupadas ("20:00", "21:00", etc.) para una cancha en una fecha dada
export async function getHorariosOcupados(canchaId, fecha) {
  const q = query(
    collection(db, 'partidos'),
    where('canchaId', '==', canchaId),
    where('activo', '==', true),
  );
  const snap = await getDocs(q);
  const startOfDay = new Date(fecha); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay   = new Date(fecha); endOfDay.setHours(23, 59, 59, 999);
  const ocupados = [];
  snap.forEach(d => {
    const p = d.data();
    const f = new Date(p.fechaHora);
    if (f >= startOfDay && f <= endOfDay) {
      ocupados.push(`${String(f.getHours()).padStart(2,'0')}:${String(f.getMinutes()).padStart(2,'0')}`);
    }
  });
  return ocupados;
}

// Crear partido — queda en estado "pendiente" hasta que la cancha confirme
export async function crearPartido(datos, uid) {
  const ref = await addDoc(collection(db, 'partidos'), {
    ...datos,
    creadoPor: uid,
    jugadoresAnotados: 1,
    jugadores: [uid],
    activo: false,             // No visible en feed hasta que la cancha confirme
    estado: 'pendiente',       // pendiente | confirmado | en_curso | finalizado | cancelado
    pagos: {},                 // { uid: { marcadoPorOrganizador: true/false } }
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

  const nuevosAnotados = (partido.jugadoresAnotados || 0) + 1;
  const lleno = nuevosAnotados >= partido.cupoTotal;

  await updateDoc(ref, {
    jugadores: arrayUnion(uid),
    jugadoresAnotados: increment(1),
    ...(lleno ? { activo: false, estado: 'lleno' } : {}),
  });
}

// Desanotarse — umbral de 3 horas según las reglas de la plataforma
export async function desanotarseDePartido(partidoId, uid) {
  const ref = doc(db, 'partidos', partidoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Partido no encontrado');

  const partido = snap.data();
  const fechaPartido = new Date(partido.fechaHora);
  const ahora = new Date();
  const diffMs = fechaPartido - ahora;
  const tresHorasMs = 3 * 60 * 60 * 1000;
  const esMenosDeTresHoras = diffMs > 0 && diffMs < tresHorasMs;
  const yaPaso = diffMs <= 0;

  await updateDoc(ref, {
    jugadores: arrayRemove(uid),
    jugadoresAnotados: increment(-1),
    ...(partido.estado === 'lleno' ? { activo: true, estado: 'confirmado' } : {}),
  });

  // Solo penalizar si cancela con menos de 3 horas o ya pasó (no-show)
  if (esMenosDeTresHoras || yaPaso) {
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
    // No-show: baja reputación 0.5 puntos + incrementa contador
    const noShows = (userData.noShows || 0) + 1;
    updates.noShows = noShows;
    updates.reputacion = Math.max(1, (userData.reputacion || 5) - 0.5);

    if (noShows >= 3) {
      // 3 o más no-shows: bloqueo permanente
      updates.bloqueado = true;
    } else if (noShows >= 2) {
      // 2 no-shows: suspensión por 7 días
      const hasta = new Date();
      hasta.setDate(hasta.getDate() + 7);
      updates.penalizacionHasta = hasta.toISOString();
    }
  } else {
    // Cancelación con menos de 3 horas: depósito pendiente (sin penalización de reputación)
    updates.advertencia = true;
  }

  await updateDoc(userRef, updates);
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

// ─── CHAT DE PARTIDOS ────────────────────────────────────────────────────────

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

// ─── CHATS ACTIVOS DEL USUARIO ───────────────────────────────────────────────

// Partidos donde el usuario está anotado y el partido está confirmado (para la pantalla de chat)
export function suscribirMisPartidos(uid, callback) {
  const q = query(
    collection(db, 'partidos'),
    where('jugadores', 'array-contains', uid),
    orderBy('fechaHora', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// ─── RESERVAS ────────────────────────────────────────────────────────────────

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
