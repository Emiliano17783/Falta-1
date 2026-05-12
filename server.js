// Backend de Falta 1 — servidor local para desarrollo
// En producción todo va directo por Firebase (no se necesita este servidor)

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Estado del servidor
app.get('/status', (_req, res) => {
  res.json({
    app: 'Falta 1',
    version: '1.0.0',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor Falta 1 corriendo en http://localhost:${PORT}`);
  console.log(`   Estado: http://localhost:${PORT}/status`);
});
