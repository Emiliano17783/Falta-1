import { useState } from 'react';
import { crearPartido } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { CANCHAS } from '../data/canchas';

const MODALIDADES = ['F5', 'F7'];
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];
const NIVEL_CONFIG = {
  Principiante: { color: '#4ade80', bg: '#14532d' },
  Intermedio: { color: '#fbbf24', bg: '#713f12' },
  Avanzado: { color: '#f87171', bg: '#7f1d1d' },
};
const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

export default function CrearScreen({ canchaPreseleccionada, setTab }) {
  const { user, perfil } = useAuth();

  const [modalidad, setModalidad] = useState('F5');
  const [nivel, setNivel] = useState('Intermedio');
  const [fecha, setFecha] = useState('hoy');
  const [horario, setHorario] = useState('20:00');
  const [canchaId, setCanchaId] = useState(canchaPreseleccionada?.id || '');
  const [precioPorJugador, setPrecioPorJugador] = useState('');
  const [paso, setPaso] = useState('form'); // form | publicando | exito | error
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarCanchas, setMostrarCanchas] = useState(false);

  const hoy = new Date();
  const mañana = new Date();
  mañana.setDate(hoy.getDate() + 1);

  const OPCIONES_FECHA = [
    { id: 'hoy', label: 'Hoy', date: hoy },
    { id: 'maniana', label: 'Mañana', date: mañana },
  ];

  const getFechaReal = () => {
    const base = fecha === 'hoy' ? hoy : mañana;
    const [h, m] = horario.split(':');
    const d = new Date(base);
    d.setHours(Number(h), Number(m), 0, 0);
    return d.toISOString();
  };

  const canchaSelec = CANCHAS.find((c) => c.id === canchaId);
  const cupoTotal = modalidad === 'F5' ? 10 : 14;

  const handlePublicar = async () => {
    if (!canchaId || !precioPorJugador || Number(precioPorJugador) <= 0) {
      setErrorMsg('Completá todos los campos antes de publicar.');
      return;
    }
    setPaso('publicando');
    setErrorMsg('');

    try {
      await crearPartido({
        nombreCancha: canchaSelec?.nombre || 'Cancha propia',
        canchaId,
        barrio: canchaSelec?.barrio || '',
        modalidad,
        nivel,
        fechaHora: getFechaReal(),
        cupoTotal,
        precioPorJugador: Number(precioPorJugador),
        organizador: perfil?.nombre || user?.displayName || 'Vos',
      }, user.uid);

      setPaso('exito');
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo publicar el partido. Intentá de nuevo.');
      setPaso('form');
    }
  };

  if (paso === 'publicando') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-barlow bg-falta-bg px-5">
        <div className="w-16 h-16 border-4 border-falta-border border-t-falta-green rounded-full animate-spin-custom mb-6" />
        <p className="text-white text-2xl font-black uppercase">Publicando partido...</p>
        <p className="text-falta-muted text-base mt-2">Un momento</p>
      </div>
    );
  }

  if (paso === 'exito') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-barlow bg-falta-bg px-5 animate-fade-in">
        <div className="text-7xl mb-4">⚽</div>
        <h2 className="text-falta-accent text-3xl font-black uppercase text-center">
          ¡PARTIDO PUBLICADO!
        </h2>
        <p className="text-falta-text text-lg text-center mt-3 px-4">
          Tu partido ya está visible para otros jugadores de Montevideo.
        </p>
        <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-4 mt-6 w-full max-w-xs">
          <p className="text-yellow-300 text-sm text-center font-medium leading-snug">
            Recordá que aplican las reglas de asistencia. Si el partido se cancela, avisá con anticipación.
          </p>
        </div>
        <button
          onClick={() => { setPaso('form'); setTab('inicio'); }}
          className="w-full max-w-xs bg-falta-green text-white font-black text-xl uppercase
                     py-4 rounded-2xl mt-8 active:scale-95 transition-transform"
        >
          VER EL PARTIDO
        </button>
        <button
          onClick={() => setPaso('form')}
          className="text-falta-muted text-base py-3 mt-2"
        >
          Crear otro partido
        </button>
      </div>
    );
  }

  return (
    <div className="font-barlow pb-28">
      <div className="px-5 pt-12 pb-4 bg-falta-card border-b border-falta-border">
        <h1 className="text-white text-3xl font-black uppercase">Crear partido</h1>
        <p className="text-falta-muted text-base">Completá los datos y publicalo</p>
      </div>

      <div className="px-5 pt-5 space-y-6">

        {/* Modalidad */}
        <div>
          <label className="text-falta-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Modalidad
          </label>
          <div className="flex gap-3">
            {MODALIDADES.map((m) => (
              <button
                key={m}
                onClick={() => setModalidad(m)}
                className={`flex-1 py-4 rounded-2xl font-black text-xl uppercase border transition-all
                            ${modalidad === m
                              ? 'bg-falta-green border-falta-green text-white'
                              : 'bg-falta-card border-falta-border text-falta-muted'}`}
              >
                {m === 'F5' ? 'Fútbol 5' : 'Fútbol 7'}
                <br />
                <span className="text-sm font-medium">({m === 'F5' ? '10' : '14'} jugadores)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nivel */}
        <div>
          <label className="text-falta-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Nivel
          </label>
          <div className="flex gap-2">
            {NIVELES.map((n) => {
              const cfg = NIVEL_CONFIG[n];
              return (
                <button
                  key={n}
                  onClick={() => setNivel(n)}
                  className={`flex-1 py-3 rounded-xl font-bold text-base uppercase border transition-all`}
                  style={nivel === n
                    ? { background: cfg.bg, borderColor: cfg.color, color: cfg.color }
                    : { background: 'transparent', borderColor: '#1f2d1f', color: '#6b7f6b' }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="text-falta-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Fecha
          </label>
          <div className="flex gap-2">
            {OPCIONES_FECHA.map((op) => (
              <button
                key={op.id}
                onClick={() => setFecha(op.id)}
                className={`flex-1 py-3 rounded-xl font-bold text-lg uppercase border transition-all
                            ${fecha === op.id
                              ? 'bg-falta-green border-falta-green text-white'
                              : 'bg-falta-card border-falta-border text-falta-muted'}`}
              >
                {op.label}
                <br />
                <span className="text-sm font-medium normal-case">
                  {op.date.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Horario */}
        <div>
          <label className="text-falta-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Horario
          </label>
          <div className="grid grid-cols-4 gap-2">
            {HORARIOS.map((h) => (
              <button
                key={h}
                onClick={() => setHorario(h)}
                className={`py-2.5 rounded-xl font-bold text-base border transition-all
                            ${horario === h
                              ? 'bg-falta-green border-falta-green text-white'
                              : 'bg-falta-card border-falta-border text-falta-muted'}`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Cancha */}
        <div>
          <label className="text-falta-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Cancha
          </label>
          {canchaSelec ? (
            <div className="bg-falta-card border border-falta-accent rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white text-lg font-bold">{canchaSelec.nombre}</p>
                <p className="text-falta-muted text-sm">{canchaSelec.barrio} · {canchaSelec.tipo}</p>
              </div>
              <button
                onClick={() => { setCanchaId(''); setMostrarCanchas(true); }}
                className="text-falta-muted text-sm underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setMostrarCanchas(true)}
              className="w-full border-2 border-dashed border-falta-border rounded-xl py-6
                         text-falta-muted text-lg font-bold flex flex-col items-center gap-2"
            >
              <span className="text-3xl">🏟️</span>
              Elegir cancha
            </button>
          )}

          {/* Lista de canchas inline */}
          {mostrarCanchas && (
            <div className="mt-2 bg-falta-card border border-falta-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {CANCHAS.filter((c) => c.modalidades.includes(modalidad)).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCanchaId(c.id); setMostrarCanchas(false); }}
                  className="w-full text-left px-4 py-3 border-b border-falta-border last:border-b-0
                             flex justify-between items-center hover:bg-falta-bg transition-colors"
                >
                  <div>
                    <p className="text-white font-bold">{c.nombre}</p>
                    <p className="text-falta-muted text-sm">{c.barrio}</p>
                  </div>
                  <span className="text-falta-accent font-bold text-sm">
                    ${c.precioPorHora.toLocaleString('es-UY')}/h
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Precio por jugador */}
        <div>
          <label className="text-falta-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Precio por jugador (pesos uruguayos)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-falta-accent text-xl font-bold">$</span>
            <input
              type="number"
              value={precioPorJugador}
              onChange={(e) => setPrecioPorJugador(e.target.value)}
              placeholder="Ej: 350"
              min="0"
              className="w-full bg-falta-card border border-falta-border rounded-xl
                         pl-10 pr-4 py-3.5 text-white text-xl font-bold
                         placeholder:text-falta-muted outline-none focus:border-falta-accent"
            />
          </div>
          {canchaSelec && precioPorJugador > 0 && (
            <p className="text-falta-muted text-sm mt-1">
              Recaudación estimada: ${(Number(precioPorJugador) * cupoTotal).toLocaleString('es-UY')} si llena el cupo
            </p>
          )}
        </div>

        {/* Resumen */}
        {canchaSelec && precioPorJugador > 0 && (
          <div className="bg-green-950 border border-falta-green rounded-xl p-4 animate-fade-in">
            <p className="text-falta-accent text-base font-bold uppercase mb-2">Resumen del partido</p>
            <div className="space-y-1 text-falta-text text-base">
              <p>📍 {canchaSelec.nombre} — {canchaSelec.barrio}</p>
              <p>⚽ {modalidad === 'F5' ? 'Fútbol 5' : 'Fútbol 7'} · Nivel {nivel}</p>
              <p>📅 {fecha === 'hoy' ? 'Hoy' : 'Mañana'} a las {horario}hs</p>
              <p>💰 ${Number(precioPorJugador).toLocaleString('es-UY')} por jugador · {cupoTotal} cupos</p>
            </div>
          </div>
        )}

        {/* Aviso legal */}
        <div className="bg-falta-card border border-falta-border rounded-xl p-4">
          <p className="text-falta-muted text-sm leading-relaxed">
            📋 Al publicar, el partido quedará visible para todos los jugadores de Montevideo. Aplican las <strong className="text-falta-text">reglas de asistencia y penalización</strong> de la plataforma. Si cancelás con menos de 3 horas, el organizador mantiene los depósitos.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-3">
            <p className="text-red-400 text-base font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Botón publicar */}
        <button
          onClick={handlePublicar}
          disabled={!canchaId || !precioPorJugador || Number(precioPorJugador) <= 0}
          className="w-full bg-falta-green text-white font-black text-2xl uppercase
                     py-5 rounded-2xl transition-all active:scale-95
                     disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 6px 20px rgba(22,163,74,0.5)' }}
        >
          📢 PUBLICAR PARTIDO
        </button>
      </div>
    </div>
  );
}
