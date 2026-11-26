import { useState, useEffect } from 'react';
import { crearPartido, crearPartidoBuscoRival } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { CIUDADES, CANCHAS_PADEL } from '../data/canchas';

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];
const HORARIOS = [
 '08:00', '09:00', '10:00', '11:00', '12:00',
 '13:00', '14:00', '15:00', '16:00', '17:00',
 '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

const nivelColor = {
 Principiante: '#22c55e',
 Intermedio: '#f59e0b',
 Avanzado: '#ef4444',
};

export default function CrearScreen({ setTab }) {
 const { user, perfil } = useAuth();

 const [modo, setModo] = useState('abierto');
 const [deporte, setDeporte] = useState('futbol');
 const [modalidad, setModalidad] = useState('F5');
 const [nivel, setNivel] = useState('Intermedio');
 const [ciudad, setCiudad] = useState(perfil?.ciudad || 'Montevideo');
 const [fecha, setFecha] = useState(0);
 const [horario, setHorario] = useState('20:00');

 // Fútbol — campos manuales
 const [nombreCancha, setNombreCancha] = useState('');
 const [barrio, setBarrio] = useState('');
 const [precioTotalCancha, setPrecioTotalCancha] = useState('');

 // Pádel — cancha desde lista
 const [canchaIdPadel, setCanchaIdPadel] = useState('');
 const [mostrarListaPadel, setMostrarListaPadel] = useState(false);

 const [paso, setPaso] = useState('form');
 const [errorMsg, setErrorMsg] = useState('');
 const [partidoIdCreado, setPartidoIdCreado] = useState(null);

 // Reset cancha pádel al cambiar ciudad
 useEffect(() => {
  setCanchaIdPadel('');
 }, [ciudad, deporte]);

 const OPCIONES_FECHA = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  d.setHours(0, 0, 0, 0);
  return {
   label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-UY', { weekday: 'short' }).replace('.', ''),
   date: d,
  };
 });

 const cupoTotal = deporte === 'padel' ? 4 : modalidad === 'F5' ? 10 : 14;
 const modalidadFinal = deporte === 'padel' ? 'Pádel' : modalidad;

 const precioNum = Number(precioTotalCancha) || 0;
 const precioPorJugador = precioNum > 0 ? Math.ceil(precioNum / cupoTotal) : 0;

 // Canchas de pádel filtradas por ciudad
 const canchasPadelFiltradas = CANCHAS_PADEL.filter(c => c.ciudad === ciudad);
 // Organizadas por barrio
 const canchasPorBarrioPadel = canchasPadelFiltradas.reduce((acc, c) => {
  if (!acc[c.barrio]) acc[c.barrio] = [];
  acc[c.barrio].push(c);
  return acc;
 }, {});

 const canchaSelecPadel = CANCHAS_PADEL.find(c => c.id === canchaIdPadel);
 const precioPadelPorJugador = canchaSelecPadel ? Math.ceil(canchaSelecPadel.precioPorHora / cupoTotal) : 0;

 // Solo mostrar horarios con al menos 1 hora de anticipación (para hoy)
 const horariosDisponibles = HORARIOS.filter(h => {
  if (fecha !== 0) return true;
  const [hh, mm] = h.split(':').map(Number);
  const horaPartido = new Date();
  horaPartido.setHours(hh, mm, 0, 0);
  return horaPartido.getTime() - new Date().getTime() >= 60 * 60 * 1000;
 });

 useEffect(() => {
  if (!horariosDisponibles.includes(horario)) setHorario('');
 }, [fecha]);

 const getFechaReal = () => {
  const base = OPCIONES_FECHA[fecha].date;
  const [h, m] = horario.split(':');
  const d = new Date(base);
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
 };

 const handlePublicar = async () => {
  if (deporte === 'padel' && !canchaIdPadel) {
   setErrorMsg('Elegí una cancha de pádel antes de publicar.');
   return;
  }
  if (deporte === 'futbol' && !nombreCancha.trim()) {
   setErrorMsg('Completá el nombre de la cancha antes de publicar.');
   return;
  }
  if (!horario) {
   setErrorMsg('Elegí un horario antes de publicar.');
   return;
  }
  setPaso('publicando');
  setErrorMsg('');
  try {
   let datos;
   if (deporte === 'padel') {
    datos = {
     deporte,
     nombreCancha: canchaSelecPadel?.nombre || 'Cancha de pádel',
     barrio: canchaSelecPadel?.barrio || '',
     ciudad,
     modalidad: modalidadFinal,
     nivel,
     fechaHora: getFechaReal(),
     cupoTotal,
     precioPorJugador: precioPadelPorJugador,
     precioTotalCancha: canchaSelecPadel?.precioPorHora || 0,
     organizador: perfil?.nombre || user?.displayName || 'Vos',
    };
   } else {
    datos = {
     deporte,
     nombreCancha: nombreCancha.trim(),
     barrio: barrio.trim(),
     ciudad,
     modalidad: modalidadFinal,
     nivel,
     fechaHora: getFechaReal(),
     cupoTotal,
     precioPorJugador,
     precioTotalCancha: precioNum,
     organizador: perfil?.nombre || user?.displayName || 'Vos',
    };
   }
   let nuevoId;
   if (modo === 'rival') {
    nuevoId = await crearPartidoBuscoRival(
     { ...datos, jugadoresPorEquipo: Math.ceil(cupoTotal / 2) },
     user.uid
    );
   } else {
    nuevoId = await crearPartido(datos, user.uid);
   }
   setPartidoIdCreado(nuevoId);
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
    <p className="text-white text-2xl font-black uppercase">Publicando partido...</p>
   </div>
  );
 }

 if (paso === 'exito') {
  const nombreDisplay = deporte === 'padel' ? canchaSelecPadel?.nombre : nombreCancha;
  return (
   <div className="min-h-screen flex flex-col items-center justify-center font-barlow bg-f-bg px-5 animate-fade-in">
    <h2 className="text-f-accent text-3xl font-black uppercase text-center">
     {modo === 'rival' ? '¡DESAFÍO PUBLICADO!' : '¡PARTIDO PUBLICADO!'}
    </h2>
    <p className="text-f-text text-lg text-center mt-3 px-4">
     {modo === 'rival'
      ? 'Tu desafío ya está visible. Cuando otro equipo lo acepte, quedás coordinados entre organizadores.'
      : 'Tu partido ya aparece en el feed para que se anoten jugadores.'}
    </p>
    {partidoIdCreado && (
     <button
      onClick={async () => {
       const url = `${window.location.origin}/?partido=${partidoIdCreado}`;
       const fechaLabel = OPCIONES_FECHA[fecha]?.label?.toLowerCase() || '';
       const text = modo === 'rival'
        ? `¡Buscamos rival! ${nombreDisplay} — ${fechaLabel} a las ${horario}hs`
        : `¡Unite al partido! ${nombreDisplay} — ${fechaLabel} a las ${horario}hs`;
       if (navigator.share) {
        try { await navigator.share({ title: 'Falta 1', text, url }); } catch (_) {}
       } else {
        try { await navigator.clipboard.writeText(url); } catch (_) {}
       }
      }}
      className="w-full max-w-xs py-3.5 rounded-2xl font-bold text-sm uppercase mt-6 active:scale-95 transition-transform flex items-center justify-center gap-2"
      style={{ border: '1px solid rgba(84,181,240,0.25)', color: '#54b5f0' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
       <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
      </svg>
      Invitá amigos
     </button>
    )}
    <button
     onClick={() => { setPaso('form'); setTab('inicio'); }}
     className="w-full max-w-xs bg-f-green text-white font-black text-xl uppercase
     py-4 rounded-2xl mt-3 active:scale-95 transition-transform"
    >
     IR AL INICIO
    </button>
    <button
     onClick={() => setPaso('form')}
     className="text-f-muted text-base py-3 mt-2"
    >
     {modo === 'rival' ? 'Publicar otro desafío' : 'Crear otro partido'}
    </button>
   </div>
  );
 }

 return (
  <div className="font-barlow pb-28">
   <div className="px-5 pt-12 pb-4 bg-f-card border-b border-f-border">
    <h1 className="text-white text-3xl font-black uppercase">Crear partido</h1>
    <p className="text-f-muted text-base">Completá los datos y publicá el partido</p>
   </div>

   <div className="px-5 pt-5 space-y-6">

    {/* Deporte */}
    <div>
     <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
      Deporte
     </label>
     <div className="flex gap-3">
      {[
       { id: 'futbol', label: 'Fútbol' },
       { id: 'padel', label: 'Pádel' },
      ].map(d => (
       <button key={d.id} onClick={() => setDeporte(d.id)}
        className={`flex-1 py-4 rounded-2xl font-black text-xl uppercase border transition-all
        ${deporte === d.id
         ? 'bg-f-green border-f-green text-white'
         : 'bg-f-card border-f-border text-f-muted'}`}>
        <span className="text-base">{d.label}</span>
       </button>
      ))}
     </div>
    </div>

    {/* Modo */}
    <div>
     <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
      Tipo de partido
     </label>
     <div className="flex gap-3">
      {[
       { id: 'abierto', label: 'Partido abierto', desc: 'Cualquiera se anota' },
       { id: 'rival', label: 'Busco rival', desc: 'Tengo mi equipo' },
      ].map(m => (
       <button key={m.id} onClick={() => setModo(m.id)}
        className={`flex-1 py-4 rounded-2xl font-black text-base uppercase border transition-all flex flex-col items-center gap-1
        ${modo === m.id
         ? 'bg-f-green border-f-green text-white'
         : 'bg-f-card border-f-border text-f-muted'}`}>
        {m.label}
        <span className="text-xs font-medium normal-case opacity-70">{m.desc}</span>
       </button>
      ))}
     </div>
     {modo === 'rival' && (
      <div className="mt-3 bg-f-card border border-f-border rounded-xl px-4 py-3">
       <p className="text-f-muted text-sm leading-relaxed">
        Este modo es para cuando ya tenés tu equipo completo. Necesitás exactamente{' '}
        <span className="text-f-text font-bold">
         {deporte === 'padel' ? '2' : modalidad === 'F7' ? '7' : '5'} jugadores
        </span>{' '}
        listos. Si todavía te faltan jugadores, usá el modo "Partido abierto".
       </p>
      </div>
     )}
    </div>

    {/* Ciudad */}
    <div>
     <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
      Ciudad
     </label>
     <div className="flex gap-3">
      {CIUDADES.map(c => (
       <button key={c.id} onClick={() => setCiudad(c.id)}
        className={`flex-1 py-3 rounded-xl font-black text-base uppercase border transition-all
        ${ciudad === c.id
         ? 'bg-f-green border-f-green text-white'
         : 'bg-f-card border-f-border text-f-muted'}`}>
        <span className="text-sm">{c.id === 'Flores' ? 'Flores' : 'Montevideo'}</span>
       </button>
      ))}
     </div>
    </div>

    {/* Modalidad (solo fútbol) */}
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

    {/* Aviso cancelación automática */}
    {modo === 'abierto' && (
     <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
      <p className="text-f-muted text-sm leading-relaxed">
       Si 45 minutos antes del partido no llegás a la mitad de jugadores,
       el partido se cancela automáticamente y todos los anotados reciben una notificación.
      </p>
     </div>
    )}

    {/* Pádel info */}
    {deporte === 'padel' && (
     <div className="bg-f-card border border-f-border rounded-xl px-4 py-3">
      <p className="text-f-text text-sm font-bold"> Partida de pádel — 4 jugadores (2 vs 2)</p>
      <p className="text-f-muted text-xs mt-1">
       El costo de la cancha se divide entre los 4 jugadores.
      </p>
     </div>
    )}

    {/* Nivel */}
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

    {/* ===== FÚTBOL: campos manuales ===== */}
    {deporte === 'futbol' && (
     <>
      <div>
       <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
        Nombre de la cancha
       </label>
       <input
        type="text"
        value={nombreCancha}
        onChange={e => setNombreCancha(e.target.value)}
        placeholder="Ej: Cancha El Parque, Club Los Pinos..."
        className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3 text-white text-base font-medium placeholder:text-f-muted focus:outline-none focus:border-f-accent transition-colors"
       />
      </div>
      <div>
       <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
        Barrio <span className="text-f-muted font-normal normal-case">(opcional)</span>
       </label>
       <input
        type="text"
        value={barrio}
        onChange={e => setBarrio(e.target.value)}
        placeholder="Ej: Pocitos, Tres Cruces..."
        className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3 text-white text-base font-medium placeholder:text-f-muted focus:outline-none focus:border-f-accent transition-colors"
       />
      </div>
      <div>
       <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
        Precio total de la cancha <span className="text-f-muted font-normal normal-case">(opcional)</span>
       </label>
       <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-f-muted font-bold text-base">$</span>
        <input
         type="number"
         min="0"
         value={precioTotalCancha}
         onChange={e => setPrecioTotalCancha(e.target.value)}
         placeholder="0"
         className="w-full bg-f-card border border-f-border rounded-xl pl-8 pr-4 py-3 text-white text-base font-medium placeholder:text-f-muted focus:outline-none focus:border-f-accent transition-colors"
        />
       </div>
       {precioNum > 0 && (
        <p className="text-f-muted text-xs mt-1.5">
         Cada jugador pagaría{' '}
         <span className="text-f-accent font-bold">${precioPorJugador.toLocaleString('es-UY')}</span>
         {' '}({cupoTotal} jugadores)
        </p>
       )}
      </div>
     </>
    )}

    {/* ===== PÁDEL: lista de canchas por barrio ===== */}
    {deporte === 'padel' && (
     <div>
      <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
       Cancha de pádel
      </label>

      {!canchaIdPadel ? (
       <>
        <button onClick={() => setMostrarListaPadel(v => !v)}
         className="w-full border-2 border-dashed border-f-border rounded-xl py-5
         text-f-muted text-base font-bold flex flex-col items-center gap-1">
         <span className="text-2xl"></span>
         Elegir cancha de pádel
        </button>

        {mostrarListaPadel && (
         <div className="mt-2 bg-f-card border border-f-border rounded-xl overflow-hidden">
          {canchasPadelFiltradas.length === 0 ? (
           <p className="text-f-muted text-sm text-center py-6">No hay canchas disponibles en {ciudad}.</p>
          ) : (
           Object.entries(canchasPorBarrioPadel).map(([barrioPadel, canchas]) => (
            <div key={barrioPadel}>
             <p className="text-f-muted text-xs font-black uppercase tracking-widest px-4 py-2 border-b border-f-border"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              {barrioPadel}
             </p>
             {canchas.map(c => (
              <button key={c.id}
               onClick={() => { setCanchaIdPadel(c.id); setMostrarListaPadel(false); }}
               className="w-full text-left px-4 py-3 border-b border-f-border last:border-b-0
               flex justify-between items-center active:bg-f-bg transition-colors">
               <p className="text-white font-bold">{c.nombre}</p>
               <span className="text-f-accent font-bold text-sm flex-shrink-0 ml-2">
                ${c.precioPorHora.toLocaleString('es-UY')}/h
               </span>
              </button>
             ))}
            </div>
           ))
          )}
         </div>
        )}
       </>
      ) : (
       <div className="bg-f-card border border-f-accent rounded-xl p-4 flex justify-between items-center">
        <div>
         <p className="text-white text-lg font-bold">{canchaSelecPadel?.nombre}</p>
         <p className="text-f-muted text-sm">{canchaSelecPadel?.barrio} · ${canchaSelecPadel?.precioPorHora?.toLocaleString('es-UY')}/h</p>
         <p className="text-f-muted text-xs mt-0.5">
          Precio por jugador: <span className="text-f-accent font-bold">${precioPadelPorJugador.toLocaleString('es-UY')}</span>
         </p>
        </div>
        <button onClick={() => setCanchaIdPadel('')}
         className="text-f-muted text-sm underline flex-shrink-0 ml-3">
         Cambiar
        </button>
       </div>
      )}
     </div>
    )}

    {/* Fecha */}
    <div>
     <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
      Fecha
     </label>
     <div className="flex gap-2 overflow-x-auto pb-1">
      {OPCIONES_FECHA.map((op, i) => (
       <button key={i} onClick={() => setFecha(i)}
        className={`flex-shrink-0 px-4 py-3 rounded-xl font-bold text-sm uppercase border transition-all text-center
        ${fecha === i
         ? 'bg-f-green border-f-green text-white'
         : 'bg-f-card border-f-border text-f-muted'}`}>
        {op.label}<br />
        <span className="text-xs font-medium normal-case">
         {op.date.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
        </span>
       </button>
      ))}
     </div>
    </div>

    {/* Horario */}
    <div>
     <label className="text-f-muted text-sm font-bold uppercase tracking-wider block mb-2">
      Horario
     </label>
     <div className="grid grid-cols-4 gap-2">
      {horariosDisponibles.map(h => (
       <button key={h} onClick={() => setHorario(h)}
        className={`py-2.5 rounded-xl font-bold text-base border transition-all
        ${horario === h
         ? 'bg-f-green border-f-green text-white'
         : 'bg-f-card border-f-border text-f-muted'}`}>
        {h}
       </button>
      ))}
     </div>
    </div>

    {/* Resumen */}
    {((deporte === 'futbol' && nombreCancha.trim()) || (deporte === 'padel' && canchaIdPadel)) && horario && (
     <div className="bg-sky-950 border border-f-green rounded-xl p-4 animate-fade-in">
      <p className="text-f-accent text-base font-bold uppercase mb-2">Resumen del partido</p>
      <div className="space-y-1 text-f-text text-base">
       {deporte === 'futbol' ? (
        <p> {nombreCancha.trim()}{barrio.trim() ? ` — ${barrio.trim()}` : ''}</p>
       ) : (
        <p> {canchaSelecPadel?.nombre} — {canchaSelecPadel?.barrio}</p>
       )}
       <p>{deporte === 'padel' ? ' Pádel' : ` ${modalidadFinal}`} · {nivel}</p>
       <p> {OPCIONES_FECHA[fecha]?.label} a las {horario}hs</p>
       <p> {cupoTotal} jugadores</p>
       {((deporte === 'futbol' && precioNum > 0) || deporte === 'padel') && (
        <p>
         ${(deporte === 'padel' ? precioPadelPorJugador : precioPorJugador).toLocaleString('es-UY')} por jugador (en efectivo)
        </p>
       )}
      </div>
     </div>
    )}

    {errorMsg && (
     <div className="bg-red-950 border border-red-800 rounded-xl p-3">
      <p className="text-red-400 text-base font-medium">{errorMsg}</p>
     </div>
    )}

    {/* Botón publicar */}
    <button onClick={handlePublicar}
     disabled={
      !horario ||
      (deporte === 'futbol' && !nombreCancha.trim()) ||
      (deporte === 'padel' && !canchaIdPadel)
     }
     className="w-full bg-f-green text-white font-black text-2xl uppercase
     py-5 rounded-2xl transition-all active:scale-95
     disabled:opacity-40 disabled:cursor-not-allowed"
     style={{ boxShadow: '0 6px 20px rgba(14,165,233,0.5)' }}>
     {modo === 'rival' ? ' PUBLICAR DESAFÍO' : ' PUBLICAR PARTIDO'}
    </button>
   </div>
  </div>
 );
}
