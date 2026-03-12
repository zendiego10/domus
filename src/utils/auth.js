export function saveUserSession(user) {
  // Guarda la sesion del usuario (rol y datos basicos) en el navegador.
  localStorage.setItem("domusUser", JSON.stringify(user));
}

export function getUserSession() {
  // Recupera la sesion; si no existe, retorna null.
  const user = localStorage.getItem("domusUser");
  return user ? JSON.parse(user) : null;
}

export function clearUserSession() {
  // Cierra sesion eliminando el registro local.
  localStorage.removeItem("domusUser");
}
