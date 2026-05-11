import { useState, useEffect } from 'react';
import {
  obtenerTodosUsuarios, suscribirTodosPartidos,
  eliminarPartidoAdmin, banearUsuario, levantarBan,
} from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function AdminScreen({ setTab }) {
  const { perfil } = useAuth();
  const [seccion, setSeccion] = useState('partidos');
  const [partidos, setPartidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoU, setCargandoU] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Solo admins
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

  const cargarUsuarios = async () => {
    setCargandoU(true);
    const data = await obtenerTodosUsuarios();
    setUsuarios(data);
    setCargandoU(false);
  };

  useEffect(() => {
    if (seccion === 'usuarios') cargarUsuarios();
  }, [seccion]);

  const handleEliminarPartido = async (id) => {
    if (!confirm('¿Eliminar este partido?')) return;
    await eliminarPartidoAdmin(id);
  };

  const handleBanear = async (uid, permanente) => {
    const msg = permanente
      ? '¿Banear permanentemente a este usuario?'
      : '¿Suspender este usuario por 1 mes?';
    if (!confirm(msg)) return;
    await banearUsuario(uid, permanente);
    await cargarUsuarios();
  };

  const handleLevantarBan = async (uid) => {
    if (!confirm('¿Levantar todas las penalizaciones de este usuario?')) return;
    await levantarBan(uid);
    await cargarUsuarios();
  };

  const usuariosFiltrados = usuarios.filter(u =>
    !busqueda || u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const stats = {
    totalPartidos: partidos.length,
    activos: partidos.filter(p => p.activo).length,
    llenos: partidos.filter(p => p.estado === 'lleno').length,
    totalUsuarios: usuarios.length,
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

        {/* Stats rápidas */}
        {usuarios.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Partidos', val: stats.totalPartidos, color: '#4ade80' },
              { label: 'Activos', val: stats.activos, color: '#4ade80' },
              { label: 'Llenos', val: stats.llenos, color: '#f87171' },
              { label: 'Usuarios', val: stats.totalUsuarios, color: '#a78bfa' },
              { label: 'Suspendidos', val: stats.baneados, color: '#f97316' },
            ].map(s => (
              <div key={s.label} className="bg-f-card border border-f-border rounded-xl p-3 text-center">
                <p className="font-black text-2xl" style={{ color: s.color }}>{s.val}</p>
                <p className="text-f-muted text-xs font-bold uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'partidos', label: '⚽ Partidos' },
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

        {/* ── Partidos ── */}
        {seccion === 'partidos' && (
          <div className="space-y-3">
            {partidos.length === 0 && (
              <p className="text-f-muted text-center py-12">No hay partidos.</p>
            )}
            {partidos.map(p => {
              const fecha = new Date(p.fechaHora);
              const fechaStr = fecha.toLocaleDateString('es-UY', { weekday:'short', day:'numeric', month:'short' });
              const hora = fecha.toLocaleTimeString('es-UY', { hour:'2-digit', minute:'2-digit' });

              return (
                <div key={p.id} className="card flex items-center gap-4 p-4">
                  {/* Estado */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0
                    ${p.activo ? 'bg-f-green' : p.estado === 'lleno' ? 'bg-red-500' : 'bg-f-muted'}`} />

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black truncate">{p.nombreCancha}</p>
                    <p className="text-f-muted text-xs">
                      {fechaStr} {hora} · {p.jugadoresAnotados}/{p.cupoTotal} jug · {p.modalidad}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border
                      ${p.activo
                        ? 'bg-green-950 border-green-800 text-green-400'
                        : p.estado === 'lleno'
                          ? 'bg-red-950 border-red-800 text-red-400'
                          : 'bg-f-surface border-f-border text-f-muted'
                      }`}>
                      {p.activo ? 'Abierto' : p.estado === 'lleno' ? 'Lleno' : 'Cerrado'}
                    </span>
                    <button onClick={() => handleEliminarPartido(p.id)}
                      className="p-2 rounded-lg border border-red-900 text-red-500 hover:bg-red-950
                                 transition-colors text-sm font-bold">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Usuarios ── */}
        {seccion === 'usuarios' && (
          <div>
            <div className="relative mb-4 max-w-md">
              <input type="text" placeholder="Buscar usuario..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-f-card border border-f-border rounded-xl px-4 py-3
                           text-white text-sm placeholder:text-f-muted outline-none focus:border-f-accent" />
            </div>

            {cargandoU ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom" />
              </div>
            ) : (
              <div className="space-y-3">
                {usuariosFiltrados.map(u => {
                  const suspendido = u.bloqueado || (u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date());

                  return (
                    <div key={u.id} className="card p-4 flex items-center gap-3">
                      {/* Avatar */}
                      {u.foto
                        ? <img src={u.foto} alt={u.nombre} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-full bg-f-green flex items-center justify-center text-white font-black flex-shrink-0">
                            {(u.nombre || '?')[0].toUpperCase()}
                          </div>
                      }

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-bold truncate">{u.nombre}</p>
                          {u.admin && (
                            <span className="text-xs bg-purple-900 border border-purple-700 text-purple-300 px-2 py-0.5 rounded font-bold">ADMIN</span>
                          )}
                          {u.bloqueado && (
                            <span className="text-xs bg-red-950 border border-red-800 text-red-400 px-2 py-0.5 rounded font-bold">BANEADO</span>
                          )}
                          {!u.bloqueado && u.penalizacionHasta && new Date(u.penalizacionHasta) > new Date() && (
                            <span className="text-xs bg-orange-950 border border-orange-800 text-orange-400 px-2 py-0.5 rounded font-bold">SUSPENDIDO</span>
                          )}
                          {u.advertencia && !suspendido && (
                            <span className="text-xs bg-yellow-950 border border-yellow-800 text-yellow-400 px-2 py-0.5 rounded font-bold">⚠️ Advertencia</span>
                          )}
                        </div>
                        <p className="text-f-muted text-xs truncate">{u.email}</p>
                        <p className="text-f-muted text-xs">Partidos: {u.partidosJugados} · No-shows: {u.noShows || 0}</p>
                      </div>

                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {suspendido ? (
                          <button onClick={() => handleLevantarBan(u.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-950 border border-green-800 text-green-400
                                       active:scale-95 transition-transform">
                            Levantar ban
                          </button>
                        ) : (
                          <>
                            <button onClick={() => handleBanear(u.id, false)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-950 border border-orange-800 text-orange-400
                                         active:scale-95 transition-transform">
                              Suspender 1 mes
                            </button>
                            <button onClick={() => handleBanear(u.id, true)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-950 border border-red-800 text-red-400
                                         active:scale-95 transition-transform">
                              Banear permanente
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
