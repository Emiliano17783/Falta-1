import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { suscribirMisPartidos } from './firebase/firestore';
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

export default function App() {
  const { user, loading, esCancha, esAdmin } = useAuth();
  const [tab, setTab] = useState('inicio');
  const [canchaParaPartido, setCanchaParaPartido] = useState(null);
  const [partidoDetalle, setPartidoDetalle] = useState(null);
  const [chatPartido, setChatPartido] = useState(null);
  const [toastGlobal, setToastGlobal] = useState(null);
  const estadosAnteriores = useRef({});

  useEffect(() => {
    if (!user || esCancha) return;
    const unsub = suscribirMisPartidos(user.uid, (partidos) => {
      const anteriores = estadosAnteriores.current;
      partidos.forEach(p => {
        const estadoAnterior = anteriores[p.id];
        if (estadoAnterior === 'pendiente' && p.estado === 'confirmado') {
          setToastGlobal(`✅ ¡Tu partido en ${p.nombreCancha} fue confirmado!`);
          setTimeout(() => setToastGlobal(null), 4000);
        }
        const pagoAnterior = anteriores[p.id + '_pago'];
        if (pagoAnterior === false && p.pagoCanchaConfirmado === true) {
          setToastGlobal(`💰 La cancha confirmó el pago de ${p.nombreCancha}`);
          setTimeout(() => setToastGlobal(null), 4000);
        }
        anteriores[p.id] = p.estado;
        anteriores[p.id + '_pago'] = p.pagoCanchaConfirmado;
      });
      estadosAnteriores.current = anteriores;
    });
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

  // Usuarios con rol "cancha" ven solo su panel
  if (esCancha) return <CanchaPanel />;

  // Si hay un partido abierto en detalle
  if (partidoDetalle) {
    return (
      <>
        <MatchDetailScreen
          partidoId={partidoDetalle.id || partidoDetalle}
          onBack={() => setPartidoDetalle(null)}
          onChat={() => { setChatPartido(partidoDetalle); setPartidoDetalle(null); }}
        />
        {chatPartido && (
          <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />
        )}
      </>
    );
  }

  const changeTab = (t) => {
    if (t !== 'crear') setCanchaParaPartido(null);
    setTab(t);
  };

  const renderScreen = () => {
    switch (tab) {
      case 'inicio':
        return (
          <HomeScreen
            setTab={changeTab}
            onVerDetalle={(p) => setPartidoDetalle(p)}
          />
        );
      case 'canchas':
        return (
          <CanchasScreen
            onCrearPartido={(c) => { setCanchaParaPartido(c); setTab('crear'); }}
          />
        );
      case 'crear':
        return (
          <CrearScreen
            canchaPreseleccionada={canchaParaPartido}
            setTab={changeTab}
          />
        );
      case 'unirse':
        return <UnirseScreen onVerDetalle={(p) => setPartidoDetalle(p)} />;
      case 'perfil':
        return <PerfilScreen setTab={changeTab} />;
      case 'admin':
        return esAdmin ? <AdminScreen setTab={changeTab} /> : <HomeScreen setTab={changeTab} />;
      default:
        return <HomeScreen setTab={changeTab} onVerDetalle={(p) => setPartidoDetalle(p)} />;
    }
  };

  return (
    <div className="app-shell font-barlow">
      {toastGlobal && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-black text-sm text-white bg-green-700 shadow-xl animate-fade-in whitespace-nowrap">
          {toastGlobal}
        </div>
      )}
      <Sidebar tab={tab} setTab={changeTab} esAdmin={esAdmin} />
      <main className="app-main">
        {renderScreen()}
      </main>
      <BottomNav tab={tab} setTab={changeTab} />
      {chatPartido && (
        <ChatModal partido={chatPartido} onClose={() => setChatPartido(null)} />
      )}
    </div>
  );
}
