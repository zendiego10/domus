export function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

export function isAdult(age) {
  return age >= 18;
}

export function isStrongPassword(password) {
  return password.length >= 8;
}

export function isValidPhone(phone) {
  return /^[0-9]{7,15}$/.test(phone);
}

export function isValidPin(pin) {
  return /^\d{4}$/.test(pin);
}