export function isValidEmail(email) {
  // Verifica formato basico de correo: texto@texto.dominio
  return /\S+@\S+\.\S+/.test(email);
}

export function isAdult(age) {
  // Regla de negocio: adulto desde los 18 anios.
  return age >= 18;
}

export function isStrongPassword(password) {
  // Regla minima de seguridad para contrasenas.
  return password.length >= 8;
}

export function isValidPhone(phone) {
  // Acepta solo numeros (sin espacios ni simbolos), entre 7 y 15 digitos.
  return /^[0-9]{7,15}$/.test(phone);
}

export function isValidPin(pin) {
  // El PIN de hijo debe ser exactamente de 4 digitos.
  return /^\d{4}$/.test(pin);
}
