import { useState, useEffect } from 'react';
import {
  obtenerTodosUsuarios, suscribirTodosPartidos,
  eliminarPartidoAdmin, banearUsuario, levantarBan,
  suscribirCanchas, crearCancha, actualizarCancha, eliminarCancha, seedCanchas,
} from '../firebase/firestore';
import { CANCHAS as CANCHAS_STATIC } from '../data/canchas';
import { useAuth } from '../context/AuthContext';

const CANCHA_VACIA = {
  nombre: '', barrio: '', direccion: '', telefono: '', whatsapp: '',
  tipo: 'Techada', modalidades: [], precioPorHora: 0, rating: 4,
  servicios: [], foto: null,
};

export default function AdminScreen({ setTab }) {
  const { perfil } = useAuth();
  const [seccion, setSeccion] = useState('partidos');
  const [partidos, setPartidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [cargandoU, setCargandoU] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  if (!perfil?.admin) {
    return (
      <div className="min-h-svh bg-f-bg flex flex-col items-center justify-center gap-4 p-8">
        <span className="text-7xl">🚫</span>
        <p className="text-white text-2xl font-black uppercase text-center">Acceso denegado</p>
        <p className="text-f-muted text-center">Esta sección es solo para administradores.</p>
        <button onClick={() => setTab('inicio')}
          className="mt-2 bg-f-green text-white font-black px-8 py-3 rounded-xl uppercase">
          Volver al inicio
        </button>
      </div>
    );
  }

  useEffect(() => {
    const unsub = suscribirTodosPartidos(setPartidos);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = suscribirCanchas(setCanchas);
    return unsub;
  }, []);

  const cargarUsuarios = async () => {
    setCargandoU(true);
    const data = await obtenerTodosUsuarios();
    setUsuarios(data);
    setCargandoU(false);
  };

  useEffect(() => {
    if (seccion === 'usuarios') cargarUsuarios();
  }, [seccion]);

  const dosHoras = 2 * 60 * 60 * 1000;
  const pagosVencidos = partidos.filter(p => {
    if (p.pagoCanchaConfirmado) return false;
    if (p.estado === 'cancelado') return false;
    const f = new Date(p.fechaHora);
    return new Date() > new Date(f.getTime() + dosHoras);
  });

  const stats = {
    partidos: partidos.length,
    pendientes: partidos.filter(p => p.estado === 'pendiente').length,
    confirmados: partidos.filter(p => p.estado === 'confirmado').length,
    finalizados: partidos.filter(p => p.estado === 'finalizado').length,
    cancelados: partidos.filter(p => p.estado === 'cancelado').length,
    canchas: canchas.length,
    usuarios: usuarios.length,
    baneados: usuarios.filter(u => u.bloqueado || (u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date())).length,
  };

  return (
    <div className="min-h-svh bg-f-bg">
      {/* Header */}
      <div className="bg-f-surface border-b border-f-border px-6 md:px-12 pt-8 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-900 border border-purple-700 flex items-center justify-center">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h1 className="text-white font-black uppercase text-2xl">Panel Admin</h1>
            <p className="text-f-muted text-sm">Gestión de Falta 1</p>
          </div>
        </div>

        {/* Alerta pagos vencidos */}
        {pagosVencidos.length > 0 && (
          <div className="mb-4 rounded-2xl px-4 py-3"
               style={{ background: 'rgba(194,65,12,0.2)', border: '1px solid rgba(234,88,12,0.5)' }}>
            <p className="text-orange-400 font-black text-sm uppercase">
              ⚠️ {pagosVencidos.length} pago{pagosVencidos.length !== 1 ? 's' : ''} sin confirmar en cancha
            </p>
            <div className="mt-2 space-y-1">
              {pagosVencidos.slice(0, 5).map(p => {
                const f = new Date(p.fechaHora);
                const haceHoras = Math.floor((new Date() - f) / 3600000);
                return (
                  <p key={p.id} className="text-orange-300/70 text-xs">
                    · {p.nombreCancha} — {f.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })} {f.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs (hace {haceHoras}hs) — Org: {p.organizador}
                  </p>
                );
              })}
              {pagosVencidos.length > 5 && (
                <p className="text-orange-400/50 text-xs">y {pagosVencidos.length - 5} más...</p>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
          {[
            { label: 'Total',      val: stats.partidos,    color: '#54b5f0' },
            { label: '⏳ Pend.',   val: stats.pendientes,  color: '#ca8a04' },
            { label: '✅ Conf.',   val: stats.confirmados, color: '#16a34a' },
            { label: '🏁 Fin.',    val: stats.finalizados, color: '#6b7280' },
            { label: '❌ Canc.',   val: stats.cancelados,  color: '#dc2626' },
            { label: 'Canchas',    val: stats.canchas,     color: '#60a5fa' },
            { label: 'Usuarios',   val: stats.usuarios,    color: '#a78bfa' },
            { label: 'Suspendidos',val: stats.baneados,    color: '#f97316' },
          ].map(s => (
            <div key={s.label} className="bg-f-card border border-f-border rounded-xl p-3 text-center">
              <p className="font-black text-xl" style={{ color: s.color }}>{s.val}</p>
              <p className="text-f-muted text-xs font-bold uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'partidos', label: '⚽ Partidos' },
            { id: 'canchas',  label: '🏟️ Canchas' },
            { id: 'usuarios', label: '👥 Usuarios' },
          ].map(t => (
            <button key={t.id} onClick={() => setSeccion(t.id)}
              className={`px-5 py-2 rounded-lg font-bold text-sm uppercase border transition-all
                          ${seccion === t.id ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-12 py-6">
        {seccion === 'partidos' && <SeccionPartidos partidos={partidos} />}
        {seccion === 'canchas'  && <SeccionCanchas canchas={canchas} />}
        {seccion === 'usuarios' && (
          <SeccionUsuarios usuarios={usuarios} cargando={cargandoU}
            busqueda={busqueda} setBusqueda={setBusqueda}
            onRecargar={cargarUsuarios} />
        )}
      </div>
    </div>
  );
}

/* ── Sección Partidos ───────────────────────────────────────── */
const ESTADO_CONFIG = {
  pendiente:  { label: '⏳ Pendiente',  bg: 'bg-yellow-950', border: 'border-yellow-800', text: 'text-yellow-300' },
  confirmado: { label: '✅ Confirmado', bg: 'bg-green-950',  border: 'border-green-800',  text: 'text-green-300' },
  en_curso:   { label: '🔴 En curso',   bg: 'bg-blue-950',   border: 'border-blue-800',   text: 'text-blue-300' },
  finalizado: { label: '🏁 Finalizado', bg: 'bg-f-surface',  border: 'border-f-border',   text: 'text-f-muted' },
  cancelado:  { label: '❌ Cancelado',  bg: 'bg-red-950',    border: 'border-red-800',    text: 'text-red-400' },
  lleno:      { label: '🔒 Lleno',      bg: 'bg-orange-950', border: 'border-orange-800', text: 'text-orange-300' },
};

function SeccionPartidos({ partidos }) {
  const [filtro, setFiltro] = useState('todos');

  const filtrados = filtro === 'todos' ? partidos
    : partidos.filter(p => p.estado === filtro);

  const counts = {
    todos: partidos.length,
    pendiente: partidos.filter(p => p.estado === 'pendiente').length,
    confirmado: partidos.filter(p => p.estado === 'confirmado').length,
    finalizado: partidos.filter(p => p.estado === 'finalizado').length,
    cancelado: partidos.filter(p => p.estado === 'cancelado').length,
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este partido?')) return;
    await eliminarPartidoAdmin(id);
  };

  return (
    <div>
      {/* Filtros rápidos */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { id: 'todos',      label: `Todos (${counts.todos})` },
          { id: 'pendiente',  label: `⏳ Pendientes (${counts.pendiente})` },
          { id: 'confirmado', label: `✅ Confirmados (${counts.confirmado})` },
          { id: 'finalizado', label: `🏁 Finalizados (${counts.finalizado})` },
          { id: 'cancelado',  label: `❌ Cancelados (${counts.cancelado})` },
        ].map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
              ${filtro === f.id ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtrados.length === 0 && (
          <p className="text-f-muted text-center py-12">No hay partidos en este estado.</p>
        )}
        {filtrados.map(p => {
          const fecha = new Date(p.fechaHora);
          const deporte = p.deporte === 'padel' ? '🎾' : '⚽';
          const estadoCfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.cancelado;
          const pagoJugadores = Object.values(p.pagos || {}).filter(v => v.marcadoPorOrganizador).length;
          const totalJugadores = p.jugadoresAnotados || 0;

          return (
            <div key={p.id} className="card overflow-hidden">
              {/* Barra de color por estado */}
              <div className={`h-1 w-full ${estadoCfg.bg.replace('bg-', 'bg-').replace('950','700').replace('surface','f-border')}`}
                   style={{ background: p.estado === 'confirmado' ? '#16a34a' : p.estado === 'pendiente' ? '#ca8a04' : p.estado === 'cancelado' ? '#dc2626' : p.estado === 'finalizado' ? '#374151' : '#2563eb' }} />

              <div className="p-4 space-y-3">
                {/* Fila 1: cancha + estado + deporte */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{deporte}</span>
                      <p className="text-white font-black text-base leading-tight truncate">{p.nombreCancha}</p>
                    </div>
                    <p className="text-f-muted text-xs mt-0.5">📍 {p.barrio} · {p.modalidad} · Nivel: {p.nivel || '—'}</p>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border flex-shrink-0 ${estadoCfg.bg} ${estadoCfg.border} ${estadoCfg.text}`}>
                    {estadoCfg.label}
                  </span>
                </div>

                {/* Fila 2: fecha, jugadores, organizador */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-f-bg rounded-lg px-2 py-2">
                    <p className="text-white text-xs font-black">
                      {fecha.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-f-muted text-xs">
                      {fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs
                    </p>
                  </div>
                  <div className="bg-f-bg rounded-lg px-2 py-2">
                    <p className="text-white text-xs font-black">{p.jugadoresAnotados}/{p.cupoTotal}</p>
                    <p className="text-f-muted text-xs">Jugadores</p>
                  </div>
                  <div className="bg-f-bg rounded-lg px-2 py-2">
                    <p className="text-white text-xs font-black truncate">{p.organizador || '—'}</p>
                    <p className="text-f-muted text-xs">Organizador</p>
                  </div>
                </div>

                {/* Fila 3: pagos */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {/* Pago de la cancha */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border
                      ${p.pagoCanchaConfirmado
                        ? 'bg-green-950 border-green-800 text-green-300'
                        : 'bg-f-surface border-f-border text-f-muted'}`}>
                      {p.pagoCanchaConfirmado ? '💰 Pago cancha ✅' : '💰 Pago cancha ⏳'}
                    </span>
                    {/* Pagos jugadores */}
                    {totalJugadores > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-f-surface border-f-border text-f-muted">
                        👥 {pagoJugadores}/{totalJugadores} pagaron
                      </span>
                    )}
                  </div>
                  {/* Precio */}
                  {p.precioPorJugador > 0 && (
                    <span className="text-f-accent text-xs font-bold flex-shrink-0">
                      ${p.precioPorJugador?.toLocaleString('es-UY')}/jug
                    </span>
                  )}
                </div>

                {/* Motivo rechazo si cancelado */}
                {p.estado === 'cancelado' && p.motivoRechazo && (
                  <p className="text-red-400 text-xs bg-red-950/50 rounded-lg px-3 py-2">
                    Motivo: {p.motivoRechazo}
                  </p>
                )}

                {/* Botón eliminar */}
                <button onClick={() => handleEliminar(p.id)}
                  className="w-full py-2 rounded-xl border border-red-900/50 text-red-500 text-xs font-bold
                             hover:bg-red-950 transition-colors active:scale-95">
                  🗑️ Eliminar partido
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sección Canchas ────────────────────────────────────────── */
function SeccionCanchas({ canchas }) {
  const [form, setForm] = useState(null); // null = lista, 'nueva' | objeto = formulario
  const [guardando, setGuardando] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm('¿Cargar las 14 canchas predeterminadas? (Solo funciona si no hay ninguna cargada)')) return;
    setSeeding(true);
    const res = await seedCanchas(CANCHAS_STATIC);
    setSeeding(false);
    if (res === 'ya_existe') alert('Ya hay canchas cargadas.');
    else alert('¡14 canchas cargadas exitosamente!');
  };

  const handleGuardar = async (datos) => {
    setGuardando(true);
    try {
      if (form === 'nueva') {
        await crearCancha(datos);
      } else {
        await actualizarCancha(form.id, datos);
      }
      setForm(null);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar la cancha "${nombre}"?`)) return;
    await eliminarCancha(id);
  };

  if (form !== null) {
    return (
      <FormCancha
        inicial={form === 'nueva' ? CANCHA_VACIA : form}
        onGuardar={handleGuardar}
        onCancelar={() => setForm(null)}
        guardando={guardando}
        esNueva={form === 'nueva'}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-f-muted text-sm font-bold uppercase">{canchas.length} canchas</p>
        <div className="flex gap-2">
          {canchas.length === 0 && (
            <button onClick={handleSeed} disabled={seeding}
              className="px-4 py-2 rounded-xl border border-blue-700 text-blue-400 font-bold text-sm
                         active:scale-95 transition-transform disabled:opacity-50">
              {seeding ? 'Cargando...' : '⬇️ Cargar las 14 predeterminadas'}
            </button>
          )}
          <button onClick={() => setForm('nueva')}
            className="px-4 py-2 rounded-xl bg-f-green text-white font-bold text-sm active:scale-95 transition-transform">
            + Nueva cancha
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {canchas.map(c => (
          <div key={c.id} className="card flex items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <p className="text-white font-black truncate">{c.nombre}</p>
              <p className="text-f-muted text-xs">
                📍 {c.barrio} · {c.tipo} · {c.modalidades?.join(', ')} · ${c.precioPorHora?.toLocaleString('es-UY')}/h
              </p>
              {c.whatsapp && (
                <p className="text-sky-400 text-xs">WhatsApp: {c.whatsapp}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setForm(c)}
                className="px-3 py-1.5 rounded-lg border border-f-border text-f-muted font-bold text-xs
                           hover:border-f-accent hover:text-f-accent transition-colors">
                ✏️ Editar
              </button>
              <button onClick={() => handleEliminar(c.id, c.nombre)}
                className="p-1.5 rounded-lg border border-red-900 text-red-500 hover:bg-red-950 transition-colors">
                🗑️
              </button>
            </div>
          </div>
        ))}
        {canchas.length === 0 && (
          <p className="text-f-muted text-center py-12">
            No hay canchas. Cargá las 14 predeterminadas o creá una nueva.
          </p>
        )}
      </div>
    </div>
  );
}

function FormCancha({ inicial, onGuardar, onCancelar, guardando, esNueva }) {
  const [datos, setDatos] = useState({ ...inicial });

  const set = (k, v) => setDatos(prev => ({ ...prev, [k]: v }));

  const toggleModalidad = (m) => {
    const mods = datos.modalidades || [];
    set('modalidades', mods.includes(m) ? mods.filter(x => x !== m) : [...mods, m]);
  };

  const toggleServicio = (s) => {
    const servs = datos.servicios || [];
    set('servicios', servs.includes(s) ? servs.filter(x => x !== s) : [...servs, s]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!datos.nombre || !datos.barrio) return;
    onGuardar({
      ...datos,
      precioPorHora: Number(datos.precioPorHora) || 0,
      rating: Number(datos.rating) || 4,
    });
  };

  const campo = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-1">{label}</label>
      <input type={type} value={datos[key] || ''} placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
        className="w-full bg-f-bg border border-f-border rounded-xl px-4 py-2.5
                   text-white text-sm outline-none focus:border-f-accent transition-colors placeholder:text-f-muted" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-black text-xl uppercase">
          {esNueva ? 'Nueva cancha' : `Editar: ${inicial.nombre}`}
        </h2>
        <button type="button" onClick={onCancelar} className="text-f-muted text-sm">Cancelar</button>
      </div>

      {campo('Nombre *', 'nombre', 'text', 'Ej: Boston River Fútbol 5')}
      {campo('Barrio *', 'barrio', 'text', 'Ej: Sayago')}
      {campo('Dirección', 'direccion', 'text', 'Ej: Saladero Fariño 3388')}
      {campo('Teléfono', 'telefono', 'text', 'Ej: 2622 7222')}
      {campo('WhatsApp (solo números, con 598)', 'whatsapp', 'text', 'Ej: 59826227222')}

      <div className="grid grid-cols-2 gap-3">
        {campo('Precio/hora (UYU)', 'precioPorHora', 'number', '2000')}
        <div>
          <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-1">Rating (1-5)</label>
          <select value={datos.rating || 4} onChange={e => set('rating', e.target.value)}
            className="w-full bg-f-bg border border-f-border rounded-xl px-4 py-2.5 text-white text-sm outline-none">
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ⚽</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-2">Tipo</label>
        <div className="flex gap-2">
          {['Techada', 'Abierta'].map(t => (
            <button key={t} type="button" onClick={() => set('tipo', t)}
              className={`flex-1 py-2 rounded-xl border font-bold text-sm transition-all
                          ${datos.tipo === t ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
              {t === 'Techada' ? '🏟️ Techada' : '☀️ Abierta'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-2">Modalidades</label>
        <div className="flex gap-2">
          {['F5', 'F7'].map(m => (
            <button key={m} type="button" onClick={() => toggleModalidad(m)}
              className={`px-6 py-2 rounded-xl border font-bold text-sm transition-all
                          ${(datos.modalidades || []).includes(m) ? 'bg-f-green border-f-green text-white' : 'border-f-border text-f-muted'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-f-muted text-xs font-bold uppercase tracking-wider block mb-2">Servicios</label>
        <div className="flex flex-wrap gap-2">
          {['Vestuarios', 'Cantina', 'Estacionamiento', 'WiFi', 'TV Cable'].map(s => (
            <button key={s} type="button" onClick={() => toggleServicio(s)}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all
                          ${(datos.servicios || []).includes(s) ? 'bg-f-accent border-f-accent text-f-bg' : 'border-f-border text-f-muted'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={guardando || !datos.nombre || !datos.barrio || !(datos.modalidades?.length > 0)}
        className="w-full bg-f-green text-white font-black text-lg uppercase py-3.5 rounded-2xl
                   active:scale-95 transition-transform disabled:opacity-50">
        {guardando ? 'Guardando...' : esNueva ? 'CREAR CANCHA' : 'GUARDAR CAMBIOS'}
      </button>
    </form>
  );
}

/* ── Sección Usuarios ───────────────────────────────────────── */
function SeccionUsuarios({ usuarios, cargando, busqueda, setBusqueda, onRecargar }) {
  const handleBanear = async (uid, permanente) => {
    if (!confirm(permanente ? '¿Banear permanentemente?' : '¿Suspender 1 mes?')) return;
    await banearUsuario(uid, permanente);
    onRecargar();
  };

  const handleLevantarBan = async (uid) => {
    if (!confirm('¿Levantar todas las penalizaciones?')) return;
    await levantarBan(uid);
    onRecargar();
  };

  const filtrados = usuarios.filter(u =>
    !busqueda || u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-4 max-w-md">
        <input type="text" placeholder="Buscar usuario..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
                     text-white text-sm placeholder:text-f-muted outline-none focus:border-f-accent" />
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(u => {
            const suspendido = u.bloqueado || (u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date());
            return (
              <div key={u.id} className="card p-4 flex items-center gap-3">
                {u.foto
                  ? <img src={u.foto} alt={u.nombre} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-f-green flex items-center justify-center text-white font-black flex-shrink-0">
                      {(u.nombre || '?')[0].toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold truncate">{u.nombre}</p>
                    {u.admin && <span className="text-xs bg-purple-900 border border-purple-700 text-purple-300 px-2 py-0.5 rounded font-bold">ADMIN</span>}
                    {u.bloqueado && <span className="text-xs bg-red-950 border border-red-800 text-red-400 px-2 py-0.5 rounded font-bold">BANEADO</span>}
                    {!u.bloqueado && u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date() && (
                      <span className="text-xs bg-orange-950 border border-orange-800 text-orange-400 px-2 py-0.5 rounded font-bold">SUSPENDIDO</span>
                    )}
                    {u.advertencia && !suspendido && <span className="text-xs bg-yellow-950 border border-yellow-800 text-yellow-400 px-2 py-0.5 rounded font-bold">⚠️ Advertencia</span>}
                  </div>
                  <p className="text-f-muted text-xs truncate">{u.email}</p>
                  <p className="text-f-muted text-xs">Partidos: {u.partidosJugados} · No-shows: {u.noShows || 0}</p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {suspendido ? (
                    <button onClick={() => handleLevantarBan(u.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 active:scale-95">
                      Levantar ban
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handleBanear(u.id, false)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-950 border border-orange-800 text-orange-400 active:scale-95">
                        Suspender 1 mes
                      </button>
                      <button onClick={() => handleBanear(u.id, true)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-950 border border-red-800 text-red-400 active:scale-95">
                        Banear permanente
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filtrados.length === 0 && (
            <p className="text-f-muted text-center py-8">No se encontraron usuarios.</p>
          )}
        </div>
      )}
    </div>
  );
}
