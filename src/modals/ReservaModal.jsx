import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const HORARIOS = ['18:00','19:00','20:00','21:00','22:00','23:00'];
const METODOS = [
  { id: 'mercadopago', label: 'MercadoPago', icono: '💳', subtitulo: 'Tarjeta, saldo MP, cuotas sin interés' },
  { id: 'tarjeta',     label: 'Tarjeta de crédito / débito', icono: '💳', subtitulo: 'VISA · Mastercard · OCA · BROU' },
];

async function crearPreferenciaMercadoPago({ descripcion, monto, tipo, id, email }) {
  const url = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/crear-preferencia'
    : '/.netlify/functions/crear-preferencia';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descripcion, monto, tipo, id, email }),
  });
  if (!resp.ok) throw new Error('Error al crear preferencia');
  return resp.json();
}

export default function ReservaModal({ cancha, onClose }) {
  const { user } = useAuth();
  const [horario, setHorario] = useState(null);
  const [metodo, setMetodo] = useState(null);
  const [horas, setHoras] = useState(1);
  const [paso, setPaso] = useState('elegir');
  const [errorMsg, setErrorMsg] = useState('');

  if (!cancha) return null;

  const total = cancha.precioPorHora * horas;

  const handleConfirmar = async () => {
    if (!horario || !metodo) return;
    setPaso('procesando');

    try {
      const data = await crearPreferenciaMercadoPago({
        descripcion: `Reserva ${cancha.nombre} — ${horario}hs (${horas}h)`,
        monto: total,
        tipo: 'reserva',
        id: cancha.id,
        email: user?.email || 'jugador@falta1.uy',
      });
      window.location.href = data.init_point;
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo conectar con MercadoPago. Intentá de nuevo.');
      setPaso('error');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content font-barlow">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-f-border" />
        </div>

        {paso === 'elegir' && (
          <div className="px-5 pb-8">
            <h2 className="text-white text-3xl font-black uppercase mt-3 mb-1">Reservar cancha</h2>

            {/* Info cancha */}
            <div className="bg-f-bg rounded-xl p-4 mb-5 border border-f-border">
              <p className="text-f-accent text-xl font-black uppercase">{cancha.nombre}</p>
              <p className="text-f-text">{cancha.barrio} · {cancha.tipo}</p>
              <p className="text-white text-3xl font-black mt-1">
                ${cancha.precioPorHora.toLocaleString('es-UY')}
                <span className="text-f-muted text-base font-medium">/hora</span>
              </p>
            </div>

            {/* Duración */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-f-muted text-sm font-bold uppercase tracking-wider">Duración</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setHoras(Math.max(1, horas - 1))}
                  className="w-9 h-9 rounded-full bg-f-card border border-f-border text-white font-black flex items-center justify-center text-lg">
                  −
                </button>
                <span className="text-white text-2xl font-black w-12 text-center">{horas}h</span>
                <button onClick={() => setHoras(Math.min(4, horas + 1))}
                  className="w-9 h-9 rounded-full bg-f-card border border-f-border text-white font-black flex items-center justify-center text-lg">
                  +
                </button>
              </div>
            </div>

            {/* Horarios */}
            <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-3">Horario de inicio</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {HORARIOS.map(h => (
                <button key={h} onClick={() => setHorario(h)}
                  className={`py-3 rounded-xl font-bold text-lg border transition-all
                              ${horario === h ? 'bg-f-green border-f-green text-white' : 'bg-f-bg border-f-border text-f-text'}`}>
                  {h}
                </button>
              ))}
            </div>

            {/* Total */}
            {horario && (
              <div className="bg-green-950 border border-f-green rounded-xl p-4 mb-5 flex justify-between items-center animate-fade-in">
                <div>
                  <p className="text-f-muted text-sm">Total</p>
                  <p className="text-f-text text-sm">{horas}h × ${cancha.precioPorHora.toLocaleString('es-UY')}</p>
                </div>
                <p className="text-f-accent text-4xl font-black">${total.toLocaleString('es-UY')}</p>
              </div>
            )}

            {/* Método pago */}
            <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-3">Método de pago</p>
            <div className="space-y-2 mb-6">
              {METODOS.map(m => (
                <button key={m.id} onClick={() => setMetodo(m.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all
                              ${metodo === m.id ? 'border-f-accent bg-green-950' : 'border-f-border bg-f-bg'}`}>
                  <span className="text-2xl">{m.icono}</span>
                  <div className="text-left flex-1">
                    <p className={`font-bold text-lg ${metodo === m.id ? 'text-f-accent' : 'text-f-text'}`}>{m.label}</p>
                    <p className="text-f-muted text-sm">{m.subtitulo}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                  ${metodo === m.id ? 'border-f-accent' : 'border-f-muted'}`}>
                    {metodo === m.id && <div className="w-2.5 h-2.5 rounded-full bg-f-accent" />}
                  </div>
                </button>
              ))}
            </div>

            <button onClick={handleConfirmar} disabled={!horario || !metodo}
              className="w-full bg-f-green text-white font-black text-xl uppercase py-4 rounded-2xl
                         transition-all active:scale-95 disabled:opacity-40"
              style={horario && metodo ? { boxShadow: '0 4px 20px rgba(22,163,74,0.5)' } : {}}>
              {horario ? `PAGAR $${total.toLocaleString('es-UY')} →` : 'ELEGÍ UN HORARIO'}
            </button>
            <button onClick={onClose} className="w-full text-f-muted text-base py-3 mt-1">Cancelar</button>
          </div>
        )}

        {paso === 'procesando' && (
          <div className="px-5 pb-8 flex flex-col items-center py-14">
            <div className="w-16 h-16 border-4 border-f-border border-t-f-green rounded-full animate-spin-custom mb-6" />
            <p className="text-white text-2xl font-black uppercase">Conectando con MercadoPago...</p>
            <p className="text-f-muted text-base mt-2">Te redirigimos para pagar de forma segura</p>
          </div>
        )}

        {paso === 'error' && (
          <div className="px-5 pb-8 flex flex-col items-center py-8">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-white text-2xl font-black uppercase">Error de pago</p>
            <p className="text-f-muted text-base mt-2 text-center">{errorMsg}</p>
            <button onClick={() => setPaso('elegir')}
              className="w-full bg-f-green text-white font-black text-xl uppercase py-4 rounded-2xl mt-6">
              INTENTAR DE NUEVO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
