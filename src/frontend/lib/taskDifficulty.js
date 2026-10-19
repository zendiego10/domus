export function difficultyOf(points) {
  if (points <= 5)  return { stars: "⭐",    label: "Fácil" };
  if (points <= 15) return { stars: "⭐⭐",   label: "Normal" };
  return              { stars: "⭐⭐⭐", label: "Difícil" };
}
