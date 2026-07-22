import { useAuth } from '../context/AuthContext';

const NAV = [
  { id: 'inicio',  label: 'Inicio',   icon: <HomeIcon /> },
  { id: 'canchas', label: 'Canchas',  icon: <CanchaIcon /> },
  { id: 'perfil',  label: 'Perfil',   icon: <PerfilIcon /> },
];

export default function Sidebar({ tab, setTab }) {
  const { user, perfil } = useAuth();

  return (
    <aside className="app-sidebar hidden md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
             style={{ background:'rgba(14,165,233,0.1)', border:'1px solid rgba(84,181,240,0.25)', boxShadow:'0 4px 20px rgba(84,181,240,0.2)' }}>
          <img src="/logo.png" alt="Falta 1" className="w-full h-full object-cover"
               onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.insertAdjacentHTML('afterend','<span style="font-size:1.2rem">⚽</span>'); }} />
        </div>
        <div>
          <p className="text-f-text text-2xl font-black uppercase leading-none tracking-tight">FALTA 1</p>
          <p className="text-f-muted text-xs font-medium uppercase tracking-widest">Mvd, Uruguay</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`sidebar-item ${tab === id ? 'active' : ''}`}>
            <span className="text-xl">{icon}</span>
            {label}
          </button>
        ))}

        {/* Crear — destacado */}
        <button onClick={() => setTab('crear')}
          className={`sidebar-item crear ${tab === 'crear' ? 'opacity-90' : ''}`}>
          <span className="text-xl"><PlusIcon /></span>
          Crear partido
        </button>

        <button onClick={() => setTab('unirse')}
          className={`sidebar-item ${tab === 'unirse' ? 'active' : ''}`}
          style={{ marginTop: 4, border: tab === 'unirse' ? 'none' : '1px solid rgba(14,165,233,0.25)', color: tab === 'unirse' ? '' : '#54b5f0' }}>
          <span className="text-xl"><UnirseIcon /></span>
          Unirme a un partido
        </button>
      </nav>

      {/* Usuario */}
      {user && (
        <div className="mt-auto pt-4 border-t border-f-border">
          <button
            onClick={() => setTab('perfil')}
            className="flex items-center gap-3 px-2 w-full rounded-xl py-2 transition-all active:scale-95"
            style={{ background: tab === 'perfil' ? 'rgba(84,181,240,0.08)' : 'transparent' }}>
            <div className="w-10 h-10 rounded-xl bg-f-green flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.photoURL
                ? <img src={user.photoURL.replace('=s96-c', '=s200-c')} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <span className="text-white font-black text-lg">{(user.displayName||'U')[0]}</span>
              }
            </div>
            <div className="min-w-0 text-left">
              <p className="text-f-text text-sm font-bold truncate leading-tight">
                {user.displayName?.split(' ')[0] || 'Jugador'}
              </p>
              <p className="text-f-muted text-xs truncate">{perfil?.posicion || 'Ver perfil'}</p>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}

function HomeIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>;
}
function CanchaIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>;
}
function PerfilIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>;
}
function PlusIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>;
}
function UnirseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>;
}
