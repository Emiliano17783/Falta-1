import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';


export default function HomeScreen({ setTab }) {
 const { perfil } = useAuth();
 const [partidosMvd, setPartidosMvd] = useState(null);
 const [partidosFlores, setPartidosFlores] = useState(null);
 const [jugadoresMvd, setJugadoresMvd] = useState(null);
 const [jugadoresFlores, setJugadoresFlores] = useState(null);

 const estaBaneado = perfil?.bloqueado || (
 perfil?.penalizacionHasta && new Date(perfil.penalizacionHasta) > new Date()
 );

 // Partidos activos hoy, separados por ciudad (tiempo real)
 useEffect(() => {
 try {
 const q = query(collection(db, 'partidos'), where('activo', '==', true));
 return onSnapshot(q, snap => {
 const hoy = new Date().toDateString();
 const hoyDocs = snap.docs.filter(d => {
  const f = d.data().fechaHora;
  return f && new Date(f).toDateString() === hoy;
 });
 setPartidosMvd(hoyDocs.filter(d => d.data().ciudad !== 'Flores').length);
 setPartidosFlores(hoyDocs.filter(d => d.data().ciudad === 'Flores').length);
 });
 } catch { return () => {}; }
 }, []);

 // Jugadores registrados por ciudad
 useEffect(() => {
 getDocs(collection(db, 'usuarios'))
 .then(snap => {
  const datos = snap.docs.map(d => d.data());
  setJugadoresMvd(datos.filter(u => u.ciudad !== 'Flores').length);
  setJugadoresFlores(datos.filter(u => u.ciudad === 'Flores').length);
 })
 .catch(() => { setJugadoresMvd(0); setJugadoresFlores(0); });
 }, []);

 return (
 <div className="min-h-svh bg-f-bg">

 {/* Banner baneado */}
 {estaBaneado && (
 <div className="bg-red-950 border-b border-red-800 px-5 py-3 flex items-center gap-3">
 <span className="text-red-400 text-lg flex-shrink-0"></span>
 <p className="text-red-300 font-bold text-sm">
 {perfil?.bloqueado
 ? 'Cuenta bloqueada. Contactá al soporte.'
 : `Suspendido hasta el ${new Date(perfil.penalizacionHasta).toLocaleDateString('es-UY')}.`}
 </p>
 </div>
 )}
 {perfil?.advertencia && !estaBaneado && (
 <div className="bg-yellow-950 border-b border-yellow-800 px-5 py-3 flex items-center gap-3">
 <span className="text-yellow-400 flex-shrink-0"></span>
 <p className="text-yellow-300 text-sm font-medium">
 Depósito pendiente por cancelación tardía.
 </p>
 </div>
 )}

 {/* HERO */}
 <div className="relative overflow-hidden flex flex-col justify-between"
 style={{ background: '#0c0c0c', height: '50vh', minHeight: 280 }}>
 <video autoPlay muted loop playsInline preload="metadata" poster="/hero-poster.jpg"
 className="absolute inset-0 w-full h-full object-cover pointer-events-none"
 style={{ opacity: 0.6 }}>
 <source src="/hero.mp4" type="video/mp4" />
 </video>
 <div className="absolute inset-0 pointer-events-none"
 style={{ background: 'linear-gradient(to bottom, rgba(12,12,12,0.15) 0%, rgba(12,12,12,0.65) 100%)' }} />
 <div className="relative z-10 px-5 md:px-12 pt-6">
 <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] leading-none mb-0.5">
 ¿te falta
 </p>
 <h1 className="font-black uppercase leading-none text-white"
 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 0.9 }}>
 UN <span style={{ color: '#0ea5e9' }}>JUGADOR</span>?
 </h1>
 </div>
 <div className="relative z-10">
 <button onClick={() => setTab?.('crear')}
 className="w-full py-4 flex items-center justify-between px-6 md:px-12 font-black text-xl uppercase transition-all active:brightness-90"
 style={{ background: '#0ea5e9', color: '#0c0c0c' }}>
 <span>+ CREAR PARTIDO</span>
 <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
 <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
 </svg>
 </button>
 <button onClick={() => setTab?.('unirse')}
 className="w-full py-4 flex items-center justify-between px-6 md:px-12 font-black text-xl uppercase transition-all active:brightness-90"
 style={{ background: '#0ea5e9', color: '#0c0c0c', borderTop: '1px solid rgba(0,0,0,0.15)' }}>
 <span>UNIRME A UN PARTIDO</span>
 <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
 <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
 </svg>
 </button>
 </div>
 </div>

 {/* ESTADÍSTICAS EN VIVO */}
 <div className="px-5 md:px-12 py-8 border-b border-f-border" style={{ background: '#0e0e0e' }}>
 <p className="text-f-muted text-[11px] uppercase tracking-[0.2em] mb-5">En este momento</p>
 <div className="space-y-6">
  <div>
  <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-1">Montevideo</p>
  <p className="text-f-text leading-snug" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>
   Hoy hay{' '}
   <span className="font-black text-white" style={{ fontSize: 'clamp(2.2rem, 6vw, 3rem)', lineHeight: 1, letterSpacing: '-0.03em' }}>
   {partidosMvd ?? '—'}
   </span>{' '}
   {(partidosMvd ?? 0) === 1 ? 'partido activo' : 'partidos activos'}
  </p>
  <p className="text-f-muted text-sm mt-1">
   <span className="text-f-text font-bold">{jugadoresMvd ?? '—'}</span> jugadores registrados
  </p>
  </div>
  <div>
  <p className="text-f-muted text-xs font-bold uppercase tracking-widest mb-1">Flores</p>
  <p className="text-f-text leading-snug" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)' }}>
   Hoy hay{' '}
   <span className="font-black text-white" style={{ fontSize: 'clamp(2.2rem, 6vw, 3rem)', lineHeight: 1, letterSpacing: '-0.03em' }}>
   {partidosFlores ?? '—'}
   </span>{' '}
   {(partidosFlores ?? 0) === 1 ? 'partido activo' : 'partidos activos'}
  </p>
  <p className="text-f-muted text-sm mt-1">
   <span className="text-f-text font-bold">{jugadoresFlores ?? '—'}</span> jugadores registrados
  </p>
  </div>
 </div>
 </div>

 </div>
 );
}
