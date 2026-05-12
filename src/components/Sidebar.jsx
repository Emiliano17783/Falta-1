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
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background:'rgba(196,245,75,0.1)', border:'1px solid rgba(196,245,75,0.2)', boxShadow:'0 4px 20px rgba(196,245,75,0.15)' }}>
          <span className="text-2xl">⚽</span>
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
      </nav>

      {/* Usuario */}
      {user && (
        <div className="mt-auto pt-4 border-t border-f-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-f-green flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-black">{(user.displayName||'U')[0]}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-f-text text-sm font-bold truncate leading-tight">
                {user.displayName?.split(' ')[0] || 'Jugador'}
              </p>
              <p className="text-f-muted text-xs truncate">{perfil?.posicion || 'Montevideo'}</p>
            </div>
          </div>
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
