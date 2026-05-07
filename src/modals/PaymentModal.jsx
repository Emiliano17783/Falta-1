import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const METODOS = [
  { id: 'mercadopago', label: 'MercadoPago', icono: '💳', subtitulo: 'Tarjeta, saldo MP, cuotas sin interés' },
  { id: 'tarjeta',     label: 'Tarjeta de crédito / débito', icono: '💳', subtitulo: 'VISA · Mastercard · OCA · BROU' },
  { id: 'efectivo',    label: 'RedPagos / Abitab', icono: '💵', subtitulo: 'Pagá en efectivo en el local' },
];

async function crearPreferenciaMercadoPago({ descripcion, monto, tipo, id, email }) {
  const base = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '/.netlify/functions';
  const url = window.location.hostname === 'localhost'
    ? `${base}/crear-preferencia`
    : `${base}/crear-preferencia`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descripcion, monto, tipo, id, email }),
  });
  if (!resp.ok) throw new Error('Error al crear preferencia de pago');
  return resp.json();
}

export default function PaymentModal({ partido, onClose, onExito }) {
  const { user } = useAuth();
  const [metodo, setMetodo] = useState(null);
  const [paso, setPaso] = useState('elegir'); // elegir | procesando | exito | error
  const [errorMsg, setErrorMsg] = useState('');

  if (!partido) return null;

  const fecha = new Date(partido.fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
  const horaStr = fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
  const lugaresLibres = partido.cupoTotal - partido.jugadoresAnotados;

  const handleConfirmar = async () => {
    if (!metodo) return;
    setPaso('procesando');

    try {
      if (metodo === 'mercadopago' || metodo === 'tarjeta') {
        const data = await crearPreferenciaMercadoPago({
          descripcion: `Partido en ${partido.nombreCancha} — ${fechaStr} ${horaStr}`,
          monto: partido.precioPorJugador,
          tipo: 'partido',
          id: partido.id,
          email: user?.email || 'jugador@falta1.uy',
        });
        // Redirigir a la página de pago de MercadoPago
        window.location.href = data.init_point;
        return;
      }

      // Efectivo (RedPagos/Abitab) — confirmar sin pago online
      setPaso('exito');
      if (onExito) onExito();
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
            <h2 className="text-white text-3xl font-black uppercase mt-3 mb-1">¡Me anoto!</h2>

            {/* Info partido */}
            <div className="bg-f-bg rounded-xl p-4 mb-4 border border-f-border">
              <p className="text-f-accent text-xl font-black uppercase">{partido.nombreCancha}</p>
              <p className="text-f-text text-lg capitalize">{fechaStr}</p>
              <p className="text-white text-3xl font-black">{horaStr}hs</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-f-muted text-base">{partido.modalidad} · {partido.nivel}</span>
                <span className="text-f-accent text-2xl font-black">${partido.precioPorJugador.toLocaleString('es-UY')}</span>
              </div>
              <p className="text-f-muted text-sm mt-1">{lugaresLibres} lugar{lugaresLibres !== 1 ? 'es' : ''} disponible{lugaresLibres !== 1 ? 's' : ''}</p>
            </div>

            {/* Aviso */}
            <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-3 mb-5 flex gap-2">
              <span className="text-yellow-400 text-lg mt-0.5 flex-shrink-0">⚠️</span>
              <p className="text-yellow-300 text-sm leading-snug font-medium">
                Al pagar confirmás tu lugar. Si cancelás con menos de 3 horas o no aparecés, <strong>perdés el depósito y baja tu reputación.</strong>
              </p>
            </div>

            {/* Métodos */}
            <p className="text-f-muted text-sm font-bold uppercase tracking-wider mb-3">Elegí cómo pagar</p>
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

            {metodo === 'efectivo' && (
              <div className="bg-f-card border border-f-border rounded-xl p-3 mb-4 text-f-muted text-sm">
                Vas a recibir un código para pagar en cualquier local de RedPagos o Abitab antes del partido.
              </div>
            )}

            <button onClick={handleConfirmar} disabled={!metodo}
              className="w-full bg-f-green text-white font-black text-xl uppercase py-4 rounded-2xl
                         transition-all active:scale-95 disabled:opacity-40"
              style={metodo ? { boxShadow: '0 4px 20px rgba(22,163,74,0.5)' } : {}}>
              {metodo === 'efectivo' ? 'CONFIRMAR LUGAR' : `PAGAR $${partido.precioPorJugador.toLocaleString('es-UY')} →`}
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

        {paso === 'exito' && (
          <div className="px-5 pb-10 flex flex-col items-center py-8 animate-fade-in">
            <div className="text-7xl mb-4">✅</div>
            <h2 className="text-f-accent text-3xl font-black uppercase text-center">¡LISTO, ESTÁS!</h2>
            <div className="bg-f-bg rounded-xl p-4 w-full mt-6 border border-f-border text-center">
              <p className="text-f-accent text-xl font-bold uppercase">{partido.nombreCancha}</p>
              <p className="text-white text-3xl font-black mt-1">{horaStr}hs</p>
              <p className="text-f-text text-lg capitalize">{fechaStr}</p>
            </div>
            <button onClick={onClose}
              className="w-full bg-f-green text-white font-black text-xl uppercase py-4 rounded-2xl mt-6 active:scale-95">
              ¡DALE!
            </button>
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
