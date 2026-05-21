const PHRASES_MORNING = [
  "¡Buenos días, campeón! ☀️ Hoy es un gran día para brillar.",
  "¡Empieza el día con energía! 🌅 Cada tarea te acerca a tu meta.",
  "¡Buenos días! 🌟 El éxito empieza con el primer paso.",
];

const PHRASES_AFTERNOON = [
  "¡Buenas tardes! 🌤️ ¡Sigue con esa energía!",
  "¡La tarde es tuya! 💪 ¿Cuántas tareas puedes completar hoy?",
  "¡Vas muy bien! 🎯 ¡Aprovecha la tarde!",
];

const PHRASES_EVENING = [
  "¡Cierra el día completando una tarea más! 🌙",
  "¡Buenas noches, guerrero! 🌟 ¡Qué gran día has tenido!",
  "¡Última oportunidad del día! 🔥 ¡Tú puedes!",
];

const PHRASES_LOW_PROGRESS = [
  "¡El camino empieza con el primer paso! 🚀 ¡Vamos!",
  "¡Cada tarea completada es una victoria! 💪",
  "¡Tú tienes todo lo que se necesita! ⭐",
  "¡Los grandes logros empiezan poco a poco! 🌱",
];

const PHRASES_MID_PROGRESS = [
  "¡Vas por buen camino! ¡No te detengas! 🔥",
  "¡Más de la mitad! ¡Eres increíble! 🚀",
  "¡Estás en racha! ¡Sigue así! ⚡",
  "¡Cada punto cuenta! ¡Tú puedes! 💫",
];

const PHRASES_HIGH_PROGRESS = [
  "¡Casi lo logras! ¡Un último esfuerzo! 🏁",
  "¡Estás a punto de completar todo! ¡VAMOS! 🏆",
  "¡Solo un poco más! ¡Eres una máquina! 💎",
];

const PHRASES_COMPLETE = [
  "¡INCREÍBLE! ¡Todo completado! Eres una leyenda 🏆",
  "¡100%! ¡IMPARABLE! ¡Eres el/la mejor! 🌟",
  "¡PERFECTO! ¡Lo lograste! ¡Felicitaciones, campeón! 🎊",
];

const PHRASES_STREAK = [
  "¡{n} días en racha! ¡Absolutamente imparable! 🔥",
  "¡{n} días seguidos! ¡Eres una leyenda! 🌟",
  "¡{n} días! ¡Nadie te detiene! ⚡",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "evening";
}

export function getMotivationalPhrase({ progressPercent = 0, streak = 0, pendingCount = 0 }) {
  // Prioridad 1: racha activa
  if (streak >= 3) {
    return pickRandom(PHRASES_STREAK).replace("{n}", streak);
  }
  // Prioridad 2: basado en progreso
  if (progressPercent === 0 && pendingCount > 0) return pickRandom(PHRASES_LOW_PROGRESS);
  if (progressPercent === 100)  return pickRandom(PHRASES_COMPLETE);
  if (progressPercent >= 80)    return pickRandom(PHRASES_HIGH_PROGRESS);
  if (progressPercent >= 40)    return pickRandom(PHRASES_MID_PROGRESS);
  if (progressPercent > 0)      return pickRandom(PHRASES_LOW_PROGRESS);

  // Prioridad 3: hora del día
  const tod = getTimeOfDay();
  if (tod === "morning")   return pickRandom(PHRASES_MORNING);
  if (tod === "afternoon") return pickRandom(PHRASES_AFTERNOON);
  return pickRandom(PHRASES_EVENING);
}

export function getProgressEmoji(progressPercent) {
  if (progressPercent === 100) return "🏆";
  if (progressPercent >= 80)   return "🚀";
  if (progressPercent >= 50)   return "🔥";
  if (progressPercent >= 20)   return "💪";
  return "🌱";
}

// Frases que aparecen al completar una tarea.
const TASK_COMPLETE_PHRASES = [
  "¡Eso es! ¡Tú puedes con todo! 💪",
  "¡Increíble! ¡Sigue así, campeón! 🌟",
  "¡Un paso más hacia tu meta! 🚀",
  "¡Así se hace! ¡Eres imparable! ⚡",
  "¡Perfecto! ¡Cada tarea te hace más fuerte! 💎",
  "¡Wooo! ¡Lo lograste! 🎉",
  "¡Tremendo trabajo! 🏆",
  "¡Nada te detiene! ¡Sigue así! 🔥",
];

export function getTaskCompletePhrase() {
  return pickRandom(TASK_COMPLETE_PHRASES);
}

// Frases de subida de nivel.
const LEVEL_UP_PHRASES = [
  "¡Has desbloqueado un nuevo poder! 🚀",
  "¡Eres cada vez más fuerte! 💪",
  "¡El cielo es el límite! ⭐",
  "¡Imparable! ¡Nadie te detiene! ⚡",
];

export function getLevelUpPhrase() {
  return pickRandom(LEVEL_UP_PHRASES);
}
