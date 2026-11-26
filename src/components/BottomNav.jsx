export default function BottomNav({ tab, setTab }) {
 const tabs = [
  { id: 'inicio',  label: 'Inicio',    icon: <HomeIcon /> },
  { id: 'unirse',  label: 'Partidos',  icon: <PartidosIcon /> },
  { id: 'crear',   label: 'Crear',     icon: <PlusIcon />, central: true },
  { id: 'canchas', label: 'Canchas',   icon: <CanchaIcon /> },
  { id: 'perfil',  label: 'Perfil',    icon: <PerfilIcon /> },
 ];

 return (
  <nav
   className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
   style={{
    background: '#111111',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
   }}
  >
   <div className="flex items-center justify-around" style={{ height: 60 }}>
    {tabs.map(({ id, label, icon, central }) => {
     const activo = tab === id;
     if (central) {
      return (
       <button
        key={id}
        onClick={() => setTab(id)}
        className="flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
        style={{ flex: 1 }}
       >
        <div
         style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: activo ? '#0284c7' : '#0ea5e9',
          boxShadow: '0 4px 16px rgba(14,165,233,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          marginTop: -18,
         }}
        >
         {icon}
        </div>
        <span
         style={{
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: activo ? '#0ea5e9' : '#5a5a5a',
          marginTop: 2,
         }}
        >
         {label}
        </span>
       </button>
      );
     }
     return (
      <button
       key={id}
       onClick={() => setTab(id)}
       className="flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
       style={{ flex: 1 }}
      >
       <div style={{ color: activo ? '#54b5f0' : '#5a5a5a' }}>{icon}</div>
       <span
        style={{
         fontSize: 9,
         fontWeight: 900,
         letterSpacing: '0.06em',
         textTransform: 'uppercase',
         color: activo ? '#54b5f0' : '#5a5a5a',
        }}
       >
        {label}
       </span>
      </button>
     );
    })}
   </div>
  </nav>
 );
}

function HomeIcon() {
 return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
 </svg>;
}
function PartidosIcon() {
 return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
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
