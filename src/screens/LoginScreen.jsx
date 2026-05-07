import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { loginConGoogle } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogle = async () => {
    setCargando(true);
    setError(null);
    try {
      await loginConGoogle();
    } catch {
      setError('No se pudo iniciar sesión. Intentá de nuevo.');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-svh flex font-barlow bg-f-bg overflow-hidden">

      {/* Panel izquierdo — visual */}
      <div className="hidden md:flex flex-1 relative hero-bg items-center justify-center p-16">
        <div className="relative z-10 text-center">
          {/* Campo de fútbol SVG grande */}
          <svg className="mx-auto mb-8 opacity-30" width="280" height="180" viewBox="0 0 280 180" fill="none">
            <rect x="2" y="2" width="276" height="176" rx="8" stroke="white" strokeWidth="3"/>
            <line x1="140" y1="2" x2="140" y2="178" stroke="white" strokeWidth="2"/>
            <circle cx="140" cy="90" r="30" stroke="white" strokeWidth="2"/>
            <circle cx="140" cy="90" r="3" fill="white"/>
            <rect x="2" y="55" width="40" height="70" stroke="white" strokeWidth="2"/>
            <rect x="238" y="55" width="40" height="70" stroke="white" strokeWidth="2"/>
            <rect x="2" y="70" width="18" height="40" stroke="white" strokeWidth="2"/>
            <rect x="260" y="70" width="18" height="40" stroke="white" strokeWidth="2"/>
          </svg>

          <h1 className="text-white font-black uppercase leading-none mb-4"
              style={{ fontSize: 'clamp(3rem,5vw,6rem)' }}>
            FALTA 1
          </h1>
          <p className="text-green-300 text-xl font-bold uppercase tracking-widest">
            Fútbol amateur Montevideo
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
            {[
              ['⚽','Encontrá partidos en tu barrio'],
              ['🏟️','Reservá canchas al instante'],
              ['💳','Pagá con MercadoPago'],
              ['⭐','Sistema de reputación'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-start gap-2 bg-black/20 rounded-xl p-3">
                <span className="text-xl">{icon}</span>
                <span className="text-green-100 text-sm font-medium leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — login */}
      <div className="flex-1 md:max-w-sm flex flex-col items-center justify-center px-8 py-16 relative">

        {/* Mobile: logo */}
        <div className="md:hidden mb-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-f-green mx-auto mb-4 flex items-center justify-center"
               style={{ boxShadow:'0 4px 24px rgba(22,163,74,0.5)' }}>
            <span className="text-5xl">⚽</span>
          </div>
          <h1 className="text-white text-5xl font-black uppercase">FALTA 1</h1>
          <p className="text-f-accent text-base font-bold uppercase tracking-widest mt-1">Fútbol amateur Mvd</p>
        </div>

        {/* Desktop: título */}
        <div className="hidden md:block w-full mb-10">
          <h2 className="text-white text-4xl font-black uppercase">Bienvenido</h2>
          <p className="text-f-muted text-lg mt-1">Entrá con tu cuenta de Google</p>
        </div>

        {/* Botón Google */}
        <button onClick={handleGoogle} disabled={cargando}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800
                     font-bold text-xl uppercase py-4 rounded-2xl shadow-2xl
                     active:scale-95 transition-transform disabled:opacity-60">
          {cargando
            ? <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin-custom" />
            : <GoogleSVG />
          }
          {cargando ? 'Entrando...' : 'Entrar con Google'}
        </button>

        {error && <p className="mt-4 text-red-400 text-base text-center">{error}</p>}

        {/* Features mobile */}
        <div className="md:hidden mt-10 space-y-3 w-full">
          {[
            ['⚽','Encontrá partidos en tu barrio'],
            ['🏟️','Reservá canchas al instante'],
            ['💳','Pagá con MercadoPago'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-f-text">
              <span className="text-xl w-8 text-center">{icon}</span>
              <span className="text-base font-medium">{text}</span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-f-muted text-sm text-center leading-relaxed">
          Al entrar aceptás las reglas de asistencia<br />y el sistema de penalizaciones.
        </p>

        <p className="mt-4 text-f-muted text-sm">🇺🇾 Solo Montevideo, Uruguay</p>
      </div>
    </div>
  );
}

function GoogleSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
