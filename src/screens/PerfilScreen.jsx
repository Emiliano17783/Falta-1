import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfil } from '../firebase/firestore';

const POSICIONES = ['Arquero', 'Defensa', 'Mediocampista', 'Delantero', 'Por definir'];

const INSIGNIAS_INFO = {
  'capitan_frecuente': { icon: '🏆', label: 'Capitán frecuente', desc: 'Organizaste más de 5 partidos' },
  'sin_cancelaciones': { icon: '✅', label: 'Sin cancelaciones', desc: 'Nunca cancelaste un partido' },
  'respuesta_rapida': { icon: '⚡', label: 'Respuesta rápida', desc: 'Respondés siempre en menos de 1h' },
  'buen_companiero': { icon: '🤝', label: 'Buen compañero', desc: 'Valoración excelente de tus pares' },
};

// Perfil de ejemplo para cuando no hay datos reales
const PERFIL_DEMO = {
  nombre: 'Sebas V.',
  posicion: 'Mediocampista',
  ciudad: 'Montevideo',
  partidosJugados: 27,
  reputacion: 5,
  noShows: 0,
  insignias: ['capitan_frecuente', 'sin_cancelaciones', 'respuesta_rapida', 'buen_companiero'],
  penalizacionHasta: null,
  bloqueado: false,
};

const HISTORIAL_DEMO = [
  { cancha: 'Boston River F5', fecha: '3 mayo', resultado: 'Asistió ✅' },
  { cancha: 'Aerosur F5', fecha: '29 abril', resultado: 'Asistió ✅' },
  { cancha: '2 Cabezas', fecha: '24 abril', resultado: 'Asistió ✅' },
  { cancha: 'Centro Gallego', fecha: '18 abril', resultado: 'Asistió ✅' },
  { cancha: 'Enfoque Deportivo', fecha: '10 abril', resultado: 'Asistió ✅' },
];

export default function PerfilScreen() {
  const { user, perfil, logout, refrescarPerfil } = useAuth();
  const [editando, setEditando] = useState(false);
  const [posicion, setPosicion] = useState(perfil?.posicion || 'Mediocampista');
  const [guardando, setGuardando] = useState(false);

  // Usamos perfil de Firestore si existe, sino el demo
  const p = perfil || PERFIL_DEMO;
  const esDemoMode = !perfil;

  const handleGuardar = async () => {
    if (!user) return;
    setGuardando(true);
    await actualizarPerfil(user.uid, { posicion });
    await refrescarPerfil();
    setGuardando(false);
    setEditando(false);
  };

  const renderReputacion = (rep) => {
    const val = Math.round(rep);
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={`text-2xl ${i < val ? 'opacity-100' : 'opacity-20'}`}
      >
        ⚽
      </span>
    ));
  };

  const hoy = new Date();
  const penalizado = p.penalizacionHasta && new Date(p.penalizacionHasta) > hoy;
  const diasPenalizacion = penalizado
    ? Math.ceil((new Date(p.penalizacionHasta) - hoy) / 86400000)
    : 0;

  return (
    <div className="font-barlow pb-28">
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6 relative"
        style={{ background: 'linear-gradient(180deg, #0f2d0f 0%, #0a0f0a 100%)' }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black
                         bg-falta-green shadow-lg overflow-hidden"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                p.nombre.charAt(0).toUpperCase()
              )}
            </div>
            {/* Indicador estado */}
            {!p.bloqueado && !penalizado && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-falta-accent rounded-full border-2 border-falta-bg" />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-white text-2xl font-black uppercase leading-tight">
              {user?.displayName || p.nombre}
            </h1>
            {editando ? (
              <select
                value={posicion}
                onChange={(e) => setPosicion(e.target.value)}
                className="bg-falta-card border border-falta-accent rounded-lg px-2 py-1
                           text-white text-sm mt-1 outline-none"
              >
                {POSICIONES.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            ) : (
              <p className="text-falta-muted text-base">{p.posicion} · {p.ciudad}</p>
            )}
          </div>

          {/* Botón editar/guardar */}
          <button
            onClick={editando ? handleGuardar : () => setEditando(true)}
            disabled={guardando}
            className="text-falta-accent text-sm font-bold border border-falta-accent
                       px-3 py-1.5 rounded-lg"
          >
            {guardando ? '...' : editando ? 'Guardar' : 'Editar'}
          </button>
        </div>

        {esDemoMode && (
          <div className="mt-3 bg-yellow-950 border border-yellow-800 rounded-lg px-3 py-2">
            <p className="text-yellow-400 text-xs font-medium">
              Modo demo — estos son datos de ejemplo de Sebas V.
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Penalización activa */}
        {p.bloqueado && (
          <div className="bg-red-950 border-2 border-red-600 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔴</span>
              <span className="text-red-400 text-lg font-black uppercase">Cuenta bloqueada</span>
            </div>
            <p className="text-red-300 text-sm">
              Tu cuenta está bloqueada por acumulación de no-shows. Contactá al soporte.
            </p>
          </div>
        )}

        {penalizado && !p.bloqueado && (
          <div className="bg-red-950 border-2 border-red-600 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⏸️</span>
              <span className="text-red-400 text-lg font-black uppercase">Suspensión activa</span>
              <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {diasPenalizacion} día{diasPenalizacion !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-red-300 text-sm">No podés anotarte a partidos hasta que se cumpla la suspensión.</p>
          </div>
        )}

        {/* Estadísticas */}
        <div className="bg-falta-card border border-falta-border rounded-2xl p-4">
          <p className="text-falta-muted text-xs font-bold uppercase tracking-wider mb-3">Estadísticas</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-falta-accent text-3xl font-black">{p.partidosJugados}</p>
              <p className="text-falta-muted text-xs font-medium uppercase">Partidos</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-1">
                {renderReputacion(p.reputacion)}
              </div>
              <p className="text-falta-muted text-xs font-medium uppercase">Reputación</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-black ${p.noShows > 0 ? 'text-red-400' : 'text-falta-accent'}`}>
                {p.noShows}
              </p>
              <p className="text-falta-muted text-xs font-medium uppercase">No-shows</p>
            </div>
          </div>

          {/* Barra de reputación */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-falta-muted mb-1">
              <span>Reputación</span>
              <span>{p.reputacion}/5</span>
            </div>
            <div className="w-full h-2 bg-falta-bg rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-falta-accent progress-fill"
                style={{ width: `${(p.reputacion / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Insignias */}
        {p.insignias?.length > 0 && (
          <div className="bg-falta-card border border-falta-border rounded-2xl p-4">
            <p className="text-falta-muted text-xs font-bold uppercase tracking-wider mb-3">
              Insignias ({p.insignias.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {p.insignias.map((ins) => {
                const info = INSIGNIAS_INFO[ins] || { icon: '🏅', label: ins, desc: '' };
                return (
                  <div
                    key={ins}
                    className="bg-green-950 border border-falta-green rounded-xl p-3 flex items-start gap-2"
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <p className="text-falta-accent text-sm font-bold leading-tight">{info.label}</p>
                      <p className="text-falta-muted text-xs mt-0.5">{info.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sistema de penalizaciones */}
        <div className="bg-falta-card border border-falta-border rounded-2xl p-4">
          <p className="text-falta-muted text-xs font-bold uppercase tracking-wider mb-3">
            Sistema de penalizaciones
          </p>
          <div className="space-y-2">
            {[
              { icono: '✅', texto: 'Cancelás con +3 horas de anticipación', resultado: 'Sin penalización' },
              { icono: '❌', texto: 'Cancelás con -3 horas', resultado: 'Perdés el depósito' },
              { icono: '❌', texto: 'No aparecés sin avisar', resultado: 'Perdés el depósito y bajás 0.5 pts de reputación' },
              { icono: '🔴', texto: '2 no-shows acumulados', resultado: 'Suspensión de 7 días' },
              { icono: '🔴', texto: '3 no-shows acumulados', resultado: 'Cuenta bloqueada' },
            ].map(({ icono, texto, resultado }, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-base mt-0.5">{icono}</span>
                <div className="flex-1">
                  <p className="text-falta-text text-sm font-medium">{texto}</p>
                  <p className="text-falta-muted text-xs">{resultado}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historial */}
        <div className="bg-falta-card border border-falta-border rounded-2xl p-4">
          <p className="text-falta-muted text-xs font-bold uppercase tracking-wider mb-3">
            Últimos partidos
          </p>
          <div className="space-y-2">
            {HISTORIAL_DEMO.map((h, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-falta-border last:border-b-0">
                <div>
                  <p className="text-falta-text text-base font-bold">{h.cancha}</p>
                  <p className="text-falta-muted text-sm">{h.fecha}</p>
                </div>
                <span className="text-falta-accent text-sm font-bold">{h.resultado}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={logout}
          className="w-full border border-red-800 text-red-400 font-bold text-lg uppercase
                     py-3.5 rounded-2xl active:scale-95 transition-transform"
        >
          Cerrar sesión
        </button>

        <div className="text-center text-falta-muted text-sm pb-4">
          Falta 1 — Fútbol amateur Montevideo 🇺🇾
        </div>
      </div>
    </div>
  );
}
