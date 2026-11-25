/**
 * Falta 1 — Firebase Cloud Functions
 * Envío automático de mensajes de WhatsApp via Twilio.
 */

const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { onDocumentUpdated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const twilio = require('twilio');

admin.initializeApp();
const db = admin.firestore();

const twilioSid = defineSecret('TWILIO_ACCOUNT_SID');
const twilioToken = defineSecret('TWILIO_AUTH_TOKEN');
const twilioFrom = defineSecret('TWILIO_WHATSAPP_FROM');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatearFechaHora(isoStr) {
  const fecha = new Date(isoStr);
  const fechaStr = fecha.toLocaleDateString('es-UY', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Montevideo',
  });
  const hora = fecha.toLocaleTimeString('es-UY', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Montevideo',
  });
  return { fechaStr, hora };
}

async function getTelefonoE164(uid) {
  try {
    const snap = await db.collection('usuarios').doc(uid).get();
    if (!snap.exists) return null;
    const u = snap.data();
    if (!u.telefono || !u.telefonoVerificado) return null;
    const tel = u.telefono.replace(/\s/g, '');
    if (!tel.startsWith('09') || tel.length !== 9) return null;
    return `+598${tel.slice(1)}`;
  } catch (e) {
    logger.warn('Error obteniendo teléfono:', uid, e.message);
    return null;
  }
}

async function enviarWhatsApp(sid, token, from, to, body) {
  const client = twilio(sid, token);
  await client.messages.create({
    from: `whatsapp:${from}`,
    to: `whatsapp:${to}`,
    body,
  });
}

// ─── FUNCIÓN 1 — Confirmación de partido ─────────────────────────────────────

exports.notificarConfirmacion = onDocumentUpdated(
  {
    document: 'partidos/{partidoId}',
    region: 'me-central1',
    secrets: [twilioSid, twilioToken, twilioFrom],
  },
  async (event) => {
    const antes = event.data.before.data();
    const despues = event.data.after.data();

    if (antes.estado === 'confirmado' || despues.estado !== 'confirmado') return;

    const organizadorUid = despues.creadoPor;
    if (!organizadorUid) return;

    const telefono = await getTelefonoE164(organizadorUid);
    if (!telefono) {
      logger.info('Organizador sin teléfono verificado:', organizadorUid);
      return;
    }

    const { fechaStr, hora } = formatearFechaHora(despues.fechaHora);
    const cancha = despues.nombreCancha || 'la cancha';
    const mensaje =
      `Tu partido en ${cancha} del ${fechaStr} a las ${hora} fue confirmado. ` +
      `Ya podés empezar a sumar jugadores en falta-1.com`;

    try {
      await enviarWhatsApp(
        twilioSid.value(), twilioToken.value(), twilioFrom.value(),
        telefono, mensaje
      );
      logger.info('WhatsApp confirmación enviado a:', telefono);
    } catch (e) {
      logger.error('Error enviando WhatsApp confirmación:', e.message);
    }
  }
);

// ─── FUNCIÓN 2 — Recordatorio 45 minutos antes ───────────────────────────────

exports.recordatorio45min = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'America/Montevideo',
    region: 'us-central1',
    timeoutSeconds: 120,
    secrets: [twilioSid, twilioToken, twilioFrom],
  },
  async () => {
    const ahora = Date.now();
    const ventanaMin = ahora + 40 * 60 * 1000;
    const ventanaMax = ahora + 50 * 60 * 1000;

    const snap = await db.collection('partidos')
      .where('estado', '==', 'confirmado')
      .get();

    for (const doc of snap.docs) {
      const p = doc.data();
      if (p.recordatorio45Enviado === true) continue;

      const fechaMs = new Date(p.fechaHora).getTime();
      if (isNaN(fechaMs) || fechaMs < ventanaMin || fechaMs > ventanaMax) continue;

      const jugadores = p.jugadores || [];
      if (jugadores.length === 0) continue;

      const cancha = p.nombreCancha || 'la cancha';
      const mensaje = `En 45 minutos jugás en ${cancha}. Si no podés ir avisá ya para no perder tu lugar.`;

      let enviados = 0;
      for (const uid of jugadores) {
        const telefono = await getTelefonoE164(uid);
        if (!telefono) continue;
        try {
          await enviarWhatsApp(
            twilioSid.value(), twilioToken.value(), twilioFrom.value(),
            telefono, mensaje
          );
          enviados++;
        } catch (e) {
          logger.error('Error enviando recordatorio a:', telefono, e.message);
        }
      }

      await doc.ref.update({ recordatorio45Enviado: true });
      logger.info(`Recordatorio enviado para ${doc.id}: ${enviados}/${jugadores.length}`);
    }
  }
);

// ─── FUNCIÓN 3 — Cancelación de partido ──────────────────────────────────────

exports.notificarCancelacion = onDocumentUpdated(
  {
    document: 'partidos/{partidoId}',
    region: 'me-central1',
    secrets: [twilioSid, twilioToken, twilioFrom],
  },
  async (event) => {
    const antes = event.data.before.data();
    const despues = event.data.after.data();

    if (antes.estado === 'cancelado' || despues.estado !== 'cancelado') return;

    const jugadores = despues.jugadores || [];
    if (jugadores.length === 0) return;

    const { fechaStr } = formatearFechaHora(despues.fechaHora);
    const cancha = despues.nombreCancha || 'la cancha';
    const mensaje =
      `El partido en ${cancha} del ${fechaStr} fue cancelado por no llegar al mínimo de jugadores.`;

    let enviados = 0;
    for (const uid of jugadores) {
      const telefono = await getTelefonoE164(uid);
      if (!telefono) continue;
      try {
        await enviarWhatsApp(
          twilioSid.value(), twilioToken.value(), twilioFrom.value(),
          telefono, mensaje
        );
        enviados++;
      } catch (e) {
        logger.error('Error enviando cancelación a:', telefono, e.message);
      }
    }

    logger.info(`Cancelación enviada para ${event.params.partidoId}: ${enviados}/${jugadores.length}`);
  }
);

// ─── FUNCIÓN 4 — Encuesta post partido ───────────────────────────────────────

exports.encuestaPostPartido = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'America/Montevideo',
    region: 'us-central1',
    timeoutSeconds: 120,
    secrets: [twilioSid, twilioToken, twilioFrom],
  },
  async () => {
    const ahora = Date.now();
    const ventanaMin = ahora - 40 * 60 * 1000;
    const ventanaMax = ahora - 20 * 60 * 1000;

    const snap = await db.collection('partidos')
      .where('estado', 'in', ['confirmado', 'finalizado'])
      .get();

    for (const doc of snap.docs) {
      const p = doc.data();
      if (p.encuestaEnviada === true) continue;
      if (!p.creadoPor) continue;

      const fechaMs = new Date(p.fechaHora).getTime();
      if (isNaN(fechaMs) || fechaMs < ventanaMin || fechaMs > ventanaMax) continue;

      const cancha = p.nombreCancha || 'la cancha';
      const mensaje =
        `¿Cómo estuvo el partido en ${cancha}? Contanos tu experiencia desde la app en falta-1.com`;

      const telefono = await getTelefonoE164(p.creadoPor);
      if (telefono) {
        try {
          await enviarWhatsApp(
            twilioSid.value(), twilioToken.value(), twilioFrom.value(),
            telefono, mensaje
          );
          logger.info(`Encuesta enviada para ${doc.id}`);
        } catch (e) {
          logger.error('Error enviando encuesta:', e.message);
        }
      }

      await doc.ref.update({ encuestaEnviada: true });
    }
  }
);

// ─── FUNCIÓN 5 — Enviar código de verificación por WhatsApp ──────────────────

exports.enviarCodigoVerificacion = onCall(
  {
    region: 'us-central1',
    secrets: [twilioSid, twilioToken, twilioFrom],
  },
  async (request) => {
    const { telefono } = request.data;

    if (!telefono || !/^09\d{7}$/.test(telefono)) {
      throw new HttpsError('invalid-argument', 'Número inválido. Debe ser 09X XXX XXX.');
    }

    const telefonoE164 = `+598${telefono.slice(1)}`;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEn = Date.now() + 10 * 60 * 1000; // 10 minutos

    await db.collection('codigosVerificacion').doc(telefono).set({
      codigo,
      expiraEn,
      intentos: 0,
    });

    const mensaje =
      `Tu código de verificación para Falta 1 es: *${codigo}*. Válido por 10 minutos. No lo compartas.`;

    try {
      await enviarWhatsApp(
        twilioSid.value(), twilioToken.value(), twilioFrom.value(),
        telefonoE164, mensaje
      );
    } catch (e) {
      logger.error('Error enviando código verificación:', e.message);
      throw new HttpsError('internal', 'No se pudo enviar el mensaje. Verificá que el número esté en WhatsApp.');
    }

    logger.info('Código de verificación enviado a:', telefonoE164);
    return { ok: true };
  }
);

// ─── FUNCIÓN 6 — Verificar código ingresado por el usuario ───────────────────

exports.verificarCodigoVerificacion = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { telefono, codigo } = request.data;

    if (!telefono || !codigo) {
      throw new HttpsError('invalid-argument', 'Datos incompletos.');
    }

    const ref = db.collection('codigosVerificacion').doc(telefono);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new HttpsError('not-found', 'No hay código activo para ese número. Pedí uno nuevo.');
    }

    const data = snap.data();

    if (Date.now() > data.expiraEn) {
      await ref.delete();
      throw new HttpsError('deadline-exceeded', 'El código venció. Pedí uno nuevo.');
    }

    if ((data.intentos || 0) >= 5) {
      await ref.delete();
      throw new HttpsError('resource-exhausted', 'Demasiados intentos. Pedí un código nuevo.');
    }

    if (data.codigo !== codigo) {
      await ref.update({ intentos: (data.intentos || 0) + 1 });
      throw new HttpsError('unauthenticated', 'Código incorrecto.');
    }

    await ref.delete();
    logger.info('Código verificado correctamente para:', telefono);
    return { valido: true };
  }
);

// ─── FUNCIÓN — Sincronizar usuarios_publicos ──────────────────────────────────

exports.sincronizarUsuarioPublico = onDocumentWritten(
  { document: 'usuarios/{uid}', region: 'us-central1' },
  async (event) => {
    const uid = event.params.uid;
    const ref = db.collection('usuarios_publicos').doc(uid);

    if (!event.data.after.exists) {
      await ref.delete();
      return;
    }

    const data = event.data.after.data();
    await ref.set({
      uid,
      nombre: data.nombre || 'Jugador',
      foto: data.foto || null,
      nivelFutbol: data.nivelFutbol || 'Intermedio',
      reputacion: data.reputacion ?? 5,
    });
  }
);
