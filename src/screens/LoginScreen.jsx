import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { loginConGoogle, loginConEmail, registrarConEmail } = useAuth();
  const [tab, setTab] = useState('google');

  return (
    <div className="min-h-svh flex bg-f-bg overflow-hidden">

      {/* Panel izquierdo — visual desktop */}
      <div className="hidden md:flex flex-1 relative items-center justify-center p-16 overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #111111 60%, #0d1a04 100%)' }}>
        {/* Glow de fondo */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(196,245,75,0.06) 0%, transparent 60%)' }} />
        {/* Línea bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
             style={{ background: 'linear-gradient(90deg, transparent, rgba(196,245,75,0.15), transparent)' }} />

        <div className="relative z-10 text-center max-w-md">
          {/* Logo grande */}
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-3xl"
               style={{ background: 'rgba(196,245,75,0.08)', border: '1px solid rgba(196,245,75,0.15)' }}>
            <span className="text-5xl">⚽</span>
          </div>

          <h1 className="text-white font-black uppercase leading-none mb-3"
              style={{ fontSize: 'clamp(3.5rem,6vw,7rem)', letterSpacing: '-0.02em' }}>
            FALTA 1
          </h1>
          <p className="font-bold uppercase tracking-widest text-lg mb-12"
             style={{ color: '#c4f54b' }}>
            Fútbol amateur Montevideo
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              ['⚽', 'Encontrá partidos en tu barrio'],
              ['🏟️', 'Contactá canchas por WhatsApp'],
              ['💬', 'Chat grupal con los jugadores'],
              ['🏆', 'Sistema de niveles y ranking'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-start gap-3 rounded-2xl p-3.5"
                   style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <span className="text-sm font-medium leading-snug" style={{ color: 'rgba(242,245,235,0.7)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — auth */}
      <div className="flex-1 md:max-w-[420px] flex flex-col justify-center px-6 py-12 relative"
           style={{ background: '#0c0c0c' }}>

        {/* Mobile: logo */}
        <div className="md:hidden mb-10 text-center">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'rgba(196,245,75,0.08)', border: '1px solid rgba(196,245,75,0.2)' }}>
            <span className="text-5xl">⚽</span>
          </div>
          <h1 className="text-f-text text-5xl font-black uppercase" style={{ letterSpacing: '-0.02em' }}>FALTA 1</h1>
          <p className="font-bold uppercase tracking-widest text-sm mt-2" style={{ color: '#c4f54b' }}>Fútbol amateur Mvd</p>
        </div>

        {/* Título desktop */}
        <div className="hidden md:block mb-8">
          <h2 className="text-f-text text-3xl font-black">Bienvenido 👋</h2>
          <p className="text-f-muted text-base mt-1">Entrá o creá tu cuenta</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 p-1 rounded-2xl gap-1"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'google',   label: 'Google' },
            { id: 'login',    label: 'Ingresar' },
            { id: 'registro', label: 'Registrarse' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all"
              style={tab === t.id
                ? { background: '#c4f54b', color: '#0c0c0c' }
                : { color: '#5a5a5a' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        <div>
          {tab === 'google'   && <TabGoogle onLogin={loginConGoogle} />}
          {tab === 'login'    && <TabEmail onLogin={loginConEmail} />}
          {tab === 'registro' && <TabRegistro onRegistrar={registrarConEmail} />}
        </div>

        <p className="mt-8 text-xs text-center leading-relaxed" style={{ color: '#3a3a3a' }}>
          Al entrar aceptás las reglas de asistencia y el sistema de penalizaciones.<br />
          🇺🇾 Solo Montevideo, Uruguay
        </p>
      </div>
    </div>
  );
}

/* ── Tab Google ──────────────────────────────────────────────── */
function TabGoogle({ onLogin }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handle = async () => {
    setCargando(true); setError(null);
    try { await onLogin(); }
    catch { setError('No se pudo iniciar sesión. Intentá de nuevo.'); setCargando(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={handle} disabled={cargando}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base uppercase
                   transition-all active:scale-97 disabled:opacity-60"
        style={{ background: '#fff', color: '#111', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        {cargando
          ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin-custom" />
          : <GoogleSVG />}
        {cargando ? 'Entrando...' : 'Continuar con Google'}
      </button>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
}

/* ── Tab Email Login ─────────────────────────────────────────── */
function TabEmail({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    setCargando(true); setError(null);
    try { await onLogin(email.trim(), password); }
    catch (err) {
      const msgs = {
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-email': 'Email no válido.',
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.',
      };
      setError(msgs[err.code] || 'Error al iniciar sesión.');
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handle} className="flex flex-col gap-3">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Email" required className="input-base" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
        placeholder="Contraseña" required className="input-base" />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={cargando || !email || !password} className="btn-lime mt-1">
        {cargando ? 'Entrando...' : 'INICIAR SESIÓN'}
      </button>
    </form>
  );
}

/* ── Tab Registro ────────────────────────────────────────────── */
function TabRegistro({ onRegistrar }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return; }
    setCargando(true); setError(null);
    try { await onRegistrar(nombre.trim(), email.trim(), password); }
    catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
        'auth/invalid-email': 'Email no válido.',
        'auth/weak-password': 'Contraseña demasiado débil.',
      };
      setError(msgs[err.code] || 'Error al registrarse.');
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handle} className="flex flex-col gap-3">
      <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
        placeholder="Tu nombre" required className="input-base" />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Email" required className="input-base" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
        placeholder="Contraseña (mín. 6 caracteres)" required className="input-base" />
      <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
        placeholder="Repetir contraseña" required className="input-base" />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={cargando || !nombre || !email || !password || !password2} className="btn-lime mt-1">
        {cargando ? 'Creando cuenta...' : 'CREAR CUENTA'}
      </button>
    </form>
  );
}

function GoogleSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
