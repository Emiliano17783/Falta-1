import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, collection,
  query, where, orderBy, onSnapshot, addDoc,
  serverTimestamp, increment, arrayUnion, arrayRemove, getDocs,
  limit,
} from 'firebase/firestore';
import { db } from './config';

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
  const constraints = [orderBy('fechaHora'), where('activo', '==', true)];

  if (filtros.modalidad) constraints.push(where('modalidad', '==', filtros.modalidad));
  if (filtros.barrio) constraints.push(where('barrio', '==', filtros.barrio));

  const q = query(collection(db, 'partidos'), ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Admin: todos los partidos
export function suscribirTodosPartidos(callback) {
  const q = query(collection(db, 'partidos'), orderBy('fechaHora', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function crearPartido(datos, uid) {
  const ref = await addDoc(collection(db, 'partidos'), {
    ...datos,
    creadoPor: uid,
    jugadoresAnotados: 1,       // El creador ya está anotado
    jugadores: [uid],
    activo: true,
    estado: 'abierto',
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function anotarseAPartido(partidoId, uid) {
  const ref = doc(db, 'partidos', partidoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Partido no encontrado');

  const partido = snap.data();

  // Verificar si el usuario ya está anotado
  if ((partido.jugadores || []).includes(uid)) {
    throw new Error('Ya estás anotado en este partido');
  }

  // Verificar si hay lugar
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

// Desanotarse con sistema de penalización
export async function desanotarseDePartido(partidoId, uid) {
  const ref = doc(db, 'partidos', partidoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Partido no encontrado');

  const partido = snap.data();
  const fechaPartido = new Date(partido.fechaHora);
  const ahora = new Date();
  const diffMs = fechaPartido - ahora;
  const dosHorasMs = 2 * 60 * 60 * 1000;
  const esMenosDeDosHoras = diffMs > 0 && diffMs < dosHorasMs;
  const yaPaso = diffMs <= 0;

  // Sacar al jugador del partido
  await updateDoc(ref, {
    jugadores: arrayRemove(uid),
    jugadoresAnotados: increment(-1),
    // Si estaba lleno, volver a abrir
    ...(partido.estado === 'lleno' ? { activo: true, estado: 'abierto' } : {}),
  });

  // Penalizar si cancela con menos de 2 horas o el partido ya pasó (no-show)
  if (esMenosDeDosHoras || yaPaso) {
    await aplicarPenalizacion(uid);
  }
}

async function aplicarPenalizacion(uid) {
  const userRef = doc(db, 'usuarios', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const noShows = (userData.noShows || 0) + 1;
  const updates = { noShows };

  if (noShows === 1) {
    // Primera vez: advertencia
    updates.advertencia = true;
  } else if (noShows === 2) {
    // Segunda vez: ban por 1 mes
    const hasta = new Date();
    hasta.setMonth(hasta.getMonth() + 1);
    updates.penalizacionHasta = hasta.toISOString();
    updates.advertencia = false;
  } else {
    // Tercera vez y más: ban permanente
    updates.bloqueado = true;
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
