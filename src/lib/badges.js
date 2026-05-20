export const BADGES = [
  { id: "first_task",   emoji: "🌟", name: "Primera tarea",  test: ({ completedTasks }) => completedTasks >= 1 },
  { id: "streak_3",     emoji: "🔥", name: "Racha de 3",      test: ({ streak }) => streak >= 3 },
  { id: "centenarian",  emoji: "💯", name: "Centenario",       test: ({ points }) => points >= 100 },
  { id: "veteran",      emoji: "🏆", name: "Veterano",         test: ({ completedTasks }) => completedTasks >= 10 },
  { id: "collector",    emoji: "💎", name: "Coleccionista",    test: ({ redemptions }) => redemptions >= 3 },
];

export function computeBadges(stats) {
  return BADGES.map((b) => ({ ...b, unlocked: b.test(stats) }));
}
