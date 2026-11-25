// Validación y formato de cédula de identidad uruguaya

export function normalizarCedula(raw) {
  return raw.replace(/\D/g, '').padStart(8, '0');
}

// Valida el dígito verificador usando el algoritmo oficial
export function validarCedula(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 8) return false;

  const padded = digits.padStart(8, '0');
  const coeficientes = [2, 9, 8, 7, 6, 3, 4];
  let suma = 0;
  for (let i = 0; i < 7; i++) {
    suma += parseInt(padded[i], 10) * coeficientes[i];
  }
  const dvCalculado = (10 - (suma % 10)) % 10;
  const dvIngresado = parseInt(padded[7], 10);
  return dvCalculado === dvIngresado;
}

// Formatea la cédula como X.XXX.XXX-D (ej: 1.234.567-8)
export function formatearCedula(raw) {
  if (!raw) return '';
  const padded = raw.replace(/\D/g, '').padStart(8, '0');
  return `${padded[0]}.${padded.slice(1, 4)}.${padded.slice(4, 7)}-${padded[7]}`;
}
