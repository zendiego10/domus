import { useEffect, useMemo } from "react";

const CONFETTI_COLORS = [
  "#9420D4", "#ec4899", "#22c55e", "#f59e0b",
  "#3b82f6", "#f97316", "#a855f7", "#ef4444",
  "#06b6d4", "#84cc16", "#f43f5e",
];

function generateParticles(n = 80) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: Math.random() * 100,
    width: 7 + Math.random() * 7,
    height: 7 + Math.random() * 14,
    isCircle: Math.random() > 0.45,
    duration: 1.1 + Math.random() * 1.3,
    delay: Math.random() * 0.7,
    sway: (Math.random() - 0.5) * 140,
    rotations: 360 * (2 + Math.floor(Math.random() * 4)),
  }));
}

// type: 'task' | 'levelup' | 'badge'
function CelebrationOverlay({ type = "task", data = {}, onDismiss }) {
  const particles = useMemo(() => generateParticles(80), []);
  const duration  = type === "levelup" ? 3800 : 2800;

  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="celebration-overlay" onClick={onDismiss}>
      {/* Confetti */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-wrap"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--sway": `${p.sway}px`,
          }}
        >
          <div
            className="confetti-piece"
            style={{
              width: p.width,
              height: p.height,
              background: p.color,
              borderRadius: p.isCircle ? "50%" : "2px",
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--rot": `${p.rotations}deg`,
            }}
          />
        </div>
      ))}

      {/* Tarjeta central */}
      <div className={`celebration-card celebration-card--${type}`} onClick={(e) => e.stopPropagation()}>
        {type === "task" && <TaskCard data={data} />}
        {type === "levelup" && <LevelUpCard data={data} />}
        {type === "badge" && <BadgeCard data={data} />}
        <p className="celebration-dismiss">Toca para cerrar</p>
      </div>
    </div>
  );
}

function TaskCard({ data }) {
  return (
    <>
      <div className="celebration-emoji">🎉</div>
      <h2 className="celebration-title">¡Tarea completada!</h2>
      <p className="celebration-task-name">"{data.taskTitle}"</p>
      <div className="celebration-points">+{data.points} pts ⭐</div>
      <p className="celebration-phrase">{data.phrase}</p>
    </>
  );
}

function LevelUpCard({ data }) {
  return (
    <>
      <div className="celebration-emoji levelup-emoji">🚀</div>
      <p className="celebration-levelup-label">¡SUBISTE DE NIVEL!</p>
      <div className="celebration-level-number">Nivel {data.level}</div>
      <p className="celebration-phrase">{data.phrase}</p>
    </>
  );
}

function BadgeCard({ data }) {
  return (
    <>
      <div className="celebration-emoji">{data.badge?.emoji || "🏆"}</div>
      <h2 className="celebration-title">¡Logro desbloqueado!</h2>
      <p className="celebration-task-name">{data.badge?.name}</p>
      <p className="celebration-phrase">¡Felicitaciones, lo lograste! 🌟</p>
    </>
  );
}

export default CelebrationOverlay;
