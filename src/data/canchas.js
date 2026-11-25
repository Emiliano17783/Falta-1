// ============================================================
// DATOS DE CANCHAS — EDITAR ACÁ
// ============================================================

//
// CANCHAS DE FÚTBOL
//
export const CANCHAS_FUTBOL = [];

// 
// CANCHAS DE PÁDEL
// 
export const CANCHAS_PADEL = [];

// 
// NO EDITAR A PARTIR DE ACÁ
// 

// Todas las canchas juntas (para compatibilidad con código existente)
export const CANCHAS = [...CANCHAS_FUTBOL, ...CANCHAS_PADEL];

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
