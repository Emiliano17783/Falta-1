// Servidor local para MercadoPago — corre en puerto 3001
// En producción (Netlify) esto lo maneja la Cloud Function automáticamente

const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

app.post('/crear-preferencia', async (req, res) => {
  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: 'MP_ACCESS_TOKEN no configurado en .env' });
  }

  const { descripcion, monto, tipo, id, email } = req.body;

  try {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const preferenceClient = new Preference(client);

    const preference = await preferenceClient.create({
      body: {
        items: [{
          id: id || 'falta1',
          title: descripcion || 'Falta 1 — Fútbol Montevideo',
          quantity: 1,
          currency_id: 'UYU',
          unit_price: Number(monto),
        }],
        payer: { email: email || 'jugador@falta1.uy' },
        back_urls: {
          success: 'http://localhost:5173?pago=exitoso',
          failure: 'http://localhost:5173?pago=fallido',
          pending: 'http://localhost:5173?pago=pendiente',
        },
        auto_return: 'approved',
        statement_descriptor: 'FALTA1 FUTBOL',
        external_reference: `${tipo}_${id}`,
      },
    });

    res.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id: preference.id,
    });
  } catch (err) {
    console.error('Error MercadoPago:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('✅ Servidor MercadoPago corriendo en http://localhost:3001');
});
