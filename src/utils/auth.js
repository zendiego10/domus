export function saveUserSession(user) {
  localStorage.setItem("domusUser", JSON.stringify(user));
}

export function getUserSession() {
  const user = localStorage.getItem("domusUser");
  return user ? JSON.parse(user) : null;
}

export function clearUserSession() {
  localStorage.removeItem("domusUser");
}