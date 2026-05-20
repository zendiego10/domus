export const AVATARS = [
  // Niños
  { id: "boy_1",  emoji: "🧑‍🚀", label: "Astronauta", bg: "linear-gradient(135deg, #1e3a5f, #2563eb)" },
  { id: "boy_2",  emoji: "🦁",    label: "León",       bg: "linear-gradient(135deg, #92400e, #f59e0b)" },
  { id: "boy_3",  emoji: "⚽",    label: "Campeón",    bg: "linear-gradient(135deg, #14532d, #22c55e)" },
  { id: "boy_4",  emoji: "🎮",    label: "Gamer",      bg: "linear-gradient(135deg, #4c1d95, #8b5cf6)" },
  { id: "boy_5",  emoji: "🦊",    label: "Zorro",      bg: "linear-gradient(135deg, #9a3412, #f97316)" },
  // Niñas
  { id: "girl_1", emoji: "🦋",    label: "Mariposa",   bg: "linear-gradient(135deg, #9d174d, #ec4899)" },
  { id: "girl_2", emoji: "🌸",    label: "Flores",     bg: "linear-gradient(135deg, #be185d, #f472b6)" },
  { id: "girl_3", emoji: "🦄",    label: "Unicornio",  bg: "linear-gradient(135deg, #6d28d9, #c084fc)" },
  { id: "girl_4", emoji: "🌈",    label: "Arcoíris",   bg: "linear-gradient(135deg, #0891b2, #67e8f9)" },
  { id: "girl_5", emoji: "⭐",    label: "Estrella",   bg: "linear-gradient(135deg, #b45309, #fcd34d)" },
];

export function getAvatarById(id) {
  return AVATARS.find((a) => a.id === id) || null;
}
