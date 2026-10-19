import { useEffect, useState } from "react";
import { getActivityHistory } from "../../services/childService";

function PointsTimeline({ childId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityHistory(childId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [childId]);

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) return null;
  if (history.length === 0) return null;

  return (
    <div className="chart-card">
      <h2>Historial de puntos</h2>
      <p className="dashboard-subtitle">Tus últimas {history.length} actividades</p>
      <div className="points-timeline">
        {history.map((entry) => {
          const isPositive = entry.points >= 0;
          return (
            <div className="timeline-entry" key={entry.id}>
              <div className={`timeline-dot ${isPositive ? "dot-positive" : "dot-negative"}`} />
              <div className="timeline-content">
                <span className="timeline-action">{entry.action}</span>
                <span className="timeline-date">{formatDate(entry.created_at)}</span>
              </div>
              <span className={`timeline-points ${isPositive ? "pts-positive" : "pts-negative"}`}>
                {isPositive ? "+" : ""}{entry.points} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PointsTimeline;
