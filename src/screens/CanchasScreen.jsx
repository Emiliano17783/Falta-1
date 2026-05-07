import { useState } from 'react';
import { CANCHAS } from '../data/canchas';
import ReservaModal from '../modals/ReservaModal';

const SERVS = {
  'Vestuarios':     { icon: '🚿' },
  'Cantina':        { icon: '🍕' },
  'Estacionamiento':{ icon: '🅿️' },
  'WiFi':           { icon: '📶' },
  'TV Cable':       { icon: '📺' },
};

export default function CanchasScreen({ onCrearPartido }) {
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMod, setFiltroMod] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  const filtradas = CANCHAS.filter(c => {
    if (busqueda && !c.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !c.barrio.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroMod !== 'Todos' && !c.modalidades.includes(filtroMod)) return false;
    if (filtroTipo !== 'Todos' && c.tipo !== filtroTipo) return false;
    return true;
  });

  return (
    <div className="min-h-svh bg-f-bg">

      {/* Header */}
      <div className="bg-f-surface border-b border-f-border px-6 md:px-12 pt-10 pb-5">
        <h1 className="text-white font-black uppercase mb-1" style={{ fontSize:'clamp(2rem,5vw,3.5rem)' }}>
          Canchas
        </h1>
        <p className="text-f-muted text-base mb-5">
          {filtradas.length} canchas disponibles en Montevideo
        </p>

        {/* Búsqueda */}
        <div className="relative mb-4 max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-f-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </span>
          <input type="text" placeholder="Buscar por nombre o barrio..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-f-card border border-f-border rounded-xl pl-11 pr-4 py-3
                       text-white text-base font-medium placeholder:text-f-muted outline-none
                       focus:border-f-accent transition-colors" />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {['Todos','F5','F7'].map(m => (
            <button key={m} onClick={() => setFiltroMod(m)}
              className={`px-4 py-1.5 rounded-lg font-bold text-sm uppercase border transition-all
                          ${filtroMod === m ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
              {m === 'Todos' ? 'Todas' : m}
            </button>
          ))}
          <div className="w-px h-6 bg-f-border self-center" />
          {['Todos','Techada','Abierta'].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-4 py-1.5 rounded-lg font-bold text-sm uppercase border transition-all
                          ${filtroTipo === t ? 'bg-f-accent border-f-accent text-f-bg' : 'border-f-border text-f-muted'}`}>
              {t === 'Todos' ? 'Todas' : t === 'Techada' ? '🏟️ Techada' : '☀️ Abierta'}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla */}
      <div className="px-4 md:px-12 py-6">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="text-7xl mb-4">🏟️</span>
            <p className="text-f-text text-2xl font-black uppercase">Sin canchas</p>
            <p className="text-f-muted text-base mt-1">Probá cambiando los filtros</p>
          </div>
        ) : (
          <div className="canchas-grid">
            {filtradas.map(c => (
              <CanchaCard key={c.id} cancha={c} onReservar={() => setCanchaSeleccionada(c)} />
            ))}
          </div>
        )}
      </div>

      {canchaSeleccionada && (
        <ReservaModal cancha={canchaSeleccionada}
          onClose={() => setCanchaSeleccionada(null)}
          onCrearPartido={cancha => { setCanchaSeleccionada(null); onCrearPartido?.(cancha); }} />
      )}
    </div>
  );
}

function CanchaCard({ cancha, onReservar }) {
  const [expandido, setExpandido] = useState(false);

  const ratingStars = n => Array.from({length:5}).map((_,i) => (
    <span key={i} className={i < n ? 'text-sm' : 'text-sm opacity-20'}>⚽</span>
  ));

  const precioColor = cancha.precioPorHora >= 2800 ? '#f87171'
    : cancha.precioPorHora >= 2000 ? '#fbbf24' : '#4ade80';

  return (
    <div className="card animate-fade-in flex flex-col overflow-hidden">
      {/* Top bar precio */}
      <div className="h-1.5 w-full" style={{ background: precioColor }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 mr-3">
            <p className="text-white text-xl font-black uppercase leading-tight">{cancha.nombre}</p>
            <p className="text-f-muted text-sm mt-0.5">📍 {cancha.barrio}</p>
            {cancha.telefono && (
              <p className="text-f-muted text-xs mt-0.5">📞 {cancha.telefono}</p>
            )}
          </div>
          <div className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex-shrink-0
                          ${cancha.tipo === 'Techada' ? 'bg-blue-950 text-blue-300 border border-blue-900' : 'bg-orange-950 text-orange-300 border border-orange-900'}`}>
            {cancha.tipo === 'Techada' ? '🏟️ Techada' : '☀️ Abierta'}
          </div>
        </div>

        {/* Modalidades + rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {cancha.modalidades.map(m => (
              <span key={m} className="bg-green-950 border border-f-border text-f-accent text-xs font-black px-2.5 py-1 rounded-lg">
                {m}
              </span>
            ))}
          </div>
          <div className="flex">{ratingStars(cancha.rating)}</div>
        </div>

        {/* Precio */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-f-muted text-xs uppercase font-bold tracking-wide">Precio por hora</p>
            <p className="font-black text-3xl" style={{ color: precioColor }}>
              ${cancha.precioPorHora.toLocaleString('es-UY')}
              <span className="text-f-muted text-sm font-medium">/h</span>
            </p>
          </div>
        </div>

        {/* Servicios expandibles */}
        {expandido && (
          <div className="animate-fade-in mb-4">
            <p className="text-f-muted text-xs font-bold uppercase tracking-wider mb-2">Servicios</p>
            <div className="flex flex-wrap gap-2">
              {cancha.servicios.length > 0
                ? cancha.servicios.map(s => {
                    const info = SERVS[s] || { icon: '✓' };
                    return (
                      <div key={s} className="flex items-center gap-1.5 bg-f-surface border border-f-border rounded-lg px-2.5 py-1.5">
                        <span className="text-sm">{info.icon}</span>
                        <span className="text-f-text text-xs font-medium">{s}</span>
                      </div>
                    );
                  })
                : <span className="text-f-muted text-sm">Sin servicios adicionales</span>
              }
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          <button onClick={() => setExpandido(!expandido)}
            className="flex-1 border border-f-border text-f-muted font-bold text-sm uppercase
                       py-2.5 rounded-xl transition-all hover:border-f-text hover:text-f-text active:scale-95">
            {expandido ? 'Ocultar' : 'Ver servicios'}
          </button>
          <button onClick={onReservar}
            className="flex-1 bg-f-green text-white font-black text-sm uppercase
                       py-2.5 rounded-xl active:scale-95 transition-transform"
            style={{ boxShadow: '0 4px 12px rgba(22,163,74,0.4)' }}>
            RESERVAR
          </button>
        </div>
      </div>
    </div>
  );
}
