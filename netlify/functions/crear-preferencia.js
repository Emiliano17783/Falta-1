const { MercadoPagoConfig, Preference } = require('mercadopago');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'MP_ACCESS_TOKEN no configurado' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  const { tipo, descripcion, monto, id, email } = body;
  const BASE_URL = process.env.URL || 'http://localhost:8888';

  try {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const preferenceClient = new Preference(client);

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: id || 'falta1',
            title: descripcion || 'Falta 1 — Fútbol amateur Montevideo',
            quantity: 1,
            currency_id: 'UYU',
            unit_price: Number(monto),
          },
        ],
        payer: { email: email || 'jugador@falta1.uy' },
        back_urls: {
          success: `${BASE_URL}?pago=exitoso`,
          failure: `${BASE_URL}?pago=fallido`,
          pending: `${BASE_URL}?pago=pendiente`,
        },
        auto_return: 'approved',
        statement_descriptor: 'FALTA1 FUTBOL',
        external_reference: `${tipo}_${id}`,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        preference_id: preference.id,
      }),
    };
  } catch (err) {
    console.error('Error MP:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
