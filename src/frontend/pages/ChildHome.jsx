import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { fetchChildProgress } from "../services/apiClient";
import { getRecentTasksByChild } from "../services/childService";
import { getRewardsForChild } from "../services/rewardService";
import { getAvatarById } from "../lib/avatars";
import { getMotivationalPhrase, getProgressEmoji } from "../lib/motivationalPhrases";

// Valores mientras carga o si la API no responde. Las reglas reales
// (puntos, nivel, racha, insignias) las calcula el servidor (ADR-004).
const EMPTY_PROGRESS = {
  points: 0,
  level: 1,
  pointsInLevel: 0,
  pointsToNextLevel: 0,
  isMaxLevel: false,
  streak: 0,
  completedTasks: 0,
  totalTasks: 0,
  redemptions: 0,
  badges: [],
};

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

// Carga los datos del panel. Cada bloque va en su propio try/catch:
// si uno falla, el resto del panel se sigue mostrando.
async function loadDashboardData(user) {
  const data = { progress: EMPTY_PROGRESS, recentTasks: [], affordableRewards: [] };

  // Progreso (puntos, nivel, racha e insignias) calculado por la API.
  try {
    data.progress = await fetchChildProgress(user.id);
  } catch (err) {
    console.error("Error cargando el progreso del hijo:", err);
  }

  // Tareas recientes.
  try {
    data.recentTasks = await getRecentTasksByChild(user.id, 5);
  } catch (err) {
    console.error("Error cargando tareas recientes:", err);
  }

  // Recompensas que ya le alcanzan con sus puntos actuales.
  try {
    const rewards = await getRewardsForChild(user.parentId, user.id);
    data.affordableRewards = rewards.filter((r) => r.points_cost <= data.progress.points).slice(0, 3);
  } catch (err) {
    console.warn("Error cargando recompensas en home:", err.message);
  }

  return data;
}

function ChildHome() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [recentTasks, setRecentTasks] = useState([]);
  const [affordableRewards, setAffordableRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
      return;
    }
    let active = true;
    loadDashboardData(user).then((data) => {
      if (!active) return;
      setProgress(data.progress);
      setRecentTasks(data.recentTasks);
      setAffordableRewards(data.affordableRewards);
      setLoading(false);
    });
    // Si el hijo sale de la página antes de que termine la carga, no se actualiza nada.
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  // Aquí solo se calculan porcentajes para dibujar; las reglas vienen del servidor.
  const progressPercent =
    progress.totalTasks > 0 ? Math.round((progress.completedTasks / progress.totalTasks) * 100) : 0;
  const pendingCount = progress.totalTasks - progress.completedTasks;
  const levelGoal = progress.pointsInLevel + progress.pointsToNextLevel;
  const levelPercent = progress.isMaxLevel ? 100 : levelGoal > 0 ? (progress.pointsInLevel / levelGoal) * 100 : 0;

  const badges = progress.badges;
  const unlockedBadges = badges.filter((b) => b.unlocked);

  // Próximo badge a desbloquear (el primero bloqueado)
  const nextBadge = badges.find((b) => !b.unlocked);

  // Frase motivacional contextual
  const motivationalPhrase = getMotivationalPhrase({
    progressPercent,
    streak: progress.streak,
    pendingCount,
  });
  const progressEmoji = getProgressEmoji(progressPercent);

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
          <span className="child-level-badge">⭐ Nivel {progress.level}</span>
          <div className="level-progress-wrap" style={{ marginTop: 10, minWidth: 140 }}>
            <div className="level-progress-bar">
              <div
                className="level-progress-fill"
                style={{ width: `${levelPercent}%` }}
              />
            </div>
            <p className="level-progress-label">
              {progress.isMaxLevel
              ? "¡Nivel máximo!" : `${progress.pointsInLevel} / ${levelGoal} pts → Nv ${progress.level + 1}`}
            </p>
          </div>
        </div>
      </div>

      {/* Banner motivacional */}
      <div className="motivational-banner">
        <span className="motivational-emoji">{progressEmoji}</span>
        <p className="motivational-text">{motivationalPhrase}</p>
      </div>

      {/* Próximo logro a desbloquear */}
      {nextBadge && (
        <div className="next-badge-card">
          <span className="next-badge-label">Próximo logro</span>
          <div className="next-badge-content">
            <span className="next-badge-emoji">{nextBadge.emoji}</span>
            <div>
              <p className="next-badge-name">{nextBadge.name}</p>
              <p className="next-badge-hint">¡Sigue así para desbloquearlo!</p>
            </div>
            <div className="next-badge-lock">🔒</div>
          </div>
        </div>
      )}

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
            <p className="stat-card-value">{progress.points}</p>
          </div>
          <div className="stat-card-icon purple">⭐</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tareas Completadas</h3>
            <p className="stat-card-value green">{progress.completedTasks}</p>
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
            <p className="stat-card-value">{progress.redemptions}</p>
          </div>
          <div className="stat-card-icon blue">🎁</div>
        </div>
      </div>

      {/* ─── Barra de Progreso ─── */}
      <div className="child-progress-section">
        <div className="child-progress-meta">
          <span>
            Progreso general: <strong>{progress.completedTasks}</strong> de{" "}
            <strong>{progress.totalTasks}</strong> tareas completadas
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
