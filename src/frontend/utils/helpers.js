export function calculateAge(birthDate) {
  // Calcula la edad restando anios y ajustando si aun no ha cumplido.
  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // Si el cumpleanios de este anio aun no llega, resta 1.
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

export function generateFamilyCode(length = 6) {
  // Genera un codigo aleatorio alfanumerico para vincular hijos con padre/madre.
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  // Construye el codigo caracter por caracter eligiendo posiciones al azar.
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}
