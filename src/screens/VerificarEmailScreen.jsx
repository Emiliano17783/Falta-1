import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export default function VerificarEmailScreen() {
 const { user, logout, recargarUsuario } = useAuth();
 const [verificando, setVerificando] = useState(false);
 const [reenviando, setReenviando] = useState(false);
 const [reenviado, setReenviado] = useState(false);
 const [error, setError] = useState(null);

 const handleYaVerifique = async () => {
  setVerificando(true);
  setError(null);
  await recargarUsuario();
  if (!auth.currentUser?.emailVerified) {
   setError('Tu email todavía no fue verificado. Revisá tu bandeja de entrada y hacé clic en el link.');
  }
  setVerificando(false);
 };

 const handleReenviar = async () => {
  setReenviando(true);
  setError(null);
  try {
   auth.languageCode = 'es';
   await sendEmailVerification(auth.currentUser);
   setReenviado(true);
  } catch (err) {
   const msgs = {
    'auth/too-many-requests': 'Demasiados intentos. Esperá un momento.',
   };
   setError(msgs[err.code] || 'Error al reenviar. Intentá de nuevo.');
  }
  setReenviando(false);
 };

 return (
  <div className="min-h-svh bg-f-bg flex flex-col items-center justify-center px-6 font-barlow">
   <div className="max-w-sm w-full">
    <div className="mb-8 text-center">
     <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
      style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(84,181,240,0.25)' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#54b5f0">
       <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
     </div>
     <h1 className="text-white font-black text-2xl uppercase mb-2">Verificá tu email</h1>
     <p className="text-f-muted text-sm leading-relaxed">
      Te enviamos un link de verificación a{' '}
      <span className="text-white font-bold">{user?.email}</span>.
      Revisá tu bandeja de entrada y hacé clic en el link para activar tu cuenta.
     </p>
    </div>

    {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

    <div className="flex flex-col gap-3">
     <button
      onClick={handleYaVerifique}
      disabled={verificando}
      className="btn-lime">
      {verificando ? 'Verificando...' : 'Ya verifiqué mi email'}
     </button>

     <button
      onClick={handleReenviar}
      disabled={reenviando || reenviado}
      className="w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-all disabled:opacity-60"
      style={{ border: '1px solid rgba(84,181,240,0.3)', color: '#54b5f0' }}>
      {reenviado ? 'Email reenviado' : reenviando ? 'Enviando...' : 'Reenviar email'}
     </button>

     <button
      onClick={logout}
      className="text-xs text-center mt-2 transition-colors"
      style={{ color: '#3a3a3a' }}
      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
      onMouseLeave={e => e.currentTarget.style.color = '#3a3a3a'}>
      Cerrar sesión
     </button>
    </div>
   </div>
  </div>
 );
}
