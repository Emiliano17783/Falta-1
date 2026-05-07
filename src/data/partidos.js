// Partidos de ejemplo para mostrar en el feed (se usan cuando Firestore está vacío)
// En producción, los partidos vienen de Firestore en tiempo real

const HOY = new Date();
const maniana = new Date(HOY);
maniana.setDate(HOY.getDate() + 1);

function fechaStr(date, hora) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${hora}:00`;
}

export const PARTIDOS_DEMO = [
  {
    id: 'p1',
    nombreCancha: 'Boston River Fútbol 5',
    canchaId: 'c6',
    barrio: 'Sayago',
    modalidad: 'F5',
    nivel: 'Intermedio',
    fechaHora: fechaStr(HOY, '20:00'),
    cupoTotal: 10,
    jugadoresAnotados: 8,
    precioPorJugador: 380,
    organizador: 'Martín G.',
    activo: true,
  },
  {
    id: 'p2',
    nombreCancha: 'Aerosur Fútbol 5',
    canchaId: 'c3',
    barrio: 'San José de Carrasco',
    modalidad: 'F7',
    nivel: 'Avanzado',
    fechaHora: fechaStr(HOY, '21:00'),
    cupoTotal: 14,
    jugadoresAnotados: 7,
    precioPorJugador: 430,
    organizador: 'Diego R.',
    activo: true,
  },
  {
    id: 'p3',
    nombreCancha: '2 Cabezas',
    canchaId: 'c2',
    barrio: 'Tres Cruces',
    modalidad: 'F5',
    nivel: 'Principiante',
    fechaHora: fechaStr(HOY, '19:00'),
    cupoTotal: 10,
    jugadoresAnotados: 4,
    precioPorJugador: 320,
    organizador: 'Lucas F.',
    activo: true,
  },
  {
    id: 'p4',
    nombreCancha: 'Centro Gallego',
    canchaId: 'c8',
    barrio: 'Parque Batlle',
    modalidad: 'F7',
    nivel: 'Intermedio',
    fechaHora: fechaStr(maniana, '20:00'),
    cupoTotal: 14,
    jugadoresAnotados: 11,
    precioPorJugador: 360,
    organizador: 'Pablo M.',
    activo: true,
  },
  {
    id: 'p5',
    nombreCancha: 'Enfoque Deportivo',
    canchaId: 'c13',
    barrio: 'La Blanqueada',
    modalidad: 'F5',
    nivel: 'Avanzado',
    fechaHora: fechaStr(maniana, '22:00'),
    cupoTotal: 10,
    jugadoresAnotados: 9,
    precioPorJugador: 480,
    organizador: 'Sebas V.',
    activo: true,
  },
];

export const NIVEL_CONFIG = {
  Principiante: { clase: 'nivel-principiante', color: '#4ade80', bg: '#14532d' },
  Intermedio: { clase: 'nivel-intermedio', color: '#fbbf24', bg: '#713f12' },
  Avanzado: { clase: 'nivel-avanzado', color: '#f87171', bg: '#7f1d1d' },
};
