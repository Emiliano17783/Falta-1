import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validarCedula, formatearCedula } from '../utils/cedula';
import { verificarCedulaDisponible, reservarCedula } from '../firebase/firestore';

export default function CompletarCedulaScreen() {
  const { user, logout } = useAuth();
  const [cedula, setCedula] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cedulaDigitos = cedula.replace(/\D/g, '');
  const cedulaValida = validarCedula(cedula);

  const handleCedula = (e) => {
    setCedula(e.target.value.replace(/\D/g, '').slice(0, 8));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cedulaValida) { setError('La cédula ingresada no es válida.'); return; }
    setCargando(true);
    setError(null);
    try {
      const disponible = await verificarCedulaDisponible(cedula);
      if (!disponible) {
        setError('Esta cédula ya tiene una cuenta registrada. Usá la opción Ingresar.');
        setCargando(false);
        return;
      }
      await reservarCedula(user.uid, cedula);
      // El listener de Firestore en AuthContext actualizará el perfil automáticamente
    } catch (err) {
      setError(err.message || 'No se pudo guardar la cédula. Intentá de nuevo.');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-svh bg-f-bg flex flex-col items-center justify-center px-6 font-barlow">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(84,181,240,0.2)' }}>
            <img src="/logo.png" alt="Falta 1" className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
          </div>
          <h1 className="text-white font-black text-2xl uppercase tracking-tight">
            Un paso más
          </h1>
          <p className="text-f-muted text-sm mt-2 leading-snug">
            Para usar Falta 1 necesitamos tu cédula de identidad.
          </p>
        </div>

        <div className="bg-f-card border border-f-border rounded-2xl px-5 py-4 mb-5">
          <p className="text-white font-bold text-sm mb-1">Por qué pedimos tu cédula</p>
          <p className="text-f-muted text-xs leading-relaxed">
            Es obligatoria para garantizar que cada jugador tiene una sola cuenta.
            No se muestra a otros usuarios ni aparece en los partidos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-f-muted text-xs font-bold uppercase tracking-widest block mb-2">
              Cédula de identidad
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cedula}
              onChange={handleCedula}
              placeholder="Ej: 12345678 (sin puntos ni guión)"
              required
              autoFocus
              className="input-base"
            />
            {cedula && cedulaDigitos.length >= 7 && !cedulaValida && (
              <p className="text-red-400 text-xs mt-1.5 px-1">La cédula ingresada no es válida.</p>
            )}
            {cedulaValida && (
              <p className="text-green-400 text-xs mt-1.5 px-1 font-bold">{formatearCedula(cedula)}</p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={cargando || !cedulaValida}
            className="btn-lime">
            {cargando ? 'Guardando...' : 'CONTINUAR'}
          </button>
        </form>

        <button
          type="button"
          onClick={logout}
          className="w-full mt-6 text-sm font-bold uppercase text-center transition-colors"
          style={{ color: '#3a3a3a' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = '#3a3a3a'}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
