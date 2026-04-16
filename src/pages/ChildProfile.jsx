import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getChildPoints, getChildProgress } from "../services/dashboardService";

function ChildProfile() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [points, setPoints] = useState(0);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
      return;
    }
    Promise.all([
      getChildPoints(user.id),
      getChildProgress(user.id),
    ])
      .then(([pts, prog]) => {
        setPoints(pts);
        setProgress(prog);
      })
      .catch((err) => console.error("Error cargando perfil:", err))
      .finally(() => setLoading(false));
  }, []);

  function getInitials() {
    if (!user) return "";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || "?";
  }

  const progressPercent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  if (!user) return null;

  if (loading) {
    return <div className="dashboard-loading">Cargando perfil...</div>;
  }

  return (
    <div className="dashboard">
      {/* Profile card */}
      <div className="profile-card">
        <div className="profile-avatar">{getInitials()}</div>
        <div className="profile-info">
          <h1 className="profile-name">{user.firstName} {user.lastName || ""}</h1>
          <p className="profile-username">@{user.username}</p>
          <span className="profile-role-badge child">Hijo</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-cards stat-cards-3">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Puntos actuales</h3>
            <div className="stat-card-value">{points}</div>
          </div>
          <div className="stat-card-icon purple">⭐</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tareas completadas</h3>
            <div className="stat-card-value green">{progress.completed}</div>
          </div>
          <div className="stat-card-icon green">✅</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Progreso total</h3>
            <div className="stat-card-value">{progressPercent}%</div>
          </div>
          <div className="stat-card-icon blue">📈</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="chart-card">
        <h2>Progreso de tareas</h2>
        <p className="dashboard-subtitle">{progress.completed} de {progress.total} tareas completadas</p>
        <div className="progress-bar" style={{ height: "12px", borderRadius: "8px", background: "#f0f0f5" }}>
          <div
            className="progress-fill purple"
            style={{ width: `${progressPercent}%`, height: "100%", borderRadius: "8px" }}
          />
        </div>
      </div>
    </div>
  );
}

export default ChildProfile;
