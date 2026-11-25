import { useState, useEffect } from 'react';
import {
 obtenerTodosUsuarios, suscribirTodosPartidos,
 eliminarPartidoAdmin, banearUsuario, levantarBan,
 actualizarCedulaAdmin,
} from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { validarCedula, formatearCedula } from '../utils/cedula';

export default function AdminScreen({ setTab }) {
 const { perfil } = useAuth();
 const [seccion, setSeccion] = useState('partidos');
 const [partidos, setPartidos] = useState([]);
 const [usuarios, setUsuarios] = useState([]);
 const [cargandoU, setCargandoU] = useState(false);
 const [busqueda, setBusqueda] = useState('');

 if (!perfil?.admin) {
  return (
   <div className="min-h-svh bg-f-bg flex flex-col items-center justify-center gap-4 p-8">
    <p className="text-white text-2xl font-black uppercase text-center">Acceso denegado</p>
    <p className="text-f-muted text-center">Esta sección es solo para administradores.</p>
    <button onClick={() => setTab('inicio')}
     className="mt-2 bg-f-green text-white font-black px-8 py-3 rounded-xl uppercase">
     Volver al inicio
    </button>
   </div>
  );
 }

 useEffect(() => {
  const unsub = suscribirTodosPartidos(setPartidos);
  return unsub;
 }, []);

 const cargarUsuarios = async () => {
  setCargandoU(true);
  const data = await obtenerTodosUsuarios();
  setUsuarios(data);
  setCargandoU(false);
 };

 useEffect(() => {
  if (seccion === 'usuarios') cargarUsuarios();
 }, [seccion]);

 const dosHoras = 2 * 60 * 60 * 1000;
 const pagosVencidos = partidos.filter(p => {
  if (p.pagoCanchaConfirmado) return false;
  if (p.estado === 'cancelado') return false;
  const f = new Date(p.fechaHora);
  return new Date() > new Date(f.getTime() + dosHoras);
 });

 const stats = {
  partidos: partidos.length,
  pendientes: partidos.filter(p => p.estado === 'pendiente').length,
  confirmados: partidos.filter(p => p.estado === 'confirmado').length,
  finalizados: partidos.filter(p => p.estado === 'finalizado').length,
  cancelados: partidos.filter(p => p.estado === 'cancelado').length,
  usuarios: usuarios.length,
  baneados: usuarios.filter(u => u.bloqueado || (u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date())).length,
 };

 return (
  <div className="min-h-svh bg-f-bg">
   {/* Header */}
   <div className="bg-f-surface border-b border-f-border px-6 md:px-12 pt-8 pb-5">
    <div className="flex items-center gap-3 mb-4">
     <div className="w-10 h-10 rounded-xl bg-purple-900 border border-purple-700 flex items-center justify-center">
      <span className="text-xl"></span>
     </div>
     <div>
      <h1 className="text-white font-black uppercase text-2xl">Panel Admin</h1>
      <p className="text-f-muted text-sm">Gestión de Falta 1</p>
     </div>
    </div>

    {/* Alerta pagos vencidos */}
    {pagosVencidos.length > 0 && (
     <div className="mb-4 rounded-2xl px-4 py-3"
      style={{ background: 'rgba(194,65,12,0.2)', border: '1px solid rgba(234,88,12,0.5)' }}>
      <p className="text-orange-400 font-black text-sm uppercase">
       {pagosVencidos.length} pago{pagosVencidos.length !== 1 ? 's' : ''} sin confirmar
      </p>
      <div className="mt-2 space-y-1">
       {pagosVencidos.slice(0, 5).map(p => {
        const f = new Date(p.fechaHora);
        const haceHoras = Math.floor((new Date() - f) / 3600000);
        return (
         <p key={p.id} className="text-orange-300/70 text-xs">
          · {p.nombreCancha} — {f.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })} {f.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs (hace {haceHoras}hs) — Org: {p.organizador}
         </p>
        );
       })}
       {pagosVencidos.length > 5 && (
        <p className="text-orange-400/50 text-xs">y {pagosVencidos.length - 5} más...</p>
       )}
      </div>
     </div>
    )}

    {/* Stats */}
    <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
     {[
      { label: 'Total', val: stats.partidos, color: '#54b5f0' },
      { label: 'Pend.', val: stats.pendientes, color: '#ca8a04' },
      { label: 'Conf.', val: stats.confirmados, color: '#16a34a' },
      { label: 'Fin.', val: stats.finalizados, color: '#6b7280' },
      { label: 'Canc.', val: stats.cancelados, color: '#dc2626' },
      { label: 'Usuarios', val: stats.usuarios, color: '#a78bfa' },
      { label: 'Suspendidos', val: stats.baneados, color: '#f97316' },
     ].map(s => (
      <div key={s.label} className="bg-f-card border border-f-border rounded-xl p-3 text-center">
       <p className="font-black text-xl" style={{ color: s.color }}>{s.val}</p>
       <p className="text-f-muted text-xs font-bold uppercase">{s.label}</p>
      </div>
     ))}
    </div>

    {/* Tabs */}
    <div className="flex gap-2 flex-wrap">
     {[
      { id: 'partidos', label: 'Partidos' },
      { id: 'usuarios', label: 'Usuarios' },
     ].map(t => (
      <button key={t.id} onClick={() => setSeccion(t.id)}
       className={`px-5 py-2 rounded-lg font-bold text-sm uppercase border transition-all
       ${seccion === t.id ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
       {t.label}
      </button>
     ))}
    </div>
   </div>

   <div className="px-4 md:px-12 py-6">
    {seccion === 'partidos' && <SeccionPartidos partidos={partidos} />}
    {seccion === 'usuarios' && (
     <SeccionUsuarios usuarios={usuarios} cargando={cargandoU}
      busqueda={busqueda} setBusqueda={setBusqueda}
      onRecargar={cargarUsuarios} />
    )}
   </div>
  </div>
 );
}

/* Sección Partidos */
const ESTADO_CONFIG = {
 pendiente: { label: 'Pendiente', bg: 'bg-yellow-950', border: 'border-yellow-800', text: 'text-yellow-300' },
 confirmado: { label: 'Confirmado', bg: 'bg-green-950', border: 'border-green-800', text: 'text-green-300' },
 en_curso: { label: 'En curso', bg: 'bg-blue-950', border: 'border-blue-800', text: 'text-blue-300' },
 finalizado: { label: 'Finalizado', bg: 'bg-f-surface', border: 'border-f-border', text: 'text-f-muted' },
 cancelado: { label: 'Cancelado', bg: 'bg-red-950', border: 'border-red-800', text: 'text-red-400' },
 lleno: { label: 'Lleno', bg: 'bg-orange-950', border: 'border-orange-800', text: 'text-orange-300' },
};

function SeccionPartidos({ partidos }) {
 const [filtro, setFiltro] = useState('todos');

 const filtrados = filtro === 'todos' ? partidos
  : partidos.filter(p => p.estado === filtro);

 const counts = {
  todos: partidos.length,
  pendiente: partidos.filter(p => p.estado === 'pendiente').length,
  confirmado: partidos.filter(p => p.estado === 'confirmado').length,
  finalizado: partidos.filter(p => p.estado === 'finalizado').length,
  cancelado: partidos.filter(p => p.estado === 'cancelado').length,
 };

 const handleEliminar = async (id) => {
  if (!confirm('¿Eliminar este partido?')) return;
  await eliminarPartidoAdmin(id);
 };

 return (
  <div>
   {/* Filtros rápidos */}
   <div className="flex gap-2 flex-wrap mb-4">
    {[
     { id: 'todos', label: `Todos (${counts.todos})` },
     { id: 'pendiente', label: `Pendientes (${counts.pendiente})` },
     { id: 'confirmado', label: `Confirmados (${counts.confirmado})` },
     { id: 'finalizado', label: `Finalizados (${counts.finalizado})` },
     { id: 'cancelado', label: `Cancelados (${counts.cancelado})` },
    ].map(f => (
     <button key={f.id} onClick={() => setFiltro(f.id)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
      ${filtro === f.id ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
      {f.label}
     </button>
    ))}
   </div>

   <div className="space-y-3">
    {filtrados.length === 0 && (
     <p className="text-f-muted text-center py-12">No hay partidos en este estado.</p>
    )}
    {filtrados.map(p => {
     const fecha = new Date(p.fechaHora);
     const deporte = p.deporte === 'padel' ? 'Pádel' : 'Fútbol';
     const estadoCfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.cancelado;
     const pagoJugadores = Object.values(p.pagos || {}).filter(v => v.marcadoPorOrganizador).length;
     const totalJugadores = p.jugadoresAnotados || 0;

     return (
      <div key={p.id} className="card overflow-hidden">
       <div className="h-1 w-full"
        style={{ background: p.estado === 'confirmado' ? '#16a34a' : p.estado === 'pendiente' ? '#ca8a04' : p.estado === 'cancelado' ? '#dc2626' : p.estado === 'finalizado' ? '#374151' : '#2563eb' }} />

       <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
         <div className="min-w-0">
          <div className="flex items-center gap-2">
           <span className="text-lg">{deporte}</span>
           <p className="text-white font-black text-base leading-tight truncate">{p.nombreCancha}</p>
          </div>
          <p className="text-f-muted text-xs mt-0.5">{p.barrio} · {p.modalidad} · Nivel: {p.nivel || '—'}</p>
         </div>
         <span className={`text-xs font-black px-2.5 py-1 rounded-lg border flex-shrink-0 ${estadoCfg.bg} ${estadoCfg.border} ${estadoCfg.text}`}>
          {estadoCfg.label}
         </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
         <div className="bg-f-bg rounded-lg px-2 py-2">
          <p className="text-white text-xs font-black">
           {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
          </p>
          <p className="text-f-muted text-xs">
           {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
          </p>
         </div>
         <div className="bg-f-bg rounded-lg px-2 py-2">
          <p className="text-white text-xs font-black">{p.jugadoresAnotados}/{p.cupoTotal}</p>
          <p className="text-f-muted text-xs">Jugadores</p>
         </div>
         <div className="bg-f-bg rounded-lg px-2 py-2">
          <p className="text-white text-xs font-black truncate">{p.organizador || '—'}</p>
          <p className="text-f-muted text-xs">Organizador</p>
         </div>
        </div>

        <div className="flex items-center justify-between gap-3">
         <div className="flex gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border
          ${p.pagoCanchaConfirmado
           ? 'bg-green-950 border-green-800 text-green-300'
           : 'bg-f-surface border-f-border text-f-muted'}`}>
           {p.pagoCanchaConfirmado ? ' Pago confirmado' : ' Pago pendiente'}
          </span>
          {totalJugadores > 0 && (
           <span className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-f-surface border-f-border text-f-muted">
            {pagoJugadores}/{totalJugadores} pagaron
           </span>
          )}
         </div>
         {p.precioPorJugador > 0 && (
          <span className="text-f-accent text-xs font-bold flex-shrink-0">
           ${p.precioPorJugador?.toLocaleString('es-UY')}/jug
          </span>
         )}
        </div>

        {p.estado === 'cancelado' && p.motivoRechazo && (
         <p className="text-red-400 text-xs bg-red-950/50 rounded-lg px-3 py-2">
          Motivo: {p.motivoRechazo}
         </p>
        )}

        <button onClick={() => handleEliminar(p.id)}
         className="w-full py-2 rounded-xl border border-red-900/50 text-red-500 text-xs font-bold
         hover:bg-red-950 transition-colors active:scale-95">
         Eliminar partido
        </button>
       </div>
      </div>
     );
    })}
   </div>
  </div>
 );
}

/* Sección Usuarios */
function SeccionUsuarios({ usuarios, cargando, busqueda, setBusqueda, onRecargar }) {
 const [confirmarAccion, setConfirmarAccion] = useState(null);
 const [toastMsg, setToastMsg] = useState(null);
 const [ejecutando, setEjecutando] = useState(false);
 const [editarCedulaUid, setEditarCedulaUid] = useState(null);
 const [nuevaCedula, setNuevaCedula] = useState('');
 const nuevaCedulaValida = validarCedula(nuevaCedula);

 const mostrarToast = (msg) => {
  setToastMsg(msg);
  setTimeout(() => setToastMsg(null), 3500);
 };

 const pedirConfirmacion = (uid, tipo, nombre) => {
  setConfirmarAccion({ uid, tipo, nombre });
 };

 const ejecutarAccion = async () => {
  if (!confirmarAccion || ejecutando) return;
  const { uid, tipo } = confirmarAccion;
  setEjecutando(true);
  setConfirmarAccion(null);
  try {
   if (tipo === 'quitarBan') {
    await levantarBan(uid);
    mostrarToast('Ban levantado correctamente');
   } else if (tipo === 'quitarSuspension') {
    await levantarBan(uid);
    mostrarToast('Suspensión levantada correctamente');
   } else if (tipo === 'suspender') {
    await banearUsuario(uid, false);
    mostrarToast('Usuario suspendido por 1 mes');
   } else if (tipo === 'banear') {
    await banearUsuario(uid, true);
    mostrarToast('Usuario baneado permanentemente');
   }
   onRecargar();
  } catch {
   mostrarToast('Error al ejecutar la acción');
  }
  setEjecutando(false);
 };

 const handleGuardarCedula = async () => {
  if (!editarCedulaUid || !nuevaCedulaValida) return;
  setEjecutando(true);
  try {
   await actualizarCedulaAdmin(editarCedulaUid.uid, editarCedulaUid.cedulaActual || null, nuevaCedula);
   mostrarToast('Cédula actualizada correctamente');
   setEditarCedulaUid(null);
   setNuevaCedula('');
   onRecargar();
  } catch (err) {
   mostrarToast(err.message || 'Error al actualizar la cédula');
  }
  setEjecutando(false);
 };

 const filtrados = usuarios.filter(u =>
  !busqueda || u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
  u.email?.toLowerCase().includes(busqueda.toLowerCase())
 );

 const textoConfirmacion = {
  banear: (n) => `¿Banear permanentemente a "${n}"?\nNo podrá acceder a la app hasta que levantes el ban.`,
  suspender: (n) => `¿Suspender 1 mes a "${n}"?\nNo podrá crear ni unirse a partidos durante 30 días.`,
  quitarBan: (n) => `¿Quitar el ban permanente de "${n}"?\nPodrá volver a usar la app normalmente.`,
  quitarSuspension: (n) => `¿Quitar la suspensión de "${n}"?\nPodrá volver a crear y unirse a partidos.`,
 };

 const colorConfirmacion = {
  banear: '#dc2626', suspender: '#ea580c',
  quitarBan: '#16a34a', quitarSuspension: '#16a34a',
 };

 return (
  <div>
   {/* Toast de éxito/error */}
   {toastMsg && (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-black text-sm text-white shadow-xl animate-fade-in whitespace-nowrap"
     style={{ background: toastMsg.startsWith('Error') ? '#b91c1c' : '#16a34a' }}>
     {toastMsg}
    </div>
   )}

   {/* Modal de confirmación */}
   {confirmarAccion && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
     style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
     <div className="bg-f-card border border-f-border rounded-2xl p-6 w-full max-w-sm animate-fade-in">
      <h3 className="text-white font-black text-lg uppercase mb-3">Confirmar acción</h3>
      <p className="text-f-muted text-sm leading-relaxed mb-6 whitespace-pre-line">
       {textoConfirmacion[confirmarAccion.tipo]?.(confirmarAccion.nombre)}
      </p>
      <div className="flex gap-3">
       <button onClick={() => setConfirmarAccion(null)}
        className="flex-1 py-3 rounded-xl border border-f-border text-f-muted font-bold text-sm uppercase">
        Cancelar
       </button>
       <button onClick={ejecutarAccion} disabled={ejecutando}
        className="flex-1 py-3 rounded-xl font-black text-sm uppercase text-white transition-all active:scale-95 disabled:opacity-50"
        style={{ background: colorConfirmacion[confirmarAccion.tipo] }}>
        {ejecutando ? '...' : 'Confirmar'}
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Modal: editar cédula (solo admin) */}
   {editarCedulaUid && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
     style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
     <div className="bg-f-card border border-f-border rounded-2xl p-6 w-full max-w-sm animate-fade-in">
      <h3 className="text-white font-black text-lg uppercase mb-1">Editar cédula</h3>
      <p className="text-f-muted text-sm mb-1">
       Usuario: <span className="text-white">{editarCedulaUid.nombre}</span>
      </p>
      {editarCedulaUid.cedulaActual && (
       <p className="text-f-muted text-xs mb-4">
        Cédula actual: <span className="text-white">{formatearCedula(editarCedulaUid.cedulaActual)}</span>
       </p>
      )}
      <input
       type="text"
       inputMode="numeric"
       value={nuevaCedula}
       onChange={e => setNuevaCedula(e.target.value.replace(/\D/g, '').slice(0, 8))}
       placeholder="Nueva cédula (sin puntos ni guión)"
       autoFocus
       className="w-full bg-f-bg border border-f-border rounded-xl px-4 py-2.5
       text-white text-sm outline-none focus:border-f-accent mb-1" />
      {nuevaCedula && nuevaCedula.length >= 7 && !nuevaCedulaValida && (
       <p className="text-red-400 text-xs mb-3 px-1">La cédula ingresada no es válida.</p>
      )}
      {nuevaCedulaValida && (
       <p className="text-green-400 text-xs mb-3 px-1 font-bold">{formatearCedula(nuevaCedula)}</p>
      )}
      <div className="flex gap-3 mt-2">
       <button onClick={() => { setEditarCedulaUid(null); setNuevaCedula(''); }}
        className="flex-1 py-3 rounded-xl border border-f-border text-f-muted font-bold text-sm uppercase">
        Cancelar
       </button>
       <button onClick={handleGuardarCedula} disabled={!nuevaCedulaValida || ejecutando}
        className="flex-1 py-3 rounded-xl font-black text-sm uppercase text-white transition-all active:scale-95 disabled:opacity-40"
        style={{ background: '#0ea5e9' }}>
        {ejecutando ? '...' : 'Guardar'}
       </button>
      </div>
     </div>
    </div>
   )}

   <div className="relative mb-4 max-w-md">
    <input type="text" placeholder="Buscar usuario..."
     value={busqueda} onChange={e => setBusqueda(e.target.value)}
     className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
     text-white text-sm placeholder:text-f-muted outline-none focus:border-f-accent" />
   </div>

   {cargando ? (
    <div className="flex justify-center py-12">
     <div className="w-10 h-10 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom" />
    </div>
   ) : (
    <div className="space-y-3">
     {filtrados.map(u => {
      const esBaneado = u.bloqueado;
      const esSuspendido = !u.bloqueado && u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date();
      const suspendido = esBaneado || esSuspendido;
      const diasRestantes = esSuspendido
       ? Math.ceil((new Date(u.penalizacionHasta) - new Date()) / 86400000)
       : 0;
      return (
       <div key={u.id} className="card p-4 flex items-center gap-3">
        {u.foto
         ? <img src={u.foto} alt={u.nombre} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
         : <div className="w-10 h-10 rounded-full bg-f-green flex items-center justify-center text-white font-black flex-shrink-0">
          {(u.nombre || '?')[0].toUpperCase()}
         </div>
        }
        <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-bold truncate">{u.nombre}</p>
          {u.admin && <span className="text-xs bg-purple-900 border border-purple-700 text-purple-300 px-2 py-0.5 rounded font-bold">ADMIN</span>}
          {esBaneado && <span className="text-xs bg-red-950 border border-red-800 text-red-400 px-2 py-0.5 rounded font-bold">BANEADO</span>}
          {esSuspendido && (
           <span className="text-xs bg-orange-950 border border-orange-800 text-orange-400 px-2 py-0.5 rounded font-bold">
            SUSPENDIDO · {diasRestantes}d
           </span>
          )}
          {u.advertencia && !suspendido && <span className="text-xs bg-yellow-950 border border-yellow-800 text-yellow-400 px-2 py-0.5 rounded font-bold"> Advertencia</span>}
         </div>
         <p className="text-f-muted text-xs truncate">{u.email}</p>
         {u.cedula
          ? <p className="text-f-muted text-xs">CI {formatearCedula(u.cedula)}</p>
          : <p className="text-orange-400 text-xs font-bold">Sin cédula</p>
         }
         <p className="text-f-muted text-xs">Partidos: {u.partidosJugados} · No-shows: {u.noShows || 0}</p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
         <button onClick={() => { setEditarCedulaUid({ uid: u.id, cedulaActual: u.cedula || null, nombre: u.nombre }); setNuevaCedula(''); }}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 active:scale-95">
          Editar CI
         </button>
         {esBaneado ? (
          <button onClick={() => pedirConfirmacion(u.id, 'quitarBan', u.nombre)}
           className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 active:scale-95">
           Quitar ban
          </button>
         ) : esSuspendido ? (
          <button onClick={() => pedirConfirmacion(u.id, 'quitarSuspension', u.nombre)}
           className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 active:scale-95">
           Quitar suspensión
          </button>
         ) : (
          <>
           <button onClick={() => pedirConfirmacion(u.id, 'suspender', u.nombre)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-950 border border-orange-800 text-orange-400 active:scale-95">
            Suspender 1 mes
           </button>
           <button onClick={() => pedirConfirmacion(u.id, 'banear', u.nombre)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-950 border border-red-800 text-red-400 active:scale-95">
            Banear permanente
           </button>
          </>
         )}
        </div>
       </div>
      );
     })}
     {filtrados.length === 0 && (
      <p className="text-f-muted text-center py-8">No se encontraron usuarios.</p>
     )}
    </div>
   )}
  </div>
 );
}
