import { useState } from 'react';

export default function BottomNav({ tab, setTab }) {
  const [abierto, setAbierto] = useState(false);

  const tabs = [
    { id: 'inicio',  label: 'Inicio',  icon: <HomeIcon /> },
    { id: 'canchas', label: 'Canchas', icon: <CanchaIcon /> },
    { id: 'crear',   label: 'Crear',   icon: <PlusIcon />, destacado: true },
    { id: 'perfil',  label: 'Perfil',  icon: <PerfilIcon /> },
  ];

  const navegar = (id) => {
    setTab(id);
    setAbierto(false);
  };

  return (
    <>
      {/* Overlay oscuro cuando el sheet está abierto */}
      {abierto && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setAbierto(false)}
        />
      )}

      {/* Bottom sheet con los tabs */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 md:hidden"
        style={{
          transform: abierto ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          background: '#111111',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px 20px 0 0',
          padding: '10px 16px 36px',
        }}
      >
        {/* Handle decorativo */}
        <div className="flex justify-center mb-4">
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Grid de 4 tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {tabs.map(({ id, label, icon, destacado }) => (
            <button
              key={id}
              onClick={() => navegar(id)}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl active:scale-90 transition-all"
              style={{
                background: tab === id ? 'rgba(84,181,240,0.1)' : 'transparent',
                border: 'none',
              }}
            >
              {destacado ? (
                <div
                  className="flex items-center justify-center rounded-2xl"
                  style={{
                    width: 48, height: 48,
                    background: tab === id ? '#0ea5e9' : 'rgba(14,165,233,0.15)',
                    boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                    border: '1px solid rgba(84,181,240,0.3)',
                  }}
                >
                  <span style={{ color: '#ffffff' }}>{icon}</span>
                </div>
              ) : (
                <div style={{ color: tab === id ? '#54b5f0' : '#5a5a5a' }}>
                  {icon}
                </div>
              )}
              <span
                className="font-black uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: tab === id ? '#54b5f0' : '#5a5a5a',
                }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Botón flotante para abrir/cerrar */}
      <button
        className="fixed z-50 md:hidden active:scale-90 transition-all"
        style={{
          bottom: 20,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 16,
          background: abierto ? '#1c1c1c' : '#0ea5e9',
          border: abierto ? '1px solid rgba(255,255,255,0.1)' : 'none',
          boxShadow: abierto
            ? '0 4px 16px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(14,165,233,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}
        onClick={() => setAbierto(!abierto)}
      >
        {abierto ? <CloseIcon /> : <MenuIcon />}
      </button>
    </>
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
function MenuIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
  </svg>;
}
function CloseIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>;
}
