import {
  doc, setDoc, getDoc, updateDoc, collection,
  query, where, orderBy, onSnapshot, addDoc,
  serverTimestamp, increment, arrayUnion, getDocs,
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
      insignias: [],
      penalizacionHasta: null,
      bloqueado: false,
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

// ─── PARTIDOS ────────────────────────────────────────────────────────────────

export function suscribirPartidos(callback, filtros = {}) {
  let q = collection(db, 'partidos');
  const constraints = [orderBy('fechaHora'), where('activo', '==', true)];

  if (filtros.modalidad) {
    constraints.push(where('modalidad', '==', filtros.modalidad));
  }
  if (filtros.barrio) {
    constraints.push(where('barrio', '==', filtros.barrio));
  }

  q = query(collection(db, 'partidos'), ...constraints);
  return onSnapshot(q, (snap) => {
    const partidos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(partidos);
  });
}

export async function crearPartido(datos, uid) {
  const ref = await addDoc(collection(db, 'partidos'), {
    ...datos,
    creadoPor: uid,
    jugadoresAnotados: 0,
    jugadores: [],
    activo: true,
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function anotarseAPartido(partidoId, uid) {
  const ref = doc(db, 'partidos', partidoId);
  await updateDoc(ref, {
    jugadores: arrayUnion(uid),
    jugadoresAnotados: increment(1),
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
