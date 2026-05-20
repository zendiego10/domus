import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getChildPoints, getChildProgress } from "../services/dashboardService";
import { getRecentTasksByChild, getRedemptionCount } from "../services/childService";
import { getRewardsForChild } from "../services/rewardService";
import { computeBadges } from "../lib/badges";
import { POINTS_PER_LEVEL } from "../lib/constants";
import { getAvatarById } from "../lib/avatars";

function getLevel(pts) {
  return Math.max(1, Math.floor(pts / POINTS_PER_LEVEL) + 1);
}

// Formatea una fecha ISO a texto legible en español.
function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// Calcula el tiempo restante hasta el deadline y retorna texto + clase CSS.
function getTimeRemaining(dueDateStr) {
  if (!dueDateStr) return null;
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffMs = due - now;

  if (diffMs < 0) {
    return { text: "Vencida", className: "task-overdue" };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 1) {
    return { text: `Vence en ${diffDays} días`, className: "task-date" };
  }
  if (diffDays === 1) {
    return { text: "Vence mañana", className: "task-date task-due-soon" };
  }
  if (diffHours > 1) {
    return { text: `Vence en ${diffHours} horas`, className: "task-due-soon" };
  }
  return { text: "Vence muy pronto", className: "task-overdue" };
}

function ChildHome() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [points, setPoints] = useState(0);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [affordableRewards, setAffordableRewards] = useState([]);
  const [redemptionCount, setRedemptionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
      return;
    }
    loadDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDashboard() {
    try {
      // Datos principales — no deben fallar por problemas del sistema de recompensas.
      const [pts, prog, tasks, redCount] = await Promise.all([
        getChildPoints(user.id),
        getChildProgress(user.id),
        getRecentTasksByChild(user.id, 5),
        getRedemptionCount(user.id),
      ]);

      setPoints(pts);
      setProgress(prog);
      setRecentTasks(tasks);
      setRedemptionCount(redCount);

      // Recompensas — bloque separado para no bloquear el resto si falla.
      try {
        const rewards = await getRewardsForChild(user.parentId, user.id);
        setAffordableRewards(rewards.filter((r) => r.points_cost <= pts).slice(0, 3));
      } catch (err) {
        console.warn("Error cargando recompensas en home:", err.message);
      }
    } catch (err) {
      console.error("Error cargando dashboard del hijo:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const pendingCount = progress.total - progress.completed;
  const level = getLevel(points);
  const levelProgress = points % POINTS_PER_LEVEL;
  const nextLevelThreshold = POINTS_PER_LEVEL;

  const badges = computeBadges({ points, completedTasks: progress.completed, streak: 0, redemptions: redemptionCount });
  const unlockedBadges = badges.filter((b) => b.unlocked);

  if (loading) {
    return (
      <div className="dashboard">
        <p className="dashboard-subtitle">Cargando tu panel...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* ─── Saludo + Level Badge ─── */}
      <div className="child-dashboard-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {user.avatar && getAvatarById(user.avatar) ? (
            <div
              className="child-home-avatar"
              style={{ background: getAvatarById(user.avatar).bg }}
            >
              {getAvatarById(user.avatar).emoji}
            </div>
          ) : null}
          <div>
            <h1 className="dashboard-title">¡Bienvenido, {user.firstName}!</h1>
            <p className="dashboard-subtitle">Aquí está tu progreso de hoy.</p>
          </div>
        </div>
        <div>
          <span className="child-level-badge">⭐ Nivel {level}</span>
          <div className="level-progress-wrap">
            <div className="level-progress-bar">
              <div
                className="level-progress-fill"
                style={{ width: `${(levelProgress / nextLevelThreshold) * 100}%` }}
              />
            </div>
            <p className="level-progress-label">
              {levelProgress} / {nextLevelThreshold} pts para Nivel {level + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Strip de logros desbloqueados */}
      {unlockedBadges.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {unlockedBadges.map((b) => (
            <span
              key={b.id}
              title={b.name}
              style={{
                background: "linear-gradient(135deg, #f5f0ff, #ede9fe)",
                border: "1.5px solid #c084fc",
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 13,
                fontWeight: 600,
                color: "#7c3aed",
              }}
            >
              {b.emoji} {b.name}
            </span>
          ))}
        </div>
      )}

      {/* ─── Tarjetas de Estadísticas ─── */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Mis Puntos</h3>
            <p className="stat-card-value">{points}</p>
          </div>
          <div className="stat-card-icon purple">⭐</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tareas Completadas</h3>
            <p className="stat-card-value green">{progress.completed}</p>
          </div>
          <div className="stat-card-icon green">✅</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tareas Pendientes</h3>
            <p className="stat-card-value orange">{pendingCount}</p>
          </div>
          <div className="stat-card-icon orange">⏳</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Recompensas Canjeadas</h3>
            <p className="stat-card-value">{redemptionCount}</p>
          </div>
          <div className="stat-card-icon blue">🎁</div>
        </div>
      </div>

      {/* ─── Barra de Progreso ─── */}
      <div className="child-progress-section">
        <div className="child-progress-meta">
          <span>
            Progreso general: <strong>{progress.completed}</strong> de{" "}
            <strong>{progress.total}</strong> tareas completadas
          </span>
          <span className="child-progress-percent">{progressPercent}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercent}%`,
              background: "linear-gradient(90deg, #9420D4, #b44de8)",
            }}
          />
        </div>
      </div>

      {/* ─── Últimas Tareas ─── */}
      <div className="child-section-block">
        <div className="dashboard-header">
          <h2 className="section-title">Mis Tareas Recientes</h2>
          <button
            className="btn-quick-action"
            onClick={() => navigate("/child-tasks")}
          >
            Ver todas mis tareas →
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="child-empty-state">
            <p>Aún no tienes tareas asignadas. ¡Pregúntale a tu familia!</p>
          </div>
        ) : (
          <div className="task-list">
            {recentTasks.map((task) => (
              <div className="task-card" key={task.id}>
                <div
                  className={
                    task.status === "completed" ? "task-check-done" : "task-check-btn"
                  }
                >
                  {task.status === "completed" ? "✓" : ""}
                </div>
                <div className="task-content">
                  <h3>{task.title}</h3>
                  {task.description && (
                    <p>{task.description}</p>
                  )}
                  <div className="task-meta">
                    {task.category && (
                      <span className={`task-badge ${task.category}`}>
                        {task.category === "academica" ? "Académica" : "Doméstica"}
                      </span>
                    )}
                    {task.status === "completed" && task.completed_at ? (
                      <span className="task-date" style={{ color: "#22c55e" }}>
                        ✅ Completada {formatDate(task.completed_at)}
                      </span>
                    ) : (
                      (() => {
                        const remaining = getTimeRemaining(task.due_date);
                        return remaining ? (
                          <span className={remaining.className}>
                            ⏰ {remaining.text}
                          </span>
                        ) : null;
                      })()
                    )}
                  </div>
                </div>
                <div className="task-points">+{task.points} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Recompensas a tu Alcance ─── */}
      <div className="child-section-block">
        <div className="dashboard-header">
          <h2 className="section-title">Recompensas a tu Alcance</h2>
          <button
            className="btn-quick-action"
            onClick={() => navigate("/child-rewards")}
          >
            Ver todas las recompensas →
          </button>
        </div>

        {affordableRewards.length === 0 ? (
          <div className="child-empty-state">
            <p>
              Aún no tienes puntos suficientes para canjear recompensas.
              ¡Sigue completando tareas!
            </p>
            <button
              className="btn-quick-action"
              style={{ marginTop: 16 }}
              onClick={() => navigate("/child-rewards")}
            >
              Ver el catálogo completo →
            </button>
          </div>
        ) : (
          <div className="rewards-grid rewards-grid-3">
            {affordableRewards.map((reward) => (
              <div className="reward-card" key={reward.id}>
                <div className="reward-icon">{reward.icon || "🎁"}</div>
                <h3 className="reward-title">{reward.title}</h3>
                <p className="reward-desc">{reward.description}</p>
                <div className="reward-cost">
                  <span>⭐</span>
                  <span className="cost-number">{reward.points_cost}</span>
                  <span>puntos</span>
                </div>
                <button
                  className="btn-redeem"
                  onClick={() => navigate("/child-rewards")}
                >
                  Canjear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default ChildHome;
