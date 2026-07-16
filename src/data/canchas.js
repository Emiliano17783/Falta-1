// ============================================================
// DATOS DE CANCHAS — EDITAR ACÁ
// ============================================================
// Este es el único archivo que necesitás tocar para actualizar
// los datos de las canchas. Cada cancha tiene estos campos:
//
//   id          → identificador único (no cambiar)
//   nombre      → nombre del complejo tal como aparece en la app
//   direccion   → dirección exacta
//   barrio      → barrio de Montevideo
//   telefono    → teléfono fijo o celular (para llamadas)
//   whatsapp    → número para WhatsApp con código de país 598
//                 (ej: '59899123456') o null si no tiene
//   tipo        → 'Techada' o 'Abierta'
//   modalidades → ['F5'] o ['F5', 'F7'] (solo fútbol)
//   precioPorHora → precio de referencia en pesos uruguayos
//   rating      → puntuación del 1 al 5
//   servicios   → array con los servicios disponibles
//   logo        → URL del logo o null
//
// ⚠️  Los campos id, deporte y modalidades NO se deben cambiar
//     porque el resto del código depende de ellos.
// ============================================================

const CDN = 'https://canchea.com/uy/wp-content/uploads/sites/2';

// ─────────────────────────────────────────────────────────────
// CANCHAS DE FÚTBOL
// ─────────────────────────────────────────────────────────────
export const CANCHAS_FUTBOL = [
  {
    id: 'c1',                          // ← NO cambiar
    deporte: 'futbol',                 // ← NO cambiar
    nombre: '2 a 1 Fútbol 5',         // ← Nombre del complejo
    direccion: 'Comercio 2159',        // ← Dirección
    barrio: 'La Unión',               // ← Barrio
    telefono: '2508 2115',            // ← Teléfono (o null)
    whatsapp: null,                   // ← WhatsApp con 598 (o null)
    tipo: 'Techada',                  // ← 'Techada' o 'Abierta'
    modalidades: ['F5'],              // ← ['F5'] o ['F5','F7']
    precioPorHora: 2200,              // ← Precio en pesos uruguayos
    rating: 4,                        // ← Rating del 1 al 5
    servicios: ['Vestuarios', 'Cantina', 'TV Cable', 'WiFi', 'Estacionamiento'],
    logo: `${CDN}/2016/09/2a1-col-1.png`,
  },
  {
    id: 'c2',
    deporte: 'futbol',
    nombre: '2 Cabezas',
    direccion: 'Dr. Salvador Ferrer Serra 2281',
    barrio: 'Tres Cruces',
    telefono: '099 598 161',
    whatsapp: '59899598161',
    tipo: 'Techada',
    modalidades: ['F5', 'F7'],
    precioPorHora: 2200,
    rating: 4,
    servicios: ['Vestuarios', 'Cantina', 'Estacionamiento', 'TV Cable', 'Barbacoa', 'Festejo Cumpleaños'],
    logo: `${CDN}/2017/05/2cabezas-col.png`,
  },
  {
    id: 'c3',
    deporte: 'futbol',
    nombre: 'Aerosur Fútbol 5',
    direccion: 'Calle Bach esq. Aerosur',
    barrio: 'Carrasco',
    telefono: '092 666 696',
    whatsapp: '59892666696',
    tipo: 'Techada',
    modalidades: ['F5', 'F7'],
    precioPorHora: 3000,
    rating: 5,
    servicios: ['Vestuarios', 'Cantina', 'Estacionamiento', 'WiFi'],
    logo: `${CDN}/2015/07/aerosurcol.png`,
  },
  {
    id: 'c4',
    deporte: 'futbol',
    nombre: 'Aguada Fútbol 5',
    direccion: 'Av. San Martín 2261',
    barrio: 'Aguada',
    telefono: '2201 0927',
    whatsapp: null,
    tipo: 'Abierta',
    modalidades: ['F5'],
    precioPorHora: 1600,
    rating: 3,
    servicios: ['Vestuarios'],
    logo: `${CDN}/2013/05/aguada.png`,
  },
  {
    id: 'c5',
    deporte: 'futbol',
    nombre: 'Albatros Fútbol 5',
    direccion: 'Av. L.A. de Herrera 4235',
    barrio: 'Prado',
    telefono: '2336 1967',
    whatsapp: null,
    tipo: 'Techada',
    modalidades: ['F5'],
    precioPorHora: 1900,
    rating: 4,
    servicios: ['Vestuarios', 'Cantina'],
    logo: `${CDN}/2013/12/albatroscol1.png`,
  },
  {
    id: 'c6',
    deporte: 'futbol',
    nombre: 'Boston River Fútbol 5',
    direccion: 'Saladero Fariño 3388',
    barrio: 'Sayago',
    telefono: '215 4679',
    whatsapp: null,
    tipo: 'Techada',
    modalidades: ['F5', 'F7'],
    precioPorHora: 2800,
    rating: 5,
    servicios: ['Vestuarios', 'Cantina', 'Estacionamiento', 'TV Cable'],
    logo: `${CDN}/2014/09/boston_river_col.png`,
  },
  {
    id: 'c7',
    deporte: 'futbol',
    nombre: 'Buceo 5',
    direccion: 'Av. Ing. Santiago Rivas 1548',
    barrio: 'Buceo',
    telefono: '2622 7222',
    whatsapp: null,
    tipo: 'Abierta',
    modalidades: ['F5'],
    precioPorHora: 1800,
    rating: 4,
    servicios: ['Vestuarios'],
    logo: null,
  },
  {
    id: 'c8',
    deporte: 'futbol',
    nombre: 'Centro Gallego',
    direccion: 'Avda. Italia 7504',
    barrio: 'Parque Batlle',
    telefono: '2601 0361',
    whatsapp: null,
    tipo: 'Techada',
    modalidades: ['F5', 'F7'],
    precioPorHora: 2500,
    rating: 4,
    servicios: ['Vestuarios', 'Cantina', 'Estacionamiento'],
    logo: null,
  },
  {
    id: 'c9',
    deporte: 'futbol',
    nombre: 'Campus Prado',
    direccion: 'Chuy 3474',
    barrio: 'Prado',
    telefono: '2203 6574',
    whatsapp: null,
    tipo: 'Techada',
    modalidades: ['F5', 'F7'],
    precioPorHora: 2000,
    rating: 4,
    servicios: ['Vestuarios', 'Cantina'],
    logo: null,
  },
  {
    id: 'c10',
    deporte: 'futbol',
    nombre: 'Dryco',
    direccion: 'Av. Gral. San Martín 2938',
    barrio: 'Villa Española',
    telefono: '2203 2483',
    whatsapp: null,
    tipo: 'Techada',
    modalidades: ['F5'],
    precioPorHora: 1900,
    rating: 3,
    servicios: ['Vestuarios'],
    logo: `${CDN}/2016/10/Dryco-col.png`,
  },
  {
    id: 'c11',
    deporte: 'futbol',
    nombre: 'Rentistas 3er Tiempo',
    direccion: 'Av. Gral. Flores 4020',
    barrio: 'Brazo Oriental',
    telefono: '2215 3795',
    whatsapp: null,
    tipo: 'Abierta',
    modalidades: ['F5', 'F7'],
    precioPorHora: 1700,
    rating: 3,
    servicios: ['Vestuarios'],
    logo: null,
  },
  {
    id: 'c12',
    deporte: 'futbol',
    nombre: 'Club Industria',
    direccion: 'Ing. José Serrato 3528',
    barrio: 'Sayago',
    telefono: '2216 2303',
    whatsapp: null,
    tipo: 'Abierta',
    modalidades: ['F5'],
    precioPorHora: 1600,
    rating: 3,
    servicios: ['Vestuarios'],
    logo: null,
  },
  {
    id: 'c13',
    deporte: 'futbol',
    nombre: 'Enfoque Deportivo',
    direccion: 'Abreu 2290 y Cardal',
    barrio: 'La Blanqueada',
    telefono: null,
    whatsapp: null,
    tipo: 'Techada',
    modalidades: ['F5', 'F7'],
    precioPorHora: 2400,
    rating: 4,
    servicios: ['Vestuarios', 'Cantina'],
    logo: null,
  },
  {
    id: 'c14',
    deporte: 'futbol',
    nombre: 'Av. de las Américas',
    direccion: 'Av. Américas 6000 Km 16',
    barrio: 'Carrasco',
    telefono: '2601 5171',
    whatsapp: null,
    tipo: 'Techada',
    modalidades: ['F5', 'F7'],
    precioPorHora: 3200,
    rating: 5,
    servicios: ['Vestuarios', 'Cantina', 'Estacionamiento', 'WiFi', 'TV Cable'],
    logo: null,
  },
];

// ─────────────────────────────────────────────────────────────
// CANCHAS DE PÁDEL
// ⚠️  Datos provisorios — actualizar cuando visites los complejos
// ─────────────────────────────────────────────────────────────
export const CANCHAS_PADEL = [
  {
    id: 'p1',                              // ← NO cambiar
    deporte: 'padel',                      // ← NO cambiar
    nombre: 'Pádel Montevideo Centro',     // ← Actualizar con nombre real
    direccion: 'Av. 18 de Julio 1200',    // ← Actualizar con dirección real
    barrio: 'Centro',
    telefono: '099 000 001',              // ← Actualizar con teléfono real
    whatsapp: '59899000001',              // ← Actualizar con WhatsApp real
    tipo: 'Techada',
    modalidades: ['Pádel'],               // ← NO cambiar
    precioPorHora: 1800,                  // ← Actualizar con precio real
    rating: 4,
    servicios: ['Vestuarios', 'Cantina', 'WiFi'],
    logo: null,
  },
  {
    id: 'p2',
    deporte: 'padel',
    nombre: 'Pádel Pocitos',             // ← Actualizar con nombre real
    direccion: 'Bvar. España 2500',      // ← Actualizar con dirección real
    barrio: 'Pocitos',
    telefono: '099 000 002',             // ← Actualizar con teléfono real
    whatsapp: '59899000002',             // ← Actualizar con WhatsApp real
    tipo: 'Techada',
    modalidades: ['Pádel'],
    precioPorHora: 2000,                 // ← Actualizar con precio real
    rating: 4,
    servicios: ['Vestuarios', 'Cantina', 'Estacionamiento'],
    logo: null,
  },
  {
    id: 'p3',
    deporte: 'padel',
    nombre: 'Pádel Carrasco',           // ← Actualizar con nombre real
    direccion: 'Av. Américas 5500',     // ← Actualizar con dirección real
    barrio: 'Carrasco',
    telefono: '099 000 003',            // ← Actualizar con teléfono real
    whatsapp: '59899000003',            // ← Actualizar con WhatsApp real
    tipo: 'Techada',
    modalidades: ['Pádel'],
    precioPorHora: 2500,                // ← Actualizar con precio real
    rating: 5,
    servicios: ['Vestuarios', 'Cantina', 'Estacionamiento', 'WiFi'],
    logo: null,
  },
];

// ─────────────────────────────────────────────────────────────
// NO EDITAR A PARTIR DE ACÁ
// ─────────────────────────────────────────────────────────────

// Todas las canchas juntas (para compatibilidad con código existente)
export const CANCHAS = [...CANCHAS_FUTBOL, ...CANCHAS_PADEL];

export const BARRIOS_MONTEVIDEO = [
  'Aguada', 'Brazo Oriental', 'Buceo', 'Carrasco', 'Centro',
  'La Blanqueada', 'La Unión', 'Parque Batlle', 'Pocitos',
  'Prado', 'Sayago', 'Tres Cruces', 'Villa Española',
];
