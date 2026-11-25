import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useMatch, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import {
 suscribirMisPartidos,
 suscribirPartidosParaConfirmar,
 marcarNotificacionIncompleto,
 confirmarPartidoIncompleto,
 cancelarPartidoAutomatico,
} from './firebase/firestore';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CanchasScreen from './screens/CanchasScreen';
import CrearScreen from './screens/CrearScreen';
import PerfilScreen from './screens/PerfilScreen';
import AdminScreen from './screens/AdminScreen';
import CanchaPanel from './screens/CanchaPanel';
import MatchDetailScreen from './screens/MatchDetailScreen';
import UnirseScreen from './screens/UnirseScreen';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import ChatModal from './modals/ChatModal';
import ConfirmacionAsistenciaModal from './modals/ConfirmacionAsistenciaModal';

const TAB_PATHS = {
 inicio: '/',
 canchas: '/canchas',
 crear: '/crear',
 unirse: '/unirme',
 perfil: '/perfil',
 admin: '/admin',
};

const PATH_TO_TAB = {
 '/': 'inicio',
 '/canchas': 'canchas',
 '/crear': 'crear',
 '/unirme': 'unirse',
 '/perfil': 'perfil',
 '/admin': 'admin',
};

export default function App() {
 const { user, perfil, loading, esCancha, esAdmin, logout } = useAuth();
 const navigate = useNavigate();
 const location = useLocation();
 const partidoMatch = useMatch('/partidos/:id');

 const [canchaParaPartido, setCanchaParaPartido] = useState(null);
 const [chatPartido, setChatPartido] = useState(null);
 const [toastGlobal, setToastGlobal] = useState(null);
 const [partidosParaConfirmar, setPartidosParaConfirmar] = useState([]);
 const [pagosVencidosOrganizador, setPagosVencidosOrganizador] = useState([]);
 const [mostrarListaVencidos, setMostrarListaVencidos] = useState(false);
 const [partidoIncompletoPendiente, setPartidoIncompletoPendiente] = useState(null);
 const [proximoPartido, setProximoPartido] = useState(null);
 const misPartidosRef = useRef([]);
 const estadosAnteriores = useRef({});

 const tab = PATH_TO_TAB[location.pathname] || 'inicio';

 const changeTab = (t) => {
  if (t !== 'crear') setCanchaParaPartido(null);
  navigate(TAB_PATHS[t] || '/');
 };

 const onVerDetalle = (p) => navigate('/partidos/' + (p.id || p));

 useEffect(() => {
  if (!user || esCancha) return;
  const unsub = suscribirMisPartidos(user.uid, (partidos) => {
   misPartidosRef.current = partidos;
   const anteriores = estadosAnteriores.current;
   partidos.forEach(p => {
    const estadoAnterior = anteriores[p.id];
    if (estadoAnterior === 'pendiente' && p.estado === 'confirmado') {
     setToastGlobal(`¡Tu partido en ${p.nombreCancha} fue confirmado!`);
     setTimeout(() => setToastGlobal(null), 4000);
    }
    const pagoAnterior = anteriores[p.id + '_pago'];
    if (pagoAnterior === false && p.pagoCanchaConfirmado === true) {
     setToastGlobal(`La cancha confirmó el pago de ${p.nombreCancha}`);
     setTimeout(() => setToastGlobal(null), 4000);
    }
    anteriores[p.id] = p.estado;
    anteriores[p.id + '_pago'] = p.pagoCanchaConfirmado;
   });
   estadosAnteriores.current = anteriores;

   const dosHoras = 2 * 60 * 60 * 1000;
   const noventaMin = 90 * 60 * 1000;
   const ahora = new Date();
   const vencidos = partidos.filter(p =>
    p.creadoPor === user.uid &&
    !p.pagoCanchaConfirmado &&
    p.estado !== 'cancelado' &&
    ahora > new Date(new Date(p.fechaHora).getTime() + dosHoras) &&
    ahora < new Date(new Date(p.fechaHora).getTime() + noventaMin + dosHoras)
   );
   setPagosVencidosOrganizador(vencidos);

   const proximos = partidos
    .filter(p =>
     ['confirmado', 'lleno'].includes(p.estado) &&
     new Date(p.fechaHora).getTime() + noventaMin > ahora.getTime()
    )
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
   setProximoPartido(proximos[0] || null);
  });
  return () => unsub();
 }, [user, esCancha]);

 useEffect(() => {
  if (!user || esCancha) return;
  const chequear = async () => {
   const partidos = misPartidosRef.current;
   const ahora = new Date();
   const cuarentaYCincoMins = 45 * 60 * 1000;
   const quinceMins = 15 * 60 * 1000;

   for (const p of partidos) {
    if (p.creadoPor !== user.uid) continue;
    if (!['confirmado', 'lleno'].includes(p.estado)) continue;
    if (p.confirmadoIncompleto) continue;

    const fechaPartido = new Date(p.fechaHora);
    const msHastaPartido = fechaPartido - ahora;

    if (msHastaPartido > 0 && msHastaPartido <= cuarentaYCincoMins) {
     const anotados = p.jugadoresAnotados || 0;
     const cupoTotal = p.cupoTotal || 10;

     if (anotados < cupoTotal / 2) {
      await cancelarPartidoAutomatico(p.id);
      setToastGlobal(`Tu partido en ${p.nombreCancha} fue cancelado automáticamente por falta de jugadores`);
      setTimeout(() => setToastGlobal(null), 5000);
      setPartidoIncompletoPendiente(null);
     } else if (anotados < cupoTotal) {
      if (p.notificacionIncompletoEn) {
       const msDesdeNotif = ahora - new Date(p.notificacionIncompletoEn);
       if (msDesdeNotif >= quinceMins) {
        await cancelarPartidoAutomatico(p.id);
        setToastGlobal(`Tu partido en ${p.nombreCancha} fue cancelado por falta de respuesta`);
        setTimeout(() => setToastGlobal(null), 5000);
        setPartidoIncompletoPendiente(null);
       }
      } else {
       await marcarNotificacionIncompleto(p.id);
       setPartidoIncompletoPendiente({ ...p, anotados, cupoTotal });
      }
     }
    }
   }
  };

  chequear();
  const interval = setInterval(chequear, 30000);
  return () => clearInterval(interval);
 }, [user, esCancha]);

 useEffect(() => {
  if (!user || esCancha) return;
  const unsub = suscribirPartidosParaConfirmar(user.uid, setPartidosParaConfirmar);
  return () => unsub();
 }, [user, esCancha]);

 if (loading) {
  return (
   <div className="flex items-center justify-center min-h-svh bg-f-bg font-barlow">
    <div className="flex flex-col items-center gap-5">
     <div className="w-24 h-24 rounded-3xl overflow-hidden"
      style={{boxShadow:'0 4px 24px rgba(14,165,233,0.5)'}}>
      <img src="/logo.png" alt="Falta 1" className="w-full h-full object-cover" />
     </div>
     <div className="w-8 h-8 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom" />
    </div>
   </div>
  );
 }

 if (!user) return <LoginScreen />;

 if (esCancha) return <CanchaPanel />;

 const estaBloqueado = perfil?.bloqueado;
 const estaSuspendido = !perfil?.bloqueado && perfil?.penalizacionHasta && new Date(perfil.penalizacionHasta) > new Date();
 const diasSuspendido = estaSuspendido
  ? Math.ceil((new Date(perfil.penalizacionHasta) - new Date()) / 86400000) : 0;

 if (!esAdmin && (estaBloqueado || estaSuspendido)) {
  return (
   <div className="min-h-svh bg-f-bg flex flex-col items-center justify-center px-6 text-center font-barlow">
    <div className="text-7xl mb-6">{estaBloqueado ? '' : ''}</div>
    <h1 className="text-white font-black text-3xl uppercase mb-3">
     {estaBloqueado ? 'Cuenta bloqueada' : 'Cuenta suspendida'}
    </h1>
    <p className="text-f-muted text-base leading-relaxed max-w-sm mb-8">
     {estaBloqueado
      ? 'Tu cuenta está bloqueada permanentemente por incumplimiento reiterado de las reglas. Contactá al soporte para más información.'
      : `Tu cuenta está suspendida. Te quedan ${diasSuspendido} día${diasSuspendido !== 1 ? 's' : ''} de suspensión. Podrás volver a usar la app cuando venza el período.`}
    </p>
    <div className="bg-f-card border border-f-border rounded-2xl px-5 py-4 mb-8 max-w-sm w-full text-left">
     <p className="text-f-muted text-xs font-black uppercase tracking-wider mb-2">Sistema de penalizaciones</p>
     <p className="text-f-muted text-sm leading-relaxed">
      {estaBloqueado
       ? 'El bloqueo permanente se aplica por 3 o más no-shows o por violaciones graves a las reglas de la plataforma. Solo un administrador puede levantarlo.'
       : 'La suspensión se aplica automáticamente por no-shows o cancelaciones tardías. Se levanta al vencer el período o si un administrador la remueve.'}
     </p>
    </div>
    <button onClick={logout}
     className="text-red-400 font-bold text-sm border border-red-900/50 px-6 py-3 rounded-xl active:scale-95 transition-all">
     Cerrar sesión
    </button>
   </div>
  );
 }

 // Partido en detalle — pantalla completa sin shell
 if (partidoMatch) {
  return (
   <>
    <MatchDetailScreen
     partidoId={partidoMatch.params.id}
     onBack={() => navigate(-1)}
     onChat={() => { setChatPartido({ id: partidoMatch.params.id }); navigate(-1); }}
    />
    {chatPartido && (
     <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />
    )}
   </>
  );
 }

 return (
  <div className="app-shell font-barlow">
   {toastGlobal && (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-black text-sm text-white bg-green-700 shadow-xl animate-fade-in whitespace-nowrap">
     {toastGlobal}
    </div>
   )}

   {/* Banner: recordatorio de pago en caja al organizador */}
   {pagosVencidosOrganizador.length > 0 && (
    <div className="fixed top-0 left-0 right-0 z-40"
     style={{ background: 'rgba(234,88,12,0.95)', backdropFilter: 'blur(8px)' }}>
     <button onClick={() => setMostrarListaVencidos(v => !v)}
      className="w-full px-5 py-3 flex items-center justify-center gap-2">
      <p className="text-white font-black text-sm">
       Acordate de pagar en caja — {pagosVencidosOrganizador.length > 1
        ? `${pagosVencidosOrganizador.length} partidos pendientes`
        : `"${pagosVencidosOrganizador[0].nombreCancha}"`}
      </p>
      <span className="text-white/70 text-xs">{mostrarListaVencidos ? '' : ''}</span>
     </button>
     {mostrarListaVencidos && (
      <div className="px-4 pb-3 flex flex-col gap-1.5">
       {pagosVencidosOrganizador.map(p => (
        <button key={p.id}
         onClick={() => { onVerDetalle(p); setMostrarListaVencidos(false); }}
         className="w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between"
         style={{ background: 'rgba(0,0,0,0.25)' }}>
         <div>
          <p className="text-white font-black text-sm">{p.nombreCancha}</p>
          <p className="text-orange-200 text-xs">
           {new Date(p.fechaHora).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })} · {new Date(p.fechaHora).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
          </p>
         </div>
         <span className="text-white/70 text-xs font-bold">Ver →</span>
        </button>
       ))}
      </div>
     )}
    </div>
   )}

   {/* Banner: próximo partido confirmado */}
   {!pagosVencidosOrganizador.length && proximoPartido && (
    <div className="fixed top-0 left-0 right-0 z-40"
     style={{ background: 'rgba(22,163,74,0.95)', backdropFilter: 'blur(8px)' }}>
     <button
      onClick={() => onVerDetalle(proximoPartido)}
      className="w-full px-5 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
       <div className="text-left min-w-0">
        <p className="text-white font-black text-sm leading-tight truncate">
         {new Date(proximoPartido.fechaHora).toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' })} · {new Date(proximoPartido.fechaHora).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs — {proximoPartido.nombreCancha}
        </p>
        <p className="text-green-200 text-xs leading-tight">
         {proximoPartido.jugadoresAnotados ?? 0}/{proximoPartido.cupoTotal ?? '?'} jugadores anotados
        </p>
       </div>
      </div>
      <span className="text-white font-black text-xs shrink-0">Ver →</span>
     </button>
    </div>
   )}

   <Sidebar tab={tab} setTab={changeTab} esAdmin={esAdmin} />
   <main className="app-main" style={{
    paddingBottom: '80px',
    ...(pagosVencidosOrganizador.length > 0
     ? { paddingTop: mostrarListaVencidos ? `${44 + pagosVencidosOrganizador.length * 60 + 12}px` : '44px' }
     : proximoPartido
      ? { paddingTop: '44px' }
      : {}),
   }}>
    <Routes>
     <Route path="/" element={
      <HomeScreen setTab={changeTab} onVerDetalle={onVerDetalle} />
     } />
     <Route path="/canchas" element={
      <CanchasScreen onCrearPartido={(c) => { setCanchaParaPartido(c); navigate('/crear'); }} />
     } />
     <Route path="/crear" element={
      <CrearScreen canchaPreseleccionada={canchaParaPartido} setTab={changeTab} />
     } />
     <Route path="/unirme" element={
      <UnirseScreen onVerDetalle={onVerDetalle} />
     } />
     <Route path="/perfil" element={
      <PerfilScreen setTab={changeTab} onVerDetalle={onVerDetalle} />
     } />
     <Route path="/admin" element={
      esAdmin ? <AdminScreen setTab={changeTab} /> : <Navigate to="/" replace />
     } />
     <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
   </main>
   <BottomNav tab={tab} setTab={changeTab} />
   {chatPartido && (
    <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />
   )}

   {/* Modal: confirmación de asistencia post-partido */}
   {partidosParaConfirmar.length > 0 && (
    <ConfirmacionAsistenciaModal
     partido={partidosParaConfirmar[0]}
     onDone={() => {}}
    />
   )}

   {/* Modal: partido incompleto — decisión del organizador (45 min antes) */}
   {partidoIncompletoPendiente && (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
     style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
     <div className="bg-f-card border border-f-border rounded-t-3xl md:rounded-3xl p-6 w-full max-w-md mx-4 mb-0 md:mb-4 animate-fade-in">
      <h2 className="text-white font-black text-xl uppercase text-center mb-2">
       Partido incompleto
      </h2>
      <p className="text-f-muted text-sm text-center leading-relaxed mb-1">
       Tu partido en <span className="text-white font-bold">{partidoIncompletoPendiente.nombreCancha}</span> empieza en menos de 45 min y
       tenés <span className="text-orange-400 font-black">{partidoIncompletoPendiente.anotados} de {partidoIncompletoPendiente.cupoTotal} jugadores</span>.
      </p>
      <p className="text-red-400/80 text-xs text-center mb-6">
       Tenés 15 minutos para decidir. Si no respondés, el partido se cancela automáticamente.
      </p>
      <div className="flex flex-col gap-3">
       <button
        onClick={async () => {
         await confirmarPartidoIncompleto(partidoIncompletoPendiente.id);
         setPartidoIncompletoPendiente(null);
         setToastGlobal('Confirmado. El costo se divide entre los jugadores anotados');
         setTimeout(() => setToastGlobal(null), 4000);
        }}
        className="w-full py-4 rounded-2xl font-black text-base uppercase text-white active:scale-95 transition-all"
        style={{ background: '#16a34a', boxShadow: '0 4px 16px rgba(22,163,74,0.4)' }}>
        Jugamos igual ({partidoIncompletoPendiente.anotados} jugadores)
       </button>
       <button
        onClick={async () => {
         await cancelarPartidoAutomatico(partidoIncompletoPendiente.id);
         setPartidoIncompletoPendiente(null);
         setToastGlobal('Partido cancelado. Se avisó a todos los jugadores.');
         setTimeout(() => setToastGlobal(null), 4000);
        }}
        className="w-full py-4 rounded-2xl font-black text-base uppercase active:scale-95 transition-all border border-red-700 text-red-400">
        Cancelar el partido
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
