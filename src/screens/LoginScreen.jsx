import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { validarCedula, formatearCedula } from '../utils/cedula';
import { verificarCedulaDisponible, reservarCedula } from '../firebase/firestore';

export default function LoginScreen() {
 const { loginConGoogle, loginConEmail, resetearPassword } = useAuth();
 const [tab, setTab] = useState('google');

 return (
 <div className="min-h-svh flex bg-f-bg overflow-hidden relative">

 {/* Fallback de fondo para cuando el video no carga (mobile) */}
 <div className="absolute inset-0 pointer-events-none"
 style={{ background: 'linear-gradient(160deg, #080d1a 0%, #0c1a2e 30%, #061020 60%, #0c0c0c 100%)' }} />

 {/* Video de fondo — pantalla completa */}
 <video autoPlay muted loop playsInline preload="metadata" poster="/hero-poster.jpg"
 className="absolute inset-0 w-full h-full object-cover pointer-events-none"
 style={{ opacity: 0.4 }}>
 <source src="/hero.mp4" type="video/mp4" />
 </video>
 {/* Overlay oscuro sobre el video */}
 <div className="absolute inset-0 pointer-events-none"
 style={{ background: 'linear-gradient(to right, rgba(12,12,12,0.45) 0%, rgba(12,12,12,0.82) 55%)' }} />

 {/* Panel izquierdo — visual desktop */}
 <div className="hidden md:flex flex-1 relative items-center justify-center p-16 z-10">
 {/* Glow de fondo */}
 <div className="absolute inset-0 pointer-events-none"
 style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(14,165,233,0.06) 0%, transparent 60%)' }} />
 {/* Línea bottom */}
 <div className="absolute bottom-0 left-0 right-0 h-px"
 style={{ background: 'linear-gradient(90deg, transparent, rgba(84,181,240,0.2), transparent)' }} />

 <div className="relative z-10 text-center max-w-md">
 {/* Logo grande */}
 <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-3xl overflow-hidden"
 style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(84,181,240,0.2)' }}>
 <img src="/logo.png" alt="Falta 1" className="w-full h-full object-cover"
 onError={(e) => { e.currentTarget.style.opacity='0'; }} />
 </div>

 <h1 className="text-white font-black uppercase leading-none mb-3"
 style={{ fontSize: 'clamp(3.5rem,6vw,7rem)', letterSpacing: '-0.02em' }}>
 FALTA <span style={{ color: '#0ea5e9', textShadow: '0 0 40px rgba(14,165,233,0.6)' }}>1</span>
 </h1>
 <p className="font-bold uppercase tracking-widest text-lg"
 style={{ color: '#54b5f0' }}>
 Fútbol & Pádel · Uruguay
 </p>
 <p className="text-white/55 text-base mt-2 mb-8 leading-snug">
 La app para jugar y crear partidos al instante
 </p>

 {/* 4 bloques informativos — formato lista limpia */}
 <div className="text-left rounded-2xl overflow-hidden"
 style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
 {[
 { title: 'Creá tu partido', desc: 'Elegí cancha, horario y nivel en minutos' },
 { title: 'Encontrá tu partido hoy', desc: 'Filtrá por zona, nivel y deporte y anotate en segundos' },
 { title: 'Todo en efectivo', desc: 'Sin pagos digitales, sin comisiones' },
 { title: 'Fútbol y pádel', desc: 'Para todos los niveles, en Montevideo y Flores' },
 ].map((b, i) => (
 <div key={i} className="flex items-center gap-4 px-5 py-4"
 style={{
 borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
 background: 'rgba(255,255,255,0.02)',
 }}>
 <div>
 <p className="text-white font-black text-sm uppercase tracking-wide leading-tight">{b.title}</p>
 <p className="text-xs mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>{b.desc}</p>
 </div>
 </div>
 ))}
 </div>

 </div>
 </div>

 {/* Panel derecho — auth */}
 <div className="flex-1 md:flex-none md:w-[420px] flex flex-col justify-center px-6 py-12 relative z-10 overflow-y-auto"
 style={{ background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>

 {/* Mobile: logo */}
 <div className="md:hidden mb-10 text-center">
 <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center overflow-hidden"
 style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(84,181,240,0.25)' }}>
 <img src="/logo.png" alt="Falta 1" className="w-full h-full object-cover"
 onError={(e) => { e.currentTarget.style.opacity='0'; }} />
 </div>
 <h1 className="text-f-text text-5xl font-black uppercase" style={{ letterSpacing: '-0.02em' }}>
 FALTA <span style={{ color: '#0ea5e9', textShadow: '0 0 32px rgba(14,165,233,0.6)' }}>1</span>
 </h1>
 <p className="font-bold uppercase tracking-widest text-sm mt-2" style={{ color: '#54b5f0' }}>Fútbol & Pádel · Uruguay</p>
 <p className="text-f-muted text-sm mt-1.5 leading-snug px-4">La app para jugar y crear partidos al instante</p>
 </div>

 {/* Título desktop */}
 <div className="hidden md:block mb-8">
 <h2 className="text-f-text text-3xl font-black">Bienvenido</h2>
 <p className="text-f-muted text-base mt-1">Entrá o creá tu cuenta</p>
 </div>

 {/* Tabs */}
 <div className="flex mb-6 p-1 rounded-2xl gap-1"
 style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
 {[
 { id: 'google', label: 'Google' },
 { id: 'login', label: 'Ingresar' },
 { id: 'registro', label: 'Registrarse' },
 ].map(t => (
 <button key={t.id} onClick={() => setTab(t.id)}
 className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all"
 style={tab === t.id
 ? { background: '#0ea5e9', color: '#ffffff' }
 : { color: '#5a5a5a' }}>
 {t.label}
 </button>
 ))}
 </div>

 {/* Panels */}
 <div>
 {tab === 'google' && <TabGoogle onLogin={loginConGoogle} />}
 {tab === 'login' && <TabEmail onLogin={loginConEmail} onRecuperar={() => setTab('recuperar')} />}
 {tab === 'registro' && <TabRegistro />}
 {tab === 'recuperar' && <TabRecuperar onReset={resetearPassword} onVolver={() => setTab('login')} />}
 </div>

 <p className="mt-8 text-xs text-center leading-relaxed" style={{ color: '#3a3a3a' }}>
 Al entrar aceptás las reglas de asistencia y el sistema de penalizaciones.<br />
 Montevideo y Flores, Uruguay
 </p>
 </div>
 </div>
 );
}

/* Tab Google */
function TabGoogle({ onLogin }) {
 const [cargando, setCargando] = useState(false);
 const [error, setError] = useState(null);

 const handle = async () => {
 setCargando(true); setError(null);
 try { await onLogin(); }
 catch (err) {
  const msgs = {
   'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar el inicio de sesión.',
   'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.',
   'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase. Agregá falta-1.com en la consola de Firebase.',
   'auth/cancelled-popup-request': null, // silencioso — el usuario abrió otro popup
   'auth/account-exists-with-different-credential': 'Ya existe una cuenta con ese email usando otro método de inicio de sesión.',
   'auth/network-request-failed': 'Error de conexión. Verificá tu internet.',
  };
  const msg = msgs[err?.code];
  if (msg !== null) {
   setError(msg !== undefined ? msg : `Error al iniciar sesión (${err?.code || 'desconocido'}). Intentá de nuevo.`);
  }
  setCargando(false);
 }
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

/* Tab Email Login */
function TabEmail({ onLogin, onRecuperar }) {
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
 <button type="button" onClick={onRecuperar}
 className="text-xs text-left transition-colors"
 style={{ color: '#3a3a3a' }}
 onMouseEnter={e => e.currentTarget.style.color = '#54b5f0'}
 onMouseLeave={e => e.currentTarget.style.color = '#3a3a3a'}>
 ¿Olvidaste tu contraseña?
 </button>
 {error && <p className="text-red-400 text-sm">{error}</p>}
 <button type="submit" disabled={cargando || !email || !password} className="btn-lime mt-1">
 {cargando ? 'Entrando...' : 'INICIAR SESIÓN'}
 </button>
 </form>
 );
}

/* Tab Recuperar contraseña */
function TabRecuperar({ onReset, onVolver }) {
 const [email, setEmail] = useState('');
 const [cargando, setCargando] = useState(false);
 const [enviado, setEnviado] = useState(false);
 const [error, setError] = useState(null);

 const handle = async (e) => {
 e.preventDefault();
 setCargando(true); setError(null);
 try {
 await onReset(email.trim());
 setEnviado(true);
 } catch (err) {
 const msgs = {
 'auth/user-not-found': 'No existe una cuenta con ese email.',
 'auth/invalid-email': 'Email no válido.',
 'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.',
 };
 setError(msgs[err.code] || 'Error al enviar el mail.');
 setCargando(false);
 }
 };

 if (enviado) {
 return (
 <div className="flex flex-col gap-4 text-center">
 <div className="text-4xl">✉️</div>
 <div>
 <p className="text-white font-bold text-base mb-1">Mail enviado</p>
 <p className="text-f-muted text-sm leading-snug">
 Revisá tu bandeja de entrada en <span className="text-white">{email}</span> y seguí las instrucciones para restablecer tu contraseña.
 </p>
 </div>
 <button type="button" onClick={onVolver}
 className="text-sm font-bold uppercase tracking-wide transition-all"
 style={{ color: '#54b5f0' }}>
 ← Volver al inicio de sesión
 </button>
 </div>
 );
 }

 return (
 <form onSubmit={handle} className="flex flex-col gap-3">
 <div>
 <p className="text-white font-bold text-base mb-1">Recuperar contraseña</p>
 <p className="text-f-muted text-sm">Ingresá tu email y te enviamos un link para crear una nueva contraseña.</p>
 </div>
 <input type="email" value={email} onChange={e => setEmail(e.target.value)}
 placeholder="Tu email" required className="input-base" />
 {error && <p className="text-red-400 text-sm">{error}</p>}
 <button type="submit" disabled={cargando || !email} className="btn-lime mt-1">
 {cargando ? 'Enviando...' : 'ENVIAR LINK'}
 </button>
 <button type="button" onClick={onVolver}
 className="text-xs text-center transition-colors"
 style={{ color: '#3a3a3a' }}
 onMouseEnter={e => e.currentTarget.style.color = '#54b5f0'}
 onMouseLeave={e => e.currentTarget.style.color = '#3a3a3a'}>
 ← Volver
 </button>
 </form>
 );
}

/* Tab Registro — paso 1: datos, paso 2: código WhatsApp (si hay teléfono) */
function TabRegistro() {
 const { registrarConEmail } = useAuth();
 const [step, setStep] = useState('form'); // 'form' | 'codigo'
 const [nombre, setNombre] = useState('');
 const [email, setEmail] = useState('');
 const [telefono, setTelefono] = useState('');
 const [cedula, setCedula] = useState('');
 const [password, setPassword] = useState('');
 const [password2, setPassword2] = useState('');
 const [codigo, setCodigo] = useState('');
 const [cargando, setCargando] = useState(false);
 const [error, setError] = useState(null);

 const telefonoLimpio = telefono.replace(/\s/g, '');
 const telefonoValido = telefono === '' || /^09\d{7}$/.test(telefonoLimpio);
 const cedulaDigitos = cedula.replace(/\D/g, '');
 const cedulaValida = validarCedula(cedula);

 const handleTelefono = (e) => {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
  let formatted = digits;
  if (digits.length > 6) formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  else if (digits.length > 3) formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
  setTelefono(formatted);
 };

 const handleCedula = (e) => {
  setCedula(e.target.value.replace(/\D/g, '').slice(0, 8));
 };

 // Paso 1: validar datos y (si hay teléfono) enviar código por WhatsApp
 const enviarCodigo = async (e) => {
  e.preventDefault();
  if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
  if (password.length < 6) { setError('La contraseña necesita mínimo 6 caracteres.'); return; }
  if (!cedulaValida) { setError('La cédula ingresada no es válida.'); return; }
  setCargando(true); setError(null);
  try {
   // Pre-chequeo de unicidad antes de crear la cuenta
   const disponible = await verificarCedulaDisponible(cedula);
   if (!disponible) {
    setError('Esta cédula ya tiene una cuenta registrada. Usá la opción Ingresar.');
    setCargando(false);
    return;
   }
   if (telefonoLimpio) {
    const fn = httpsCallable(functions, 'enviarCodigoVerificacion');
    await fn({ telefono: telefonoLimpio });
    setCargando(false);
    setStep('codigo');
   } else {
    // Sin teléfono → crear cuenta y reservar cédula
    const newUser = await registrarConEmail(nombre.trim(), email.trim(), password, {});
    await reservarCedula(newUser.uid, cedula);
   }
  } catch (err) {
   const msgs = {
    'auth/email-already-in-use': 'Ese email ya tiene una cuenta registrada. Usá la opción Ingresar.',
    'auth/invalid-email': 'El email no es válido.',
    'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres).',
    'functions/invalid-argument': 'Número de teléfono inválido.',
    'functions/internal': 'No se pudo enviar el código. Verificá que el número tenga WhatsApp.',
    'functions/resource-exhausted': 'Demasiados intentos. Esperá un momento.',
   };
   setError(msgs[err.code] || err.message || 'Error inesperado. Intentá de nuevo.');
   setCargando(false);
  }
 };

 // Paso 2: verificar código y crear la cuenta
 const verificarYCrear = async (e) => {
  e.preventDefault();
  if (codigo.length < 6) { setError('Ingresá el código de 6 dígitos.'); return; }
  setCargando(true); setError(null);
  try {
   const fn = httpsCallable(functions, 'verificarCodigoVerificacion');
   await fn({ telefono: telefonoLimpio, codigo });
   // Código correcto → crear cuenta con teléfono verificado y reservar cédula
   const newUser = await registrarConEmail(nombre.trim(), email.trim(), password, { telefono: telefonoLimpio });
   await reservarCedula(newUser.uid, cedula);
  } catch (err) {
   const msgs = {
    'functions/unauthenticated': 'Código incorrecto. Revisá el mensaje y volvé a intentar.',
    'functions/deadline-exceeded': 'El código venció. Volvé atrás y pedí uno nuevo.',
    'functions/not-found': 'No hay código activo. Volvé atrás y pedí uno nuevo.',
    'functions/resource-exhausted': 'Demasiados intentos. Volvé atrás y pedí un código nuevo.',
    'auth/email-already-in-use': 'Ese email ya tiene una cuenta registrada. Usá la opción Ingresar.',
   };
   setError(msgs[err.code] || err.message || 'Error al verificar. Intentá de nuevo.');
   setCargando(false);
  }
 };

 // ── Paso 2: formulario de código ──
 if (step === 'codigo') {
  return (
   <form onSubmit={verificarYCrear} className="flex flex-col gap-3">
    <div>
     <p className="text-white font-bold text-base mb-1">Verificá tu celular</p>
     <p className="text-f-muted text-sm leading-snug">
      Te enviamos un código por WhatsApp al{' '}
      <span className="text-white font-bold">+598 {telefonoLimpio.slice(1)}</span>.
      Revisá tus mensajes.
     </p>
    </div>
    <input type="text" inputMode="numeric" value={codigo}
     onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
     placeholder="Código de 6 dígitos" required autoFocus
     className="input-base text-center tracking-[0.4em] text-lg" />
    {error && <p className="text-red-400 text-sm">{error}</p>}
    <button type="submit" disabled={cargando || codigo.length < 6} className="btn-lime mt-1">
     {cargando ? 'Verificando...' : 'CREAR CUENTA'}
    </button>
    <button type="button"
     onClick={() => { setStep('form'); setError(null); setCodigo(''); }}
     className="text-xs text-center transition-colors"
     style={{ color: '#3a3a3a' }}
     onMouseEnter={e => e.currentTarget.style.color = '#54b5f0'}
     onMouseLeave={e => e.currentTarget.style.color = '#3a3a3a'}>
     ← Volver y cambiar el número
    </button>
   </form>
  );
 }

 // ── Paso 1: formulario de datos ──
 return (
  <form onSubmit={enviarCodigo} className="flex flex-col gap-3">
   <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
    placeholder="Tu nombre" required className="input-base" />
   <input type="email" value={email} onChange={e => setEmail(e.target.value)}
    placeholder="Email" required className="input-base" />
   <div>
    <input type="text" inputMode="numeric" value={cedula}
     onChange={handleCedula}
     placeholder="Cédula de identidad (sin puntos ni guión)"
     required className="input-base" />
    {cedula && cedulaDigitos.length >= 7 && !cedulaValida && (
     <p className="text-red-400 text-xs mt-1 px-1">La cédula ingresada no es válida.</p>
    )}
    {cedulaValida && (
     <p className="text-green-400 text-xs mt-1 px-1 font-bold">{formatearCedula(cedula)}</p>
    )}
   </div>
   <div>
    <div className="flex items-center gap-2">
     <span className="text-f-muted text-sm font-mono px-3 rounded-xl flex-shrink-0 flex items-center"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', height: '48px' }}>
      +598
     </span>
     <input type="tel" inputMode="numeric" value={telefono}
      onChange={handleTelefono}
      placeholder="09X XXX XXX (opcional)"
      className="input-base flex-1 min-w-0" />
    </div>
    {telefono && !telefonoValido && (
     <p className="text-orange-400 text-xs mt-1 px-1">Formato: 09X XXX XXX (9 dígitos, empieza con 09)</p>
    )}
    {telefonoValido && telefonoLimpio && (
     <p className="text-green-400 text-xs mt-1 px-1">Recibirás un código de verificación por WhatsApp</p>
    )}
   </div>
   <input type="password" value={password} onChange={e => setPassword(e.target.value)}
    placeholder="Contraseña (mín. 6 caracteres)" required className="input-base" />
   <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
    placeholder="Repetir contraseña" required className="input-base" />
   {error && <p className="text-red-400 text-sm">{error}</p>}
   <button type="submit"
    disabled={cargando || !nombre || !email || !cedulaValida || !telefonoValido || !password || !password2}
    className="btn-lime mt-1">
    {cargando
     ? (telefonoLimpio ? 'Enviando código...' : 'Creando cuenta...')
     : (telefonoLimpio ? 'ENVIAR CÓDIGO DE VERIFICACIÓN' : 'CREAR CUENTA')}
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
