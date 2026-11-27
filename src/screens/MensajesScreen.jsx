import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
 buscarJugadores,
 suscribirConversaciones,
 suscribirMensajesDirectos,
 enviarMensajeDirecto,
 marcarConversacionLeida,
 bloquearJugador,
 silenciarConversacion,
 ocultarConversacion,
} from '../firebase/firestore';

// ── Context menu de conversación ───────────────────────────────────────────────
function ContextMenuConv({ data, uid, onClose }) {
 const { conv, x, y } = data;
 const isMuted = !!conv.silenciados?.[uid];
 const otroUid = conv.participantes?.find(p => p !== uid);
 const isMobile = x === undefined;

 const handleMute = async () => {
  await silenciarConversacion(conv.id, uid, !isMuted);
  onClose();
 };

 const handleHide = async () => {
  await ocultarConversacion(conv.id, uid);
  onClose();
 };

 const handleBlock = async () => {
  if (otroUid) await bloquearJugador(uid, otroUid);
  await ocultarConversacion(conv.id, uid);
  onClose();
 };

 const menuStyle = isMobile
  ? { bottom: 32, left: 16, right: 16 }
  : {
   top: Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 170),
   left: Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 230),
   minWidth: 220,
  };

 return (
  <div className="fixed inset-0 z-50" onClick={onClose}
   style={{ background: 'rgba(0,0,0,0.5)' }}>
   <div className="absolute bg-f-card border border-f-border rounded-2xl overflow-hidden shadow-2xl"
    style={menuStyle}
    onClick={e => e.stopPropagation()}>

    <button onClick={handleMute}
     className="w-full flex items-center gap-3 px-5 py-4 text-left border-b active:bg-white/5 transition-colors"
     style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-f-muted flex-shrink-0">
      {isMuted
       ? <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z"/>
       : <path d="M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.43.12L18 11.68v3z"/>
      }
     </svg>
     <span className="font-bold text-sm text-white">
      {isMuted ? 'Activar notificaciones' : 'Silenciar conversación'}
     </span>
    </button>

    <button onClick={handleHide}
     className="w-full flex items-center gap-3 px-5 py-4 text-left border-b active:bg-white/5 transition-colors"
     style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-f-muted flex-shrink-0">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
     </svg>
     <span className="font-bold text-sm text-white">Eliminar chat</span>
    </button>

    <button onClick={handleBlock}
     className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-white/5 transition-colors">
     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-red-400 flex-shrink-0">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
     </svg>
     <span className="font-bold text-sm text-red-400">Bloquear usuario</span>
    </button>
   </div>
  </div>
 );
}

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
  marcarConversacionLeida(conv.id, uid);
 }, [conv.id, uid]);

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
 const [contextMenu, setContextMenu] = useState(null);
 const longPressTimer = useRef(null);
 const longPressOccurred = useRef(false);

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

 const startLongPress = (conv) => {
  longPressOccurred.current = false;
  longPressTimer.current = setTimeout(() => {
   longPressOccurred.current = true;
   setContextMenu({ conv });
  }, 500);
 };

 const cancelLongPress = () => {
  clearTimeout(longPressTimer.current);
  longPressTimer.current = null;
 };

 const handleConvClick = (conv) => {
  if (longPressOccurred.current) {
   longPressOccurred.current = false;
   return;
  }
  abrirConvExistente(conv);
 };

 const handleConvContextMenu = (e, conv) => {
  e.preventDefault();
  cancelLongPress();
  setContextMenu({ conv, x: e.clientX, y: e.clientY });
 };

 const convsVisibles = convs?.filter(c => !c.ocultosPara?.[uid]);

 if (vista === 'chat' && convActiva) {
  return <Conversacion conv={convActiva} uid={uid} perfil={perfil}
   onBack={() => setVista('main')} />;
 }

 return (
  <div className="min-h-svh bg-f-bg pb-28">

   {contextMenu && (
    <ContextMenuConv
     data={contextMenu}
     uid={uid}
     onClose={() => setContextMenu(null)}
    />
   )}

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
     ) : convsVisibles.length === 0 ? (
      <div className="text-center py-16 px-8">
       <p className="text-4xl mb-3">💬</p>
       <p className="text-white font-bold text-base mb-1">Sin conversaciones</p>
       <p className="text-f-muted text-sm">Buscá un jugador arriba para enviarle un mensaje.</p>
      </div>
     ) : (
      <div className="border-t border-f-border">
       {convsVisibles.map(conv => {
        const otroUid = conv.participantes?.find(p => p !== uid);
        const nombre = conv.nombres?.[otroUid] || 'Jugador';
        const foto = conv.fotos?.[otroUid];
        const ultimo = conv.ultimoMensaje || '';
        const fecha = conv.ultimaFecha?.toDate?.();
        const noLeidos = conv.noLeidos?.[uid] || 0;
        const isMuted = !!conv.silenciados?.[uid];
        return (
         <button key={conv.id}
          onClick={() => handleConvClick(conv)}
          onContextMenu={(e) => handleConvContextMenu(e, conv)}
          onTouchStart={() => startLongPress(conv)}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          className="w-full flex items-center gap-4 px-5 py-4 border-b active:bg-white/5 transition-colors text-left"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="w-12 h-12 rounded-full bg-f-green flex items-center justify-center overflow-hidden flex-shrink-0">
           {foto
            ? <img src={foto} alt={nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            : <span className="text-white font-black text-lg">{nombre[0]?.toUpperCase()}</span>
           }
          </div>
          <div className="flex-1 min-w-0">
           <p className={`text-sm truncate ${noLeidos > 0 ? 'text-white font-black' : 'text-white font-bold'}`}>{nombre}</p>
           <p className={`text-xs truncate mt-0.5 ${noLeidos > 0 ? 'text-white/70' : 'text-f-muted'}`}>{ultimo}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
           {fecha && (
            <span className="text-f-muted text-[10px]">
             {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
            </span>
           )}
           {isMuted && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-f-muted opacity-50">
             <path d="M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42v5l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.43.12L18 11.68v3z"/>
            </svg>
           )}
           {noLeidos > 0 && (
            <span className="rounded-full flex items-center justify-center text-white font-black"
             style={{ background: '#ef4444', fontSize: 10, minWidth: 18, height: 18, paddingLeft: 4, paddingRight: 4 }}>
             {noLeidos > 9 ? '9+' : noLeidos}
            </span>
           )}
          </div>
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
