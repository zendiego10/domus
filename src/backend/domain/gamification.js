// Reglas de gamificación del módulo de Tareas (ADR-004).
// Única fuente de verdad para puntos, nivel, racha e insignias.
// Son funciones puras: no leen la base de datos ni la interfaz,
// reciben datos y devuelven resultados, por eso se pueden probar solas.

export const POINTS_PER_LEVEL = 100;
export const MAX_LEVEL = 10;
export const DEFAULT_TIME_ZONE = "America/Bogota";

export const BADGES = [
  { id: "first_task",  emoji: "🌟", name: "Primera tarea", test: ({ completedTasks }) => completedTasks >= 1 },
  { id: "streak_3",    emoji: "🔥", name: "Racha de 3",    test: ({ streak }) => streak >= 3 },
  { id: "centenarian", emoji: "💯", name: "Centenario",    test: ({ points }) => points >= 100 },
  { id: "veteran",     emoji: "🏆", name: "Veterano",      test: ({ completedTasks }) => completedTasks >= 10 },
  { id: "collector",   emoji: "💎", name: "Coleccionista", test: ({ redemptions }) => redemptions >= 3 },
];

// Puntos actuales = puntos de tareas completadas - puntos gastados en canjes.
// Los puntos nunca se guardan: siempre se derivan de estos datos.
export function calculatePoints(completedTasks = [], redemptions = []) {
  const earned = completedTasks.reduce((sum, t) => sum + (t.points || 0), 0);
  const spent = redemptions.reduce((sum, r) => sum + (r.points_spent || 0), 0);
  return earned - spent;
}

// Nivel según los puntos, entre 1 y MAX_LEVEL.
export function calculateLevel(points) {
  const level = Math.floor(Math.max(0, points) / POINTS_PER_LEVEL) + 1;
  return Math.min(MAX_LEVEL, level);
}

// Cuántos puntos lleva dentro del nivel actual y cuántos le faltan para el siguiente.
export function calculateLevelProgress(points) {
  const level = calculateLevel(points);
  if (level === MAX_LEVEL) {
    return { level, pointsInLevel: POINTS_PER_LEVEL, pointsToNextLevel: 0, isMaxLevel: true };
  }
  const pointsInLevel = Math.max(0, points) % POINTS_PER_LEVEL;
  return { level, pointsInLevel, pointsToNextLevel: POINTS_PER_LEVEL - pointsInLevel, isMaxLevel: false };
}

// Convierte una fecha a "AAAA-MM-DD" en la zona horaria de la familia.
function toDayKey(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(date));
}

function previousDayKey(dayKey) {
  const d = new Date(`${dayKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Racha = días seguidos con al menos una tarea completada.
// Si hoy todavía no completó ninguna, la racha sigue viva desde ayer.
export function calculateStreak(completedDates = [], today = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const days = new Set(completedDates.filter(Boolean).map((d) => toDayKey(d, timeZone)));
  let day = toDayKey(today, timeZone);
  if (!days.has(day)) day = previousDayKey(day);

  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = previousDayKey(day);
  }
  return streak;
}

// Evalúa cada insignia con las estadísticas del hijo.
export function computeBadges(stats) {
  return BADGES.map(({ id, emoji, name, test }) => ({ id, emoji, name, unlocked: test(stats) }));
}

// Progreso completo de un hijo, listo para enviarlo en la respuesta de la API.
export function buildChildProgress({ tasks = [], redemptions = [], today = new Date(), timeZone = DEFAULT_TIME_ZONE }) {
  const completed = tasks.filter((t) => t.status === "completed");
  const points = calculatePoints(completed, redemptions);
  const streak = calculateStreak(completed.map((t) => t.completed_at), today, timeZone);
  const stats = { points, completedTasks: completed.length, streak, redemptions: redemptions.length };

  return {
    points,
    ...calculateLevelProgress(points),
    streak,
    completedTasks: completed.length,
    totalTasks: tasks.length,
    redemptions: redemptions.length,
    badges: computeBadges(stats),
  };
}


// Caso de uso: progreso de un hijo leído desde la capa de datos.
// Los repositorios llegan como parámetro (inyección de dependencias): así este
// archivo no importa Supabase y se puede probar con repositorios falsos.
// Devuelve null si el hijo no existe.
export async function getChildProgress(childId, { childRepository, taskRepository }, today = new Date()) {
  const child = await childRepository.findChildById(childId);
  if (!child) return null;

  const [tasks, redemptions] = await Promise.all([
    taskRepository.findTasksByChild(childId),
    childRepository.findRedemptionsByChild(childId),
  ]);

  return { childId: child.id, ...buildChildProgress({ tasks, redemptions, today }) };
}