import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
 buscarJugadores,
 suscribirConversaciones,
 suscribirMensajesDirectos,
 enviarMensajeDirecto,
} from '../firebase/firestore';

// ── Chat individual ────────────────────────────────────────────────────────────
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
  } finally { setEnviando(false); }
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

// ── Pantalla principal ─────────────────────────────────────────────────────────
export default function MensajesScreen() {
 const { user, perfil } = useAuth();
 const uid = user?.uid;

 const [vista, setVista] = useState('main');
 const [convActiva, setConvActiva] = useState(null);
 const [convs, setConvs] = useState(null);
 const [textoBusqueda, setTextoBusqueda] = useState('');
 const [resultados, setResultados] = useState([]);
 const [buscando, setBuscando] = useState(false);
 const [buscado, setBuscado] = useState(false);

 useEffect(() => {
  if (!uid) return;
  return suscribirConversaciones(uid, setConvs);
 }, [uid]);

 const handleBuscar = async () => {
  if (!textoBusqueda.trim()) return;
  setBuscando(true);
  const res = await buscarJugadores(textoBusqueda);
  setResultados(res.filter(u => u.id !== uid));
  setBuscado(true);
  setBuscando(false);
 };

 const limpiarBusqueda = () => {
  setTextoBusqueda('');
  setResultados([]);
  setBuscado(false);
 };

 const abrirConvConJugador = (jugador) => {
  setConvActiva({
   id: [uid, jugador.id].sort().join('_'),
   otroUid: jugador.id,
   otroNombre: jugador.nombre,
   otroFoto: jugador.foto || null,
  });
  limpiarBusqueda();
  setVista('chat');
 };

 const abrirConvExistente = (conv) => {
  const otroUid = conv.participantes?.find(p => p !== uid);
  setConvActiva({
   id: conv.id,
   otroUid,
   otroNombre: conv.nombres?.[otroUid] || 'Jugador',
   otroFoto: conv.fotos?.[otroUid] || null,
  });
  setVista('chat');
 };

 if (vista === 'chat' && convActiva) {
  return <Conversacion conv={convActiva} uid={uid} perfil={perfil}
   onBack={() => setVista('main')} />;
 }

 return (
  <div className="min-h-svh bg-f-bg pb-28">

   {/* Header */}
   <div className="px-5 pt-10 pb-4">
    <h1 className="text-f-text font-black text-2xl uppercase tracking-tight">Mensajes</h1>
   </div>

   {/* Buscar jugador */}
   <div className="px-5 pb-2">
    <div className="flex gap-2">
     <input
      type="text"
      value={textoBusqueda}
      onChange={e => { setTextoBusqueda(e.target.value); if (!e.target.value) limpiarBusqueda(); }}
      onKeyDown={e => e.key === 'Enter' && handleBuscar()}
      placeholder="Buscar jugador por nombre o @usuario..."
      className="flex-1 bg-f-card border border-f-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-f-muted focus:outline-none focus:border-f-accent"
     />
     <button onClick={handleBuscar} disabled={buscando || !textoBusqueda.trim()}
      className="px-5 py-3 rounded-xl font-black text-sm uppercase disabled:opacity-50"
      style={{ background: '#0ea5e9', color: '#000' }}>
      {buscando ? '...' : 'Buscar'}
     </button>
    </div>
   </div>

   {/* Resultados de búsqueda */}
   {buscado && (
    <div className="px-5 py-3">
     <div className="flex items-center justify-between mb-2">
      <p className="text-f-muted text-xs font-black uppercase tracking-widest">Resultados</p>
      <button onClick={limpiarBusqueda} className="text-f-muted text-xs underline">Limpiar</button>
     </div>
     {resultados.length === 0
      ? <p className="text-f-muted text-sm text-center py-6">No se encontraron jugadores.</p>
      : (
       <div className="space-y-2">
        {resultados.map(j => (
         <button key={j.id} onClick={() => abrirConvConJugador(j)}
          className="w-full flex items-center gap-3 p-3 bg-f-card border border-f-border rounded-xl active:bg-f-bg transition-colors">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-f-green flex items-center justify-center">
           {j.foto
            ? <img src={j.foto} alt={j.nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            : <span className="text-white font-black">{(j.nombre || 'J')[0].toUpperCase()}</span>
           }
          </div>
          <div className="flex-1 min-w-0 text-left">
           <p className="text-white font-bold text-sm truncate">{j.nombre}</p>
           <p className="text-f-muted text-xs truncate">
            {j.nombreUsuario ? `@${j.nombreUsuario} · ` : ''}{j.ciudad || 'Montevideo'}
           </p>
          </div>
          <span className="text-xs font-black uppercase px-3 py-1 rounded-lg"
           style={{ background: '#0ea5e9', color: '#000' }}>
           Mensaje
          </span>
         </button>
        ))}
       </div>
      )
     }
    </div>
   )}

   {/* Conversaciones existentes */}
   {!buscado && (
    <>
     <p className="text-f-muted text-xs font-black uppercase tracking-widest px-5 pt-3 pb-2">Conversaciones</p>
     {convs === null ? (
      <div className="flex justify-center py-16">
       <div className="w-8 h-8 rounded-full border-2 border-f-accent border-t-transparent animate-spin" />
      </div>
     ) : convs.length === 0 ? (
      <div className="text-center py-16 px-8">
       <p className="text-4xl mb-3">💬</p>
       <p className="text-white font-bold text-base mb-1">Sin conversaciones</p>
       <p className="text-f-muted text-sm">Buscá un jugador arriba para enviarle un mensaje.</p>
      </div>
     ) : (
      <div className="border-t border-f-border">
       {convs.map(conv => {
        const otroUid = conv.participantes?.find(p => p !== uid);
        const nombre = conv.nombres?.[otroUid] || 'Jugador';
        const foto = conv.fotos?.[otroUid];
        const ultimo = conv.ultimoMensaje || '';
        const fecha = conv.ultimaFecha?.toDate?.();
        return (
         <button key={conv.id} onClick={() => abrirConvExistente(conv)}
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
    </>
   )}
  </div>
 );
}
