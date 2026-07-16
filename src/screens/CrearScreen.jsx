import { useState, useEffect } from 'react';
import { crearPartido, getHorariosOcupados, suscribirPartido } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { CANCHAS_FUTBOL, CANCHAS_PADEL } from '../data/canchas';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];
const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

const nivelColor = {
  Principiante: '#22c55e',
  Intermedio:   '#f59e0b',
  Avanzado:     '#ef4444',
};

export default function CrearScreen({ canchaPreseleccionada, setTab }) {
  const { user, perfil } = useAuth();

  // ── Sport selection
  const [deporte, setDeporte] = useState(
    canchaPreseleccionada?.deporte === 'padel' ? 'padel' : 'futbol'
  );
  const [modalidad, setModalidad] = useState('F5');
  const [nivel, setNivel] = useState('Intermedio');
  const [fecha, setFecha] = useState('hoy');
  const [horario, setHorario] = useState('20:00');
  const [canchaId, setCanchaId] = useState(canchaPreseleccionada?.id || '');
  const [llamadaConfirmada, setLlamadaConfirmada] = useState(!!canchaPreseleccionada);
  const [paso, setPaso] = useState('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarCanchas, setMostrarCanchas] = useState(false);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [partidoIdCreado, setPartidoIdCreado] = useState(null);
  const [estadoCreado, setEstadoCreado] = useState('pendiente');

  useEffect(() => {
    if (!partidoIdCreado) return;
    const unsub = suscribirPartido(partidoIdCreado, (p) => {
      if (p?.estado) setEstadoCreado(p.estado);
    });
    return () => unsub();
  }, [partidoIdCreado]);

  const hoy = new Date();
  const mañana = new Date();
  mañana.setDate(hoy.getDate() + 1);

  const OPCIONES_FECHA = [
    { id: 'hoy',     label: 'Hoy',    date: hoy },
    { id: 'maniana', label: 'Mañana', date: mañana },
  ];

  const canchasList = deporte === 'padel' ? CANCHAS_PADEL : CANCHAS_FUTBOL;
  const canchasDisponibles = deporte === 'futbol'
    ? canchasList.filter(c => c.modalidades.includes(modalidad))
    : canchasList;

  const cupoTotal = deporte === 'padel' ? 4 : modalidad === 'F5' ? 10 : 14;
  const modalidadFinal = deporte === 'padel' ? 'Pádel' : modalidad;
  const fechaDate = fecha === 'hoy' ? hoy : mañana;

  const getFechaReal = () => {
    const base = fecha === 'hoy' ? hoy : mañana;
    const [h, m] = horario.split(':');
    const d = new Date(base);
    d.setHours(Number(h), Number(m), 0, 0);
    return d.toISOString();
  };

  const canchaSelec = canchasList.find(c => c.id === canchaId);

  // Precio auto-calculado desde los datos de la cancha
  const precioTotalCancha = canchaSelec?.precioPorHora || 0;
  const precioPorJugador  = precioTotalCancha > 0 ? Math.ceil(precioTotalCancha / cupoTotal) : 0;

  // Cuando cambia deporte, resetear la cancha si no coincide
  useEffect(() => {
    if (canchaId) {
      const listaActual = deporte === 'padel' ? CANCHAS_PADEL : CANCHAS_FUTBOL;
      if (!listaActual.find(c => c.id === canchaId)) {
        setCanchaId('');
        setLlamadaConfirmada(false);
        setHorariosOcupados([]);
      }
    }
  }, [deporte]);

  // Cargar horarios ocupados cuando cambia cancha o fecha
  useEffect(() => {
    if (!canchaId || !llamadaConfirmada) { setHorariosOcupados([]); return; }
    getHorariosOcupados(canchaId, fechaDate)
      .then(setHorariosOcupados)
      .catch(() => setHorariosOcupados([]));
  }, [canchaId, fecha, llamadaConfirmada]);

  // Si el horario seleccionado queda ocupado al cambiar fecha/cancha, resetear
  useEffect(() => {
    if (horariosOcupados.includes(horario)) setHorario('');
  }, [horariosOcupados]);

  const handleSeleccionarCancha = (c) => {
    setCanchaId(c.id);
    setLlamadaConfirmada(false);
    setMostrarCanchas(false);
    setHorario('20:00');
  };

  const handleCambiarCancha = () => {
    setCanchaId('');
    setLlamadaConfirmada(false);
    setMostrarCanchas(true);
    setHorariosOcupados([]);
  };

  const handlePublicar = async () => {
    if (!canchaId || !horario) {
      setErrorMsg('Completá todos los campos antes de publicar.');
      return;
    }
    if (horariosOcupados.includes(horario)) {
      setErrorMsg('Ese horario ya está reservado en esta cancha. Elegí otro.');
      return;
    }
    setPaso('publicando');
    setErrorMsg('');
    try {
      const nuevoId = await crearPartido({
        deporte,
        nombreCancha: canchaSelec?.nombre || 'Cancha propia',
        canchaId,
        barrio: canchaSelec?.barrio || '',
        modalidad: modalidadFinal,
        nivel,
        fechaHora: getFechaReal(),
        cupoTotal,
        precioPorJugador,
        precioTotalCancha,
        organizador: perfil?.nombre || user?.displayName || 'Vos',
      }, user.uid);
      setPartidoIdCreado(nuevoId);
      setEstadoCreado('pendiente');
      setPaso('exito');
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo publicar. Intentá de nuevo.');
      setPaso('form');
    }
  };

  if (paso === 'publicando') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-barlow bg-f-bg px-5">
        <div className="w-16 h-16 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom mb-6" />
        <p className="text-white text-2xl font-black uppercase">Enviando solicitud...</p>
        <p className="text-f-muted text-base mt-2">Esperando confirmación de la cancha</p>
      </div>
    );
  }

  if (paso === 'exito') {
    const icon = deporte === 'padel' ? '🎾' : '⚽';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-barlow bg-f-bg px-5 animate-fade-in">
        <div className="text-7xl mb-4">{icon}</div>
        <h2 className="text-f-accent text-3xl font-black uppercase text-center">
          ¡SOLICITUD ENVIADA!
        </h2>
        <p className="text-f-text text-lg text-center mt-3 px-4">
          Tu solicitud fue enviada a la cancha. Cuando confirmen, el partido se publicará en el feed.
        </p>
        {estadoCreado === 'confirmado' ? (
          <div className="bg-green-950 border border-green-700 rounded-xl p-4 mt-6 w-full max-w-xs animate-fade-in">
            <p className="text-green-300 text-sm text-center font-black leading-snug uppercase">
              ✅ ¡Partido confirmado por la cancha!
            </p>
            <p className="text-green-400/70 text-xs text-center mt-1">
              Ya aparece en el feed para que se anoten jugadores.
            </p>
          </div>
        ) : estadoCreado === 'cancelado' ? (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 mt-6 w-full max-w-xs animate-fade-in">
            <p className="text-red-300 text-sm text-center font-black leading-snug uppercase">
              ❌ La cancha rechazó la solicitud
            </p>
          </div>
        ) : (
          <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-4 mt-6 w-full max-w-xs">
            <p className="text-yellow-300 text-sm text-center font-medium leading-snug">
              ⏳ Esperando confirmación de la cancha...
            </p>
          </div>
        )}
        <div className="bg-f-card border border-f-border rounded-xl p-4 mt-3 w-full max-w-xs">
          <p className="text-f-muted text-sm text-center leading-snug">
            📋 El pago de la cancha se hace en efectivo en caja el día del partido.
          </p>
        </div>
        <button
          onClick={() => { setPaso('form'); setTab('inicio'); }}
          className="w-full max-w-xs bg-f-green text-white font-black text-xl uppercase
                     py-4 rounded-2xl mt-8 active:scale-95 transition-transform"
        >
          IR AL INICIO
        </button>
        <button
          onClick={() => setPaso('form')}
          className="text-f-muted text-base py-3 mt-2"
        >
          Crear otro partido
        </button>
      </div>
    );
  }

  return (
    <div className="font-barlow pb-28">
      <div className="px-5 pt-12 pb-4 bg-f-card border-b border-f-border">
        <h1 className="text-white text-3xl font-black uppercase">Crear partido</h1>
        <p className="text-f-muted text-base">Completá los datos y enviá la solicitud a la cancha</p>
      </div>

      <div className="px-5 pt-5 space-y-6">

        {/* ─── Deporte ─── */}
        <div>
          <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Deporte
          </label>
          <div className="flex gap-3">
            {[
              { id: 'futbol', icon: '⚽', label: 'Fútbol' },
              { id: 'padel',  icon: '🎾', label: 'Pádel' },
            ].map(d => (
              <button key={d.id} onClick={() => setDeporte(d.id)}
                className={`flex-1 py-4 rounded-2xl font-black text-xl uppercase border transition-all
                            ${deporte === d.id
                              ? 'bg-f-green border-f-green text-white'
                              : 'bg-f-card border-f-border text-f-muted'}`}>
                {d.icon}<br />
                <span className="text-base">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Modalidad (solo fútbol) ─── */}
        {deporte === 'futbol' && (
          <div>
            <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
              Modalidad
            </label>
            <div className="flex gap-3">
              {['F5', 'F7'].map(m => (
                <button key={m} onClick={() => setModalidad(m)}
                  className={`flex-1 py-4 rounded-2xl font-black text-xl uppercase border transition-all
                              ${modalidad === m
                                ? 'bg-f-green border-f-green text-white'
                                : 'bg-f-card border-f-border text-f-muted'}`}>
                  {m === 'F5' ? 'Fútbol 5' : 'Fútbol 7'}<br />
                  <span className="text-sm font-medium">({m === 'F5' ? '10' : '14'} jugadores)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pádel info */}
        {deporte === 'padel' && (
          <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
            <p className="text-f-text text-sm font-bold">🎾 Partida de pádel — 4 jugadores (2 vs 2)</p>
            <p className="text-f-muted text-xs mt-1">
              El costo de la cancha se divide entre los 4 jugadores. El organizador paga en caja.
            </p>
          </div>
        )}

        {/* ─── Nivel ─── */}
        <div>
          <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Nivel
          </label>
          <div className="flex gap-2">
            {NIVELES.map(n => (
              <button key={n} onClick={() => setNivel(n)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase border transition-all
                            ${nivel === n
                              ? 'text-white border-transparent'
                              : 'bg-f-card border-f-border text-f-muted'}`}
                style={nivel === n ? { background: nivelColor[n], borderColor: nivelColor[n] } : {}}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Fecha ─── */}
        <div>
          <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Fecha
          </label>
          <div className="flex gap-2">
            {OPCIONES_FECHA.map(op => (
              <button key={op.id} onClick={() => setFecha(op.id)}
                className={`flex-1 py-3 rounded-xl font-bold text-lg uppercase border transition-all
                            ${fecha === op.id
                              ? 'bg-f-green border-f-green text-white'
                              : 'bg-f-card border-f-border text-f-muted'}`}>
                {op.label}<br />
                <span className="text-sm font-medium normal-case">
                  {op.date.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Cancha ─── */}
        <div>
          <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
            Cancha
          </label>

          {!canchaId ? (
            <>
              <button onClick={() => setMostrarCanchas(true)}
                className="w-full border-2 border-dashed border-f-border rounded-xl py-6
                           text-f-muted text-lg font-bold flex flex-col items-center gap-2">
                <span className="text-3xl">{deporte === 'padel' ? '🎾' : '🏟️'}</span>
                Elegir cancha de {deporte === 'padel' ? 'pádel' : 'fútbol'}
              </button>
              {mostrarCanchas && (
                <div className="mt-2 bg-f-card border border-f-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {canchasDisponibles.map(c => (
                    <button key={c.id} onClick={() => handleSeleccionarCancha(c)}
                      className="w-full text-left px-4 py-3 border-b border-f-border last:border-b-0
                                 flex justify-between items-center hover:bg-f-bg transition-colors">
                      <div>
                        <p className="text-white font-bold">{c.nombre}</p>
                        <p className="text-f-muted text-sm">{c.barrio} · {c.telefono || 'Sin teléfono'}</p>
                      </div>
                      <span className="text-f-accent font-bold text-sm flex-shrink-0 ml-2">
                        ${c.precioPorHora.toLocaleString('es-UY')}/h
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : !llamadaConfirmada ? (
            /* Confirmar disponibilidad */
            <div className="bg-f-card border border-f-accent rounded-2xl p-5 animate-fade-in space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-black text-lg">{canchaSelec?.nombre}</p>
                  <p className="text-f-muted text-sm">{canchaSelec?.barrio} · {canchaSelec?.tipo}</p>
                  {canchaSelec?.direccion && (
                    <p className="text-f-muted text-xs mt-0.5">📍 {canchaSelec.direccion}</p>
                  )}
                </div>
                <button onClick={handleCambiarCancha}
                  className="text-f-muted text-sm underline flex-shrink-0 ml-3">
                  Cambiar
                </button>
              </div>

              <div className="border-t border-f-border pt-4">
                <p className="text-f-accent text-sm font-bold uppercase tracking-wide mb-3">
                  📞 Confirmá disponibilidad antes de publicar
                </p>
                <p className="text-f-muted text-sm mb-4 leading-relaxed">
                  Llamá o escribí a la cancha para confirmar que el horario está libre.
                  Después de confirmar, tu solicitud queda pendiente hasta que la cancha la apruebe desde su panel.
                </p>

                <div className="flex gap-2 mb-4">
                  {canchaSelec?.telefono && (
                    <a href={`tel:${canchaSelec.telefono.replace(/\s/g,'')}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                                 bg-f-green text-white font-black text-sm uppercase active:scale-95 transition-transform">
                      📞 {canchaSelec.telefono}
                    </a>
                  )}
                  {canchaSelec?.whatsapp && (
                    <a href={`https://wa.me/${canchaSelec.whatsapp}?text=${encodeURIComponent(`Hola! Vi la cancha en Falta 1, ¿tienen disponible el ${fecha === 'hoy' ? 'hoy' : 'mañana'} a las ${horario}?`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm uppercase
                                 active:scale-95 transition-transform text-white"
                      style={{ background: '#25D366' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      WA
                    </a>
                  )}
                </div>

                <button onClick={() => setLlamadaConfirmada(true)}
                  className="w-full py-3.5 rounded-xl font-black text-base uppercase border-2 border-f-accent
                             text-f-accent hover:bg-f-accent hover:text-f-bg transition-all active:scale-95">
                  ✅ Confirmé disponibilidad con la cancha
                </button>
              </div>
            </div>
          ) : (
            /* Cancha confirmada */
            <div className="bg-f-card border border-f-accent rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white text-lg font-bold">{canchaSelec?.nombre}</p>
                <p className="text-f-muted text-sm">{canchaSelec?.barrio} · ✅ Disponibilidad confirmada</p>
              </div>
              <button onClick={handleCambiarCancha}
                className="text-f-muted text-sm underline">
                Cambiar
              </button>
            </div>
          )}
        </div>

        {/* ─── Horario — solo si confirmada ─── */}
        {llamadaConfirmada && (
          <div>
            <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
              Horario
              {horariosOcupados.length > 0 && (
                <span className="ml-2 text-red-400 text-xs font-medium normal-case">
                  · {horariosOcupados.length} horario{horariosOcupados.length > 1 ? 's' : ''} ocupado{horariosOcupados.length > 1 ? 's' : ''}
                </span>
              )}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS.map(h => {
                const ocupado = horariosOcupados.includes(h);
                return (
                  <button key={h} onClick={() => !ocupado && setHorario(h)} disabled={ocupado}
                    className={`py-2.5 rounded-xl font-bold text-base border transition-all
                                ${ocupado
                                  ? 'bg-red-950/50 border-red-900 text-red-700 cursor-not-allowed line-through'
                                  : horario === h
                                    ? 'bg-f-green border-f-green text-white'
                                    : 'bg-f-card border-f-border text-f-muted'}`}>
                    {h}
                  </button>
                );
              })}
            </div>
            <p className="text-f-muted text-xs mt-2">🔴 Tachado = ya hay un partido en esa cancha a esa hora</p>
          </div>
        )}

        {/* ─── Precio (calculado desde la cancha) — solo si horario elegido ─── */}
        {llamadaConfirmada && horario && precioTotalCancha > 0 && (
          <div className="bg-f-card border border-f-border rounded-xl p-4 space-y-2">
            <p className="text-f-muted text-xs font-bold uppercase tracking-wider">Precio</p>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-f-accent font-black text-3xl">
                  ${precioPorJugador.toLocaleString('es-UY')}
                </span>
                <span className="text-f-muted text-sm font-medium"> por jugador</span>
              </div>
              <div className="text-right">
                <p className="text-f-muted text-xs">Total cancha</p>
                <p className="text-f-text font-black text-lg">
                  ${precioTotalCancha.toLocaleString('es-UY')}
                </p>
              </div>
            </div>
            <p className="text-f-muted text-xs">
              {cupoTotal} jugadores × ${precioPorJugador.toLocaleString('es-UY')} = ${precioTotalCancha.toLocaleString('es-UY')}
            </p>
          </div>
        )}

        {/* ─── Resumen ─── */}
        {canchaSelec && llamadaConfirmada && horario && (
          <div className="bg-sky-950 border border-f-green rounded-xl p-4 animate-fade-in">
            <p className="text-f-accent text-base font-bold uppercase mb-2">Resumen del partido</p>
            <div className="space-y-1 text-f-text text-base">
              <p>📍 {canchaSelec.nombre} — {canchaSelec.barrio}</p>
              <p>{deporte === 'padel' ? '🎾 Pádel' : `⚽ ${modalidadFinal}`} · {nivel}</p>
              <p>📅 {fecha === 'hoy' ? 'Hoy' : 'Mañana'} a las {horario}hs</p>
              <p>👥 {cupoTotal} jugadores</p>
              <p>💰 ${Number(precioPorJugador).toLocaleString('es-UY')} por jugador (en efectivo)</p>
            </div>
            <div className="mt-3 pt-3 border-t border-f-border">
              <p className="text-yellow-300 text-xs">
                ⏳ El partido queda pendiente hasta que la cancha confirme desde su panel.
              </p>
            </div>
          </div>
        )}

        {/* Aviso de pagos */}
        {llamadaConfirmada && (
          <div className="bg-f-card border border-f-border rounded-xl p-4">
            <p className="text-f-muted text-sm leading-relaxed">
              💵 <strong className="text-f-text">Pago 100% en efectivo</strong> — No hay pagos digitales en Falta 1. El organizador junta la plata de los jugadores y paga en caja el día del partido. La cancha confirma el pago desde su panel.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-3">
            <p className="text-red-400 text-base font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Botón publicar */}
        {llamadaConfirmada && (
          <button onClick={handlePublicar}
            disabled={!canchaId || !horario}
            className="w-full bg-f-green text-white font-black text-2xl uppercase
                       py-5 rounded-2xl transition-all active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 6px 20px rgba(14,165,233,0.5)' }}>
            📢 SOLICITAR RESERVA
          </button>
        )}
      </div>
    </div>
  );
}
