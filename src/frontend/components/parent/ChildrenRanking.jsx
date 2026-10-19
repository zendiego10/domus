const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_CLASSES = ["rank-gold", "rank-silver", "rank-bronze"];
const CHILD_COLORS = ["pink", "teal", "yellow", "purple"];

function getInitials(child) {
  return ((child.first_name?.[0] || "") + (child.last_name?.[0] || "")).toUpperCase();
}

function ChildrenRanking({ children }) {
  if (!children || children.length === 0) return null;

  const sorted = [...children].sort((a, b) => b.points - a.points);
  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="ranking-card">
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>
        🏆 Ranking familiar
      </h2>
      <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 20 }}>
        ¡Sigan acumulando puntos!
      </p>

      <div className="ranking-podium">
        {podium.map((child, i) => (
          <div key={child.id} className={`ranking-item ${RANK_CLASSES[i]}`}>
            <span className="ranking-medal">{MEDALS[i]}</span>
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: i === 0 ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
                  : i === 1 ? "linear-gradient(135deg, #94a3b8, #cbd5e1)"
                  : "linear-gradient(135deg, #fb923c, #fdba74)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 16,
              }}
            >
              {getInitials(child)}
            </div>
            <span className="ranking-name">{child.first_name}</span>
            <span className="ranking-pts">{child.points}</span>
            <span className="ranking-pts-label">puntos</span>
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="ranking-rest">
          {rest.map((child, i) => {
            const color = CHILD_COLORS[(i + 3) % CHILD_COLORS.length];
            return (
              <div key={child.id} className="ranking-rest-item">
                <div className={`ranking-rest-avatar`}>{getInitials(child)}</div>
                <div className="ranking-rest-info">
                  <div className="ranking-rest-name">{child.first_name}</div>
                  <div className="ranking-rest-msg">¡Sigue así, puedes llegar al podio!</div>
                </div>
                <span className="ranking-rest-pts">{child.points} pts</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChildrenRanking;
