import { useState, useEffect } from 'react';
import { CANCHAS as CANCHAS_STATIC } from '../data/canchas';
import { suscribirCanchas } from '../firebase/firestore';

const SERVS = {
  'Vestuarios':     { icon: '🚿' },
  'Cantina':        { icon: '🍕' },
  'Estacionamiento':{ icon: '🅿️' },
  'WiFi':           { icon: '📶' },
  'TV Cable':       { icon: '📺' },
};

export default function CanchasScreen({ onCrearPartido }) {
  const [canchas, setCanchas] = useState(CANCHAS_STATIC);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMod, setFiltroMod] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  useEffect(() => {
    const unsub = suscribirCanchas((data) => {
      setCanchas(data.length > 0 ? data : CANCHAS_STATIC);
    });
    return unsub;
  }, []);

  const filtradas = canchas.filter(c => {
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
          {filtradas.length} canchas disponibles en Montevideo — contacto directo por WhatsApp
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
              <CanchaCard key={c.id} cancha={c}
                onCrearPartido={() => onCrearPartido?.(c)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CanchaCard({ cancha, onCrearPartido }) {
  const [expandido, setExpandido] = useState(false);

  const ratingStars = n => Array.from({length:5}).map((_,i) => (
    <span key={i} className={i < n ? 'text-sm' : 'text-sm opacity-20'}>⚽</span>
  ));

  const precioColor = cancha.precioPorHora >= 2800 ? '#f87171'
    : cancha.precioPorHora >= 2000 ? '#fbbf24' : '#4ade80';

  const waUrl = cancha.whatsapp
    ? `https://wa.me/${cancha.whatsapp}?text=${encodeURIComponent(`Hola! Vi su cancha en Falta1 y me gustaría reservar. ¿Tienen disponibilidad?`)}`
    : null;

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
        <div className="flex flex-col gap-2">
          {/* Fila 1: servicios + crear partido */}
          <div className="flex gap-2">
            <button onClick={() => setExpandido(!expandido)}
              className="flex-1 border border-f-border text-f-muted font-bold text-sm uppercase
                         py-2.5 rounded-xl transition-all hover:border-f-text hover:text-f-text active:scale-95">
              {expandido ? 'Ocultar' : 'Ver más'}
            </button>
            <button onClick={onCrearPartido}
              className="flex-1 border border-f-green text-f-accent font-black text-sm uppercase
                         py-2.5 rounded-xl active:scale-95 transition-transform">
              + Partido
            </button>
          </div>

          {/* Fila 2: WhatsApp */}
          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm uppercase
                         active:scale-95 transition-transform text-white"
              style={{ background: '#25D366', boxShadow: '0 4px 12px rgba(37,211,102,0.4)' }}>
              <WhatsAppIcon />
              CONTACTAR POR WHATSAPP
            </a>
          ) : (
            <div className="w-full text-center text-f-muted text-sm py-2">
              Sin contacto disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}
