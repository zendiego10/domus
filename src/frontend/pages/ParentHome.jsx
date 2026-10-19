import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getDashboardStats, getChildProgress, getActivityLog } from "../services/dashboardService";
import { calculateAge } from "../utils/helpers";
import ChildrenRanking from "../components/parent/ChildrenRanking";

// Colores asignados ciclicamente a cada hijo.
const CHILD_COLORS = ["pink", "teal", "yellow", "purple"];

function ParentHome() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [stats, setStats] = useState(null);
  const [childProgress, setChildProgress] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "parent") {
      navigate("/login-parent");
      return;
    }
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      // Carga estadisticas generales y lista de hijos con puntos.
      const dashStats = await getDashboardStats(user.id);
      setStats(dashStats);

      // Carga el progreso de tareas para cada hijo.
      const progressMap = {};
      for (const child of dashStats.children) {
        const progress = await getChildProgress(child.id);
        progressMap[child.id] = progress;
      }
      setChildProgress(progressMap);

      // Carga actividad reciente.
      const activityData = await getActivityLog(user.id);
      setActivities(activityData);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  // Devuelve las iniciales de un hijo.
  function getInitials(child) {
    const first = child.first_name?.[0] || "";
    const last = child.last_name?.[0] || "";
    return (first + last).toUpperCase();
  }

  // Calcula el nivel basado en los puntos del hijo.
  function getLevel(points) {
    if (points >= 1000) return 10;
    return Math.max(1, Math.floor(points / 100) + 1);
  }

  // Formatea la hora de una actividad.
  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  if (!user) return null;

  if (loading) {
    return <div className="dashboard-loading">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      {/* Saludo de bienvenida */}
      <div className="parent-welcome">
        <div>
          <h1 className="dashboard-title">¡Bienvenido, {user.firstName}! 👋</h1>
          <p className="dashboard-subtitle">Aquí está el resumen de tu familia.</p>
        </div>
      </div>

      {/* 4 tarjetas de resumen */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Puntos Totales</h3>
            <div className="stat-card-value">{stats?.totalPoints || 0}</div>
          </div>
          <div className="stat-card-icon purple">⭐</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tareas Completadas</h3>
            <div className="stat-card-value">{stats?.completedTasks || 0}</div>
          </div>
          <div className="stat-card-icon green">✅</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tareas Pendientes</h3>
            <div className="stat-card-value">{stats?.pendingTasks || 0}</div>
          </div>
          <div className="stat-card-icon orange">📈</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Hijos</h3>
            <div className="stat-card-value">{stats?.childrenCount || 0}</div>
          </div>
          <div className="stat-card-icon blue">👤</div>
        </div>
      </div>

      {/* Tus Hijos */}
      <h2 className="section-title">Tus Hijos</h2>
      {stats?.children?.length > 0 ? (
        <div className="children-grid">
          {stats.children.map((child, index) => {
            const color = CHILD_COLORS[index % CHILD_COLORS.length];
            const progress = childProgress[child.id] || { total: 0, completed: 0 };
            const age = child.birth_date ? calculateAge(child.birth_date) : null;
            const level = getLevel(child.points);
            const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

            return (
              <div className="child-card" key={child.id}>
                <div className="child-card-header">
                  <div className={`child-avatar ${color}`}>{getInitials(child)}</div>
                  <div className="child-card-name">
                    <h3>{child.first_name}</h3>
                    <span>{age !== null ? `${age} años` : ""}</span>
                  </div>
                  <span className={`child-level ${color}`}>Nv {level}</span>
                </div>
                <div className="child-card-stats">
                  <div className="child-stat-row">
                    <span>Puntos</span>
                    <span className="points-value">{child.points}</span>
                  </div>
                  <div className="child-stat-row">
                    <span>Progreso</span>
                    <span className="progress-text">{progress.completed}/{progress.total} tareas</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${color}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">👶</div>
          <p>No tienes hijos vinculados aún. Comparte tu código familiar para vincularlos.</p>
        </div>
      )}

      {/* Ranking familiar */}
      {stats?.children?.length > 0 && (
        <ChildrenRanking children={stats.children} />
      )}

      {/* Actividad Reciente */}
      <div className="activity-card">
        <h2>Actividad Reciente</h2>
        {activities.length > 0 ? (
          activities.map((act, i) => {
            const childName = act.children?.first_name || "Hijo";
            const childLastName = act.children?.last_name || "";
            const initials = (childName[0] + (childLastName[0] || "")).toUpperCase();
            const color = CHILD_COLORS[i % CHILD_COLORS.length];

            return (
              <div className="activity-item" key={act.id}>
                <div className={`activity-avatar ${color}`} style={{
                  background: color === "pink" ? "linear-gradient(135deg, #ec4899, #f472b6)" :
                    color === "teal" ? "linear-gradient(135deg, #14b8a6, #5eead4)" :
                    color === "yellow" ? "linear-gradient(135deg, #eab308, #fbbf24)" :
                    "linear-gradient(135deg, #9420D4, #b44de8)"
                }}>
                  {initials}
                </div>
                <div className="activity-info">
                  <strong>{childName}</strong>
                  <span>{act.action}</span>
                </div>
                <div className="activity-points">
                  <span className="points-number">+{act.points}</span>
                  <span className="points-time">{formatTime(act.created_at)}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>No hay actividad reciente. Las tareas completadas aparecerán aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParentHome;
