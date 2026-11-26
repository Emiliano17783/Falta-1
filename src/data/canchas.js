// Canchas de pádel (lista curada)
export const CANCHAS_PADEL = [
 { id: 'padel-pocitos-1',    nombre: 'Pádel Pocitos',         barrio: 'Pocitos',         ciudad: 'Montevideo', precioPorHora: 1800 },
 { id: 'padel-carrasco-1',   nombre: 'Pádel Carrasco',         barrio: 'Carrasco',        ciudad: 'Montevideo', precioPorHora: 2200 },
 { id: 'padel-buceo-1',      nombre: 'Club Buceo Pádel',       barrio: 'Buceo',           ciudad: 'Montevideo', precioPorHora: 1700 },
 { id: 'padel-centro-1',     nombre: 'Pádel Centro',           barrio: 'Centro',          ciudad: 'Montevideo', precioPorHora: 1500 },
 { id: 'padel-punta-1',      nombre: 'Punta Carretas Pádel',   barrio: 'Punta Carretas',  ciudad: 'Montevideo', precioPorHora: 2000 },
 { id: 'padel-union-1',      nombre: 'La Unión Pádel',         barrio: 'La Unión',        ciudad: 'Montevideo', precioPorHora: 1600 },
 { id: 'padel-flores-1',     nombre: 'Pádel Trinidad',         barrio: 'Centro',          ciudad: 'Flores',     precioPorHora: 1200 },
];

// Datos geográficos — ciudades y barrios

export const BARRIOS_MONTEVIDEO = [
 'Aguada', 'Brazo Oriental', 'Buceo', 'Carrasco', 'Centro',
 'La Blanqueada', 'La Unión', 'Parque Batlle', 'Pocitos',
 'Prado', 'Sayago', 'Tres Cruces', 'Villa Española',
];

export const BARRIOS_TRINIDAD = [
 'Centro', 'Barrio Norte', 'Barrio Sur', 'Barrio Este',
 'Villa Teresa', 'Barrio Jardín', 'Villa Nueva',
];

export const CIUDADES = [
 { id: 'Montevideo', label: 'Montevideo' },
 { id: 'Flores', label: 'Flores — Trinidad' },
];

export const BARRIOS_POR_CIUDAD = {
 'Montevideo': BARRIOS_MONTEVIDEO,
 'Flores': BARRIOS_TRINIDAD,
};
