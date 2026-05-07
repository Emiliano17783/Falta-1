export default function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: 'inicio',  label: 'Inicio',  icon: <HomeIcon /> },
    { id: 'canchas', label: 'Canchas', icon: <CanchaIcon /> },
    { id: 'crear',   label: 'Crear',   icon: <PlusIcon />, destacado: true },
    { id: 'perfil',  label: 'Perfil',  icon: <PerfilIcon /> },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(({ id, label, icon, destacado }) => (
        <button key={id} onClick={() => setTab(id)}
          className="flex flex-col items-center justify-center gap-0.5 py-3 px-2 flex-1 active:scale-90 transition-transform">
          {destacado ? (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-green-sm transition-all
                            ${tab === id ? 'bg-f-accent scale-110' : 'bg-f-green'}`}>
              <span className="text-f-bg">{icon}</span>
            </div>
          ) : (
            <div className={`transition-colors ${tab === id ? 'text-f-accent' : 'text-f-muted'}`}>
              {icon}
            </div>
          )}
          <span className={`text-[10px] font-black uppercase tracking-wide transition-colors
                            ${tab === id ? 'text-f-accent' : 'text-f-muted'}`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}

function HomeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>;
}
function CanchaIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>;
}
function PlusIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>;
}
function PerfilIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>;
}
