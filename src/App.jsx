import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import CanchasScreen from './screens/CanchasScreen';
import CrearScreen from './screens/CrearScreen';
import PerfilScreen from './screens/PerfilScreen';
import AdminScreen from './screens/AdminScreen';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';

export default function App() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('inicio');
  const [canchaParaPartido, setCanchaParaPartido] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-f-bg font-barlow">
        <div className="flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-3xl bg-f-green flex items-center justify-center"
               style={{boxShadow:'0 4px 24px rgba(22,163,74,0.5)'}}>
            <span className="text-6xl">⚽</span>
          </div>
          <div className="w-8 h-8 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const changeTab = (t) => {
    if (t !== 'crear') setCanchaParaPartido(null);
    setTab(t);
  };

  const renderScreen = () => {
    switch (tab) {
      case 'inicio':  return <HomeScreen setTab={changeTab} />;
      case 'canchas': return <CanchasScreen onCrearPartido={(c) => { setCanchaParaPartido(c); setTab('crear'); }} />;
      case 'crear':   return <CrearScreen canchaPreseleccionada={canchaParaPartido} setTab={changeTab} />;
      case 'perfil':  return <PerfilScreen setTab={changeTab} />;
      case 'admin':   return <AdminScreen setTab={changeTab} />;
      default:        return <HomeScreen setTab={changeTab} />;
    }
  };

  return (
    <div className="app-shell font-barlow">
      <Sidebar tab={tab} setTab={changeTab} />
      <main className="app-main pb-20 md:pb-0">
        {renderScreen()}
      </main>
      <BottomNav tab={tab} setTab={changeTab} />
    </div>
  );
}
