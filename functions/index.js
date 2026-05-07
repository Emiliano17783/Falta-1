/**
 * Falta 1 — Firebase Cloud Functions
 * Maneja la integración con MercadoPago de forma segura (server-side)
 *
 * IMPORTANTE: El Access Token de MercadoPago NUNCA debe estar en el frontend.
 * Solo se usa aquí, en el servidor, de forma segura.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

admin.initializeApp();
const db = admin.firestore();

// Inicializar MercadoPago con el Access Token del servidor
// Configurar con: firebase functions:config:set mercadopago.access_token="APP_USR-xxxx"
// O usar Firebase Secrets (recomendado para producción)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_BASE_URL = process.env.MP_BASE_URL || 'https://falta1.web.app'; // Tu dominio

function getMPClient() {
  if (!MP_ACCESS_TOKEN) {
    throw new HttpsError('failed-precondition', 'MercadoPago no configurado. Agregá MP_ACCESS_TOKEN.');
  }
  return new MercadoPagoConfig({
    accessToken: MP_ACCESS_TOKEN,
    options: { timeout: 5000 },
  });
}

// ─── CREAR PREFERENCIA PARA ANOTARSE A PARTIDO ──────────────────────────────

exports.crearPreferenciaPartido = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Tenés que estar logueado.');
    }

    const { partidoId, monto, descripcion } = data;

    if (!partidoId || !monto) {
      throw new HttpsError('invalid-argument', 'Faltan datos del partido.');
    }

    // Verificar que el partido existe y tiene lugar
    const partidoRef = db.collection('partidos').doc(partidoId);
    const partido = await partidoRef.get();

    if (!partido.exists) {
      throw new HttpsError('not-found', 'El partido no existe.');
    }

    const p = partido.data();
    if (p.jugadoresAnotados >= p.cupoTotal) {
      throw new HttpsError('resource-exhausted', 'El partido ya está lleno.');
    }

    if (p.jugadores?.includes(auth.uid)) {
      throw new HttpsError('already-exists', 'Ya estás anotado en este partido.');
    }

    try {
      const client = getMPClient();
      const preferenceClient = new Preference(client);

      const preference = await preferenceClient.create({
        body: {
          items: [
            {
              id: partidoId,
              title: descripcion || `Partido de fútbol — ${p.nombreCancha}`,
              quantity: 1,
              currency_id: 'UYU',
              unit_price: Number(monto),
            },
          ],
          payer: {
            email: auth.token.email,
          },
          back_urls: {
            success: `${MP_BASE_URL}?pago=exitoso&partido=${partidoId}`,
            failure: `${MP_BASE_URL}?pago=fallido&partido=${partidoId}`,
            pending: `${MP_BASE_URL}?pago=pendiente&partido=${partidoId}`,
          },
          auto_return: 'approved',
          external_reference: `partido_${partidoId}_${auth.uid}`,
          statement_descriptor: 'Falta 1 Futbol',
          metadata: {
            tipo: 'partido',
            partidoId,
            uid: auth.uid,
          },
        },
      });

      logger.info('Preferencia de partido creada:', preference.id);

      return {
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      };
    } catch (err) {
      logger.error('Error creando preferencia MP:', err);
      throw new HttpsError('internal', `Error MercadoPago: ${err.message}`);
    }
  }
);

// ─── CREAR PREFERENCIA PARA RESERVAR CANCHA ──────────────────────────────────

exports.crearPreferenciaReserva = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Tenés que estar logueado.');
    }

    const { reservaId, monto, descripcion } = data;

    if (!reservaId || !monto) {
      throw new HttpsError('invalid-argument', 'Faltan datos de la reserva.');
    }

    // Verificar que la reserva existe
    const reservaRef = db.collection('reservas').doc(reservaId);
    const reserva = await reservaRef.get();

    if (!reserva.exists) {
      throw new HttpsError('not-found', 'La reserva no existe.');
    }

    const r = reserva.data();
    if (r.uid !== auth.uid) {
      throw new HttpsError('permission-denied', 'No podés pagar una reserva ajena.');
    }

    try {
      const client = getMPClient();
      const preferenceClient = new Preference(client);

      const preference = await preferenceClient.create({
        body: {
          items: [
            {
              id: reservaId,
              title: descripcion || `Reserva de cancha — ${r.nombreCancha}`,
              quantity: 1,
              currency_id: 'UYU',
              unit_price: Number(monto),
            },
          ],
          payer: {
            email: auth.token.email,
          },
          back_urls: {
            success: `${MP_BASE_URL}?pago=exitoso&reserva=${reservaId}`,
            failure: `${MP_BASE_URL}?pago=fallido&reserva=${reservaId}`,
            pending: `${MP_BASE_URL}?pago=pendiente&reserva=${reservaId}`,
          },
          auto_return: 'approved',
          external_reference: `reserva_${reservaId}_${auth.uid}`,
          statement_descriptor: 'Falta 1 Cancha',
          metadata: {
            tipo: 'reserva',
            reservaId,
            uid: auth.uid,
          },
        },
      });

      logger.info('Preferencia de reserva creada:', preference.id);

      return {
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      };
    } catch (err) {
      logger.error('Error creando preferencia MP reserva:', err);
      throw new HttpsError('internal', `Error MercadoPago: ${err.message}`);
    }
  }
);

// ─── WEBHOOK DE MERCADOPAGO (notificaciones de pago) ─────────────────────────

const { onRequest } = require('firebase-functions/v2/https');

exports.webhookMercadoPago = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { type, data } = req.body;
    logger.info('Webhook MP recibido:', { type, data });

    if (type === 'payment') {
      try {
        const client = getMPClient();
        const paymentClient = new Payment(client);
        const payment = await paymentClient.get({ id: data.id });

        const { status, external_reference, metadata } = payment;
        logger.info('Pago:', { status, external_reference, metadata });

        if (status === 'approved') {
          const tipo = metadata?.tipo;
          const uid = metadata?.uid;

          if (tipo === 'partido' && metadata?.partidoId) {
            // Anotar jugador al partido
            const ref = db.collection('partidos').doc(metadata.partidoId);
            await ref.update({
              jugadores: admin.firestore.FieldValue.arrayUnion(uid),
              jugadoresAnotados: admin.firestore.FieldValue.increment(1),
            });

            // Registrar pago
            await db.collection('pagos').add({
              tipo: 'partido',
              partidoId: metadata.partidoId,
              uid,
              monto: payment.transaction_amount,
              estado: 'aprobado',
              mpPaymentId: payment.id,
              fecha: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info('Jugador anotado al partido:', metadata.partidoId);
          }

          if (tipo === 'reserva' && metadata?.reservaId) {
            // Confirmar reserva
            await db.collection('reservas').doc(metadata.reservaId).update({
              estado: 'confirmada',
              mpPaymentId: payment.id,
            });

            // Registrar pago
            await db.collection('pagos').add({
              tipo: 'reserva',
              reservaId: metadata.reservaId,
              uid,
              monto: payment.transaction_amount,
              estado: 'aprobado',
              mpPaymentId: payment.id,
              fecha: admin.firestore.FieldValue.serverTimestamp(),
            });

            logger.info('Reserva confirmada:', metadata.reservaId);
          }
        }

        res.status(200).json({ received: true });
      } catch (err) {
        logger.error('Error procesando webhook:', err);
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(200).json({ received: true, ignored: true });
    }
  }
);
