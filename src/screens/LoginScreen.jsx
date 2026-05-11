import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Tabs: 'google' | 'login' | 'registro'
export default function LoginScreen() {
  const { loginConGoogle, loginConEmail, registrarConEmail } = useAuth();
  const [tab, setTab] = useState('google');

  return (
    <div className="min-h-svh flex font-barlow bg-f-bg overflow-hidden">

      {/* Panel izquierdo — visual (solo desktop) */}
      <div className="hidden md:flex flex-1 relative hero-bg items-center justify-center p-16">
        <div className="relative z-10 text-center">
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
              ['🏟️','Contactá canchas por WhatsApp'],
              ['💬','Chat con los jugadores del partido'],
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

      {/* Panel derecho — auth */}
      <div className="flex-1 md:max-w-sm flex flex-col items-center justify-center px-8 py-12 relative">

        {/* Mobile: logo */}
        <div className="md:hidden mb-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-f-green mx-auto mb-4 flex items-center justify-center"
               style={{ boxShadow:'0 4px 24px rgba(22,163,74,0.5)' }}>
            <span className="text-5xl">⚽</span>
          </div>
          <h1 className="text-white text-5xl font-black uppercase">FALTA 1</h1>
          <p className="text-f-accent text-base font-bold uppercase tracking-widest mt-1">Fútbol amateur Mvd</p>
        </div>

        {/* Desktop: título */}
        <div className="hidden md:block w-full mb-6">
          <h2 className="text-white text-4xl font-black uppercase">Bienvenido</h2>
          <p className="text-f-muted text-lg mt-1">Entrá o creá tu cuenta</p>
        </div>

        {/* Tabs selector */}
        <div className="w-full flex bg-f-surface border border-f-border rounded-xl p-1 mb-6">
          {[
            { id: 'google',   label: 'Google' },
            { id: 'login',    label: 'Iniciar sesión' },
            { id: 'registro', label: 'Registrarse' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase transition-all
                          ${tab === t.id ? 'bg-f-green text-white' : 'text-f-muted'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel de cada tab */}
        <div className="w-full">
          {tab === 'google'   && <TabGoogle onLogin={loginConGoogle} />}
          {tab === 'login'    && <TabEmail onLogin={loginConEmail} />}
          {tab === 'registro' && <TabRegistro onRegistrar={registrarConEmail} />}
        </div>

        <p className="mt-8 text-f-muted text-sm text-center leading-relaxed">
          Al entrar aceptás las reglas de asistencia<br />y el sistema de penalizaciones.
        </p>
        <p className="mt-3 text-f-muted text-sm">🇺🇾 Solo Montevideo, Uruguay</p>
      </div>
    </div>
  );
}

/* ── Tab Google ─────────────────────────────── */
function TabGoogle({ onLogin }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handle = async () => {
    setCargando(true);
    setError(null);
    try {
      await onLogin();
    } catch {
      setError('No se pudo iniciar sesión. Intentá de nuevo.');
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={handle} disabled={cargando}
        className="w-full flex items-center justify-center gap-3 bg-white text-gray-800
                   font-bold text-xl uppercase py-4 rounded-2xl shadow-2xl
                   active:scale-95 transition-transform disabled:opacity-60">
        {cargando
          ? <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin-custom" />
          : <GoogleSVG />
        }
        {cargando ? 'Entrando...' : 'Entrar con Google'}
      </button>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
}

/* ── Tab Email Login ────────────────────────── */
function TabEmail({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setCargando(true);
    setError(null);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-email': 'Email no válido.',
        'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.',
      };
      setError(msgs[err.code] || 'Error al iniciar sesión. Intentá de nuevo.');
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handle} className="flex flex-col gap-3">
      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-1">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com" required
          className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
                     text-white text-base placeholder:text-f-muted outline-none focus:border-f-accent transition-colors" />
      </div>
      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-1">Contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" required
          className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
                     text-white text-base placeholder:text-f-muted outline-none focus:border-f-accent transition-colors" />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={cargando || !email || !password}
        className="w-full bg-f-green text-white font-black text-xl uppercase py-4 rounded-2xl
                   active:scale-95 transition-transform disabled:opacity-50"
        style={{ boxShadow: '0 4px 20px rgba(22,163,74,0.4)' }}>
        {cargando ? 'Entrando...' : 'INICIAR SESIÓN'}
      </button>
    </form>
  );
}

/* ── Tab Registro ───────────────────────────── */
function TabRegistro({ onRegistrar }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    if (!nombre || !email || !password) return;
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setCargando(true);
    setError(null);
    try {
      await onRegistrar(nombre.trim(), email.trim(), password);
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
        'auth/invalid-email': 'Email no válido.',
        'auth/weak-password': 'Contraseña demasiado débil.',
      };
      setError(msgs[err.code] || 'Error al registrarse. Intentá de nuevo.');
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handle} className="flex flex-col gap-3">
      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-1">Tu nombre</label>
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Ej: Emiliano" required
          className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
                     text-white text-base placeholder:text-f-muted outline-none focus:border-f-accent transition-colors" />
      </div>
      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-1">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com" required
          className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
                     text-white text-base placeholder:text-f-muted outline-none focus:border-f-accent transition-colors" />
      </div>
      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-1">Contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres" required
          className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
                     text-white text-base placeholder:text-f-muted outline-none focus:border-f-accent transition-colors" />
      </div>
      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-1">Repetir contraseña</label>
        <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
          placeholder="••••••••" required
          className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
                     text-white text-base placeholder:text-f-muted outline-none focus:border-f-accent transition-colors" />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={cargando || !nombre || !email || !password || !password2}
        className="w-full bg-f-accent text-f-bg font-black text-xl uppercase py-4 rounded-2xl
                   active:scale-95 transition-transform disabled:opacity-50"
        style={{ boxShadow: '0 4px 20px rgba(74,222,128,0.4)' }}>
        {cargando ? 'Creando cuenta...' : 'CREAR CUENTA'}
      </button>
    </form>
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
