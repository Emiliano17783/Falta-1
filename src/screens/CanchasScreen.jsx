import { useState } from 'react';
import { CANCHAS_FUTBOL, CANCHAS_PADEL } from '../data/canchas';

const SERVS = {
  'Vestuarios':          { icon: '🚿' },
  'Cantina':             { icon: '🍕' },
  'Estacionamiento':     { icon: '🅿️' },
  'WiFi':                { icon: '📶' },
  'TV Cable':            { icon: '📺' },
  'Barbacoa':            { icon: '🔥' },
  'Festejo Cumpleaños':  { icon: '🎂' },
};

const COURT_IMAGES = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=75&auto=format',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&q=75&auto=format',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=75&auto=format',
  'https://images.unsplash.com/photo-1431324155629-1a5f33d8f5a3?w=600&q=75&auto=format',
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&q=75&auto=format',
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&q=75&auto=format',
  'https://images.unsplash.com/photo-1623743868754-e89e8cf49c6c?w=600&q=75&auto=format',
];

const PADEL_IMAGES = [
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75&auto=format',
  'https://images.unsplash.com/photo-1612632337640-5e99f8c4a4f3?w=600&q=75&auto=format',
  'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=600&q=75&auto=format',
];

export default function CanchasScreen({ onCrearPartido }) {
  const [tabDeporte, setTabDeporte] = useState('futbol');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  const canchasBase = tabDeporte === 'futbol' ? CANCHAS_FUTBOL : CANCHAS_PADEL;

  const filtradas = canchasBase.filter(c => {
    if (busqueda && !c.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !c.barrio.toLowerCase().includes(busqueda.toLowerCase())) return false;
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
        <p className="text-f-muted text-base mb-4">
          Montevideo — contacto directo, sin reserva online
        </p>

        {/* Tabs Fútbol / Pádel */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setTabDeporte('futbol'); setBusqueda(''); setFiltroTipo('Todos'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-base uppercase border transition-all
                        ${tabDeporte === 'futbol' ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
            ⚽ Fútbol <span className="text-xs font-bold opacity-70">({CANCHAS_FUTBOL.length})</span>
          </button>
          <button onClick={() => { setTabDeporte('padel'); setBusqueda(''); setFiltroTipo('Todos'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-base uppercase border transition-all
                        ${tabDeporte === 'padel' ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
            🎾 Pádel <span className="text-xs font-bold opacity-70">({CANCHAS_PADEL.length})</span>
          </button>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-3 max-w-xl">
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

        {/* Filtro tipo (solo fútbol tiene abierta/techada) */}
        {tabDeporte === 'futbol' && (
          <div className="flex flex-wrap gap-2">
            {['Todos','Techada','Abierta'].map(t => (
              <button key={t} onClick={() => setFiltroTipo(t)}
                className={`px-4 py-1.5 rounded-lg font-bold text-sm uppercase border transition-all
                            ${filtroTipo === t ? 'bg-f-accent border-f-accent text-f-bg' : 'border-f-border text-f-muted'}`}>
                {t === 'Todos' ? 'Todas' : t === 'Techada' ? '🏟️ Techada' : '☀️ Abierta'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Descripción del deporte seleccionado */}
      {tabDeporte === 'padel' && (
        <div className="mx-4 md:mx-12 mt-4 bg-f-card border border-f-border rounded-xl px-4 py-3">
          <p className="text-f-text text-sm font-bold">🎾 Pádel en Montevideo</p>
          <p className="text-f-muted text-xs mt-1">
            Partidas de 4 jugadores (2 vs 2). El organizador crea la partida y el costo de la cancha se divide entre los 4.
            Los datos de estas canchas son de referencia — confirmá disponibilidad antes de reservar.
          </p>
        </div>
      )}

      {/* Grilla */}
      <div className="px-4 md:px-12 py-6">
        <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-4">
          {filtradas.length} cancha{filtradas.length !== 1 ? 's' : ''}
        </p>
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="text-7xl mb-4">{tabDeporte === 'padel' ? '🎾' : '🏟️'}</span>
            <p className="text-f-text text-2xl font-black uppercase">Sin canchas</p>
            <p className="text-f-muted text-base mt-1">Probá cambiando los filtros</p>
          </div>
        ) : (
          <div className="canchas-grid">
            {filtradas.map((c, idx) => (
              <CanchaCard key={c.id} cancha={c} idx={idx}
                espadel={tabDeporte === 'padel'}
                onCrearPartido={() => onCrearPartido?.(c)} />
            ))}
          </div>
        )}
      </div>

      {/* Aviso pagos */}
      <div className="px-4 md:px-12 pb-12">
        <div className="bg-f-card border border-f-border rounded-xl px-5 py-4">
          <p className="text-f-text font-bold text-sm mb-1">💵 Pagos 100% en efectivo</p>
          <p className="text-f-muted text-xs leading-relaxed">
            En Falta 1 no hay ningún pago online. El organizador junta el efectivo de los jugadores y paga directamente en caja el día del partido o la partida.
          </p>
        </div>
      </div>
    </div>
  );
}

function CanchaCard({ cancha, idx, espadel, onCrearPartido }) {
  const [expandido, setExpandido] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const copiarTelefono = () => {
    if (!cancha.telefono) return;
    navigator.clipboard.writeText(cancha.telefono).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const imgUrl = espadel
    ? PADEL_IMAGES[idx % PADEL_IMAGES.length]
    : COURT_IMAGES[idx % COURT_IMAGES.length];

  const ratingStars = n => Array.from({length:5}).map((_,i) => (
    <span key={i} className={i < n ? 'text-sm' : 'text-sm opacity-20'}>
      {espadel ? '🎾' : '⚽'}
    </span>
  ));

  const precioColor = cancha.precioPorHora >= 2800 ? '#f87171'
    : cancha.precioPorHora >= 2000 ? '#fbbf24' : '#54b5f0';

  const waMsg = encodeURIComponent(
    `Hola, vi su cancha en Falta 1, ¿tienen disponible el [día] a las [hora]?`
  );
  const waUrl = cancha.whatsapp
    ? `https://wa.me/${cancha.whatsapp}?text=${waMsg}`
    : null;

  return (
    <div className="card animate-fade-in flex flex-col overflow-hidden">
      {/* Header imagen */}
      {cancha.logo ? (
        <div className="relative h-36 flex items-center justify-center overflow-hidden"
             style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(14,165,233,0.06) 0%, #141414 70%)' }}>
          <img src={cancha.logo} alt={cancha.nombre}
               className="max-h-24 max-w-[65%] object-contain"
               style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.7))' }}
               onError={e => { e.currentTarget.style.display = 'none'; }} />
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-black
                          ${cancha.tipo === 'Techada' ? 'bg-blue-950/90 text-blue-300 border border-blue-900' : 'bg-orange-950/90 text-orange-300 border border-orange-900'}`}>
            {cancha.tipo === 'Techada' ? '🏟️ Techada' : '☀️ Abierta'}
          </div>
        </div>
      ) : (
        <div className="relative h-36 overflow-hidden bg-f-card">
          <img src={imgUrl} alt={cancha.nombre} className="w-full h-full object-cover"
               onError={e => { e.currentTarget.parentElement.style.display = 'none'; }} />
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(26,26,26,0.85) 100%)' }} />
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-black
                          ${cancha.tipo === 'Techada' ? 'bg-blue-950/90 text-blue-300 border border-blue-900' : 'bg-orange-950/90 text-orange-300 border border-orange-900'}`}>
            {cancha.tipo === 'Techada' ? '🏟️ Techada' : '☀️ Abierta'}
          </div>
        </div>
      )}

      <div className="h-1 w-full" style={{ background: precioColor }} />

      <div className="p-5">
        {/* Nombre y datos */}
        <div className="mb-3">
          <p className="text-white text-xl font-black uppercase leading-tight">{cancha.nombre}</p>
          <p className="text-f-muted text-sm mt-0.5">📍 {cancha.barrio}</p>
          {cancha.direccion && (
            <p className="text-f-muted text-xs mt-0.5">{cancha.direccion}</p>
          )}
          {cancha.telefono && (
            <p className="text-f-muted text-xs mt-0.5">📞 {cancha.telefono}</p>
          )}
        </div>

        {/* Modalidades + rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {cancha.modalidades.map(m => (
              <span key={m} className="bg-sky-950 border border-f-border text-f-accent text-xs font-black px-2.5 py-1 rounded-lg">
                {m}
              </span>
            ))}
          </div>
          <div className="flex">{ratingStars(cancha.rating)}</div>
        </div>

        {/* Precio — solo referencia */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-f-muted text-xs uppercase font-bold tracking-wide">Precio referencia/hora</p>
            <p className="font-black text-3xl" style={{ color: precioColor }}>
              ${cancha.precioPorHora.toLocaleString('es-UY')}
              <span className="text-f-muted text-sm font-medium">/h</span>
            </p>
            <p className="text-f-muted text-xs">Se paga en efectivo en caja</p>
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
          <div className="flex gap-2">
            <button onClick={() => setExpandido(!expandido)}
              className="flex-1 border border-f-border text-f-muted font-bold text-sm uppercase
                         py-2.5 rounded-xl transition-all hover:border-f-text hover:text-f-text active:scale-95">
              {expandido ? 'Ocultar' : 'Ver servicios'}
            </button>
            <button onClick={onCrearPartido}
              className="flex-1 border border-f-green text-f-accent font-black text-sm uppercase
                         py-2.5 rounded-xl active:scale-95 transition-transform">
              {espadel ? '+ Partida' : '+ Partido'}
            </button>
          </div>

          {/* WhatsApp o llamar */}
          {waUrl ? (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm uppercase
                         active:scale-95 transition-transform text-white"
              style={{ background: '#25D366', boxShadow: '0 4px 12px rgba(37,211,102,0.4)' }}>
              <WhatsAppIcon />
              CONTACTAR POR WHATSAPP
            </a>
          ) : cancha.telefono ? (
            <div className="flex gap-2">
              <a href={`tel:${cancha.telefono.split('/')[0].trim().replace(/\s/g,'')}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm uppercase
                           bg-f-surface border border-f-border text-f-text active:scale-95 transition-transform">
                📞 LLAMAR
              </a>
              <button onClick={copiarTelefono}
                className="px-4 py-2.5 rounded-xl border border-f-border text-f-muted font-bold text-sm
                           active:scale-95 transition-all hover:border-f-accent hover:text-f-accent flex-shrink-0">
                {copiado ? '✅' : '📋'}
              </button>
            </div>
          ) : (
            <div className="bg-f-card border border-f-border rounded-xl px-4 py-2.5 text-center">
              <p className="text-f-muted text-sm">Sin teléfono disponible</p>
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
