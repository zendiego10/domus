import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getTasksByChild } from "../services/childService";
import { completeTask, uncompleteTask, submitTaskWithPhoto } from "../services/taskService";
import { getChildPoints } from "../services/dashboardService";
import { difficultyOf } from "../lib/taskDifficulty";
import TaskPhotoUploader from "../components/TaskPhotoUploader";
import { POINTS_PER_LEVEL } from "../lib/constants";

function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function getTimeRemaining(dueDateStr) {
  if (!dueDateStr) return null;
  const diffMs = new Date(dueDateStr) - new Date();
  if (diffMs < 0) return { text: "Vencida", className: "task-overdue" };
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 1)  return { text: `Vence en ${diffDays} días`, className: "task-date" };
  if (diffDays === 1) return { text: "Vence mañana", className: "task-date task-due-soon" };
  if (diffHours > 1) return { text: `Vence en ${diffHours} horas`, className: "task-due-soon" };
  return { text: "Vence muy pronto", className: "task-overdue" };
}

function ChildTasks() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [uncompleting, setUncompleting] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tasksData, pts] = await Promise.all([
        getTasksByChild(user.id),
        getChildPoints(user.id),
      ]);
      setTasks(tasksData);
      setPoints(pts);
    } catch (err) {
      console.error("Error cargando tareas del hijo:", err);
    } finally {
      setLoading(false);
    }
  }

  function showNotification(message, pts) {
    setNotification({ message, points: pts });
    setTimeout(() => setNotification(null), 3500);
  }

  async function handleComplete(task) {
    if (completing) return;
    setCompleting(task.id);
    try {
      const oldPoints = points;
      await completeTask(task);
      setTasks((prev) =>
        prev.map((t) => t.id === task.id
          ? { ...t, status: "completed", completed_at: new Date().toISOString() }
          : t)
      );
      const newPoints = oldPoints + task.points;
      setPoints(newPoints);

      // Celebración de hito si cruza un múltiplo de 100 pts.
      if (Math.floor(oldPoints / POINTS_PER_LEVEL) < Math.floor(newPoints / POINTS_PER_LEVEL)) {
        showNotification(`🎉 ¡Cruzaste los ${Math.floor(newPoints / POINTS_PER_LEVEL) * POINTS_PER_LEVEL} puntos!`, task.points);
      } else {
        showNotification("¡Tarea completada!", task.points);
      }
    } catch (err) {
      console.error("Error completando tarea:", err);
    } finally {
      setCompleting(null);
    }
  }

  async function handleUncomplete(task) {
    if (uncompleting) return;
    setUncompleting(task.id);
    try {
      await uncompleteTask(task);
      setTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, status: "pending", completed_at: null } : t)
      );
      setPoints((prev) => prev - task.points);
      showNotification("Tarea desmarcada", -task.points);
    } catch (err) {
      console.error("Error desmarcando tarea:", err);
    } finally {
      setUncompleting(null);
    }
  }

  async function handlePhotoUploaded(task, publicUrl) {
    try {
      await submitTaskWithPhoto(task.id, publicUrl, task);
      setTasks((prev) =>
        prev.map((t) => t.id === task.id
          ? { ...t, status: "pending_review", photo_url: publicUrl }
          : t)
      );
      setUploadingFor(null);
      showNotification("📷 Foto enviada. Esperando revisión del padre.", 0);
    } catch (err) {
      console.error("Error enviando foto:", err);
    }
  }

  if (!user) return null;

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const reviewTasks  = tasks.filter((t) => t.status === "pending_review");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  let filtered;
  if (filter === "pending")  filtered = [...pendingTasks, ...reviewTasks];
  if (filter === "completed") filtered = completedTasks;

  const isMilestone = notification?.message.startsWith("🎉");

  if (loading) {
    return <div className="dashboard"><p className="dashboard-subtitle">Cargando tus tareas...</p></div>;
  }

  return (
    <div className="dashboard">
      {/* Encabezado */}
      <div className="child-dashboard-header">
        <div>
          <h1 className="dashboard-title">Mis Tareas</h1>
          <p className="dashboard-subtitle">Completa tus tareas y gana puntos.</p>
        </div>
        <div className="child-points-pill">
          ⭐ <span className="child-points-pill-value">{points}</span> puntos
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-pills" style={{ marginBottom: 24 }}>
        <button
          className={`filter-pill ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          ⏳ Pendientes ({pendingTasks.length + reviewTasks.length})
        </button>
        <button
          className={`filter-pill ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          ✅ Completadas ({completedTasks.length})
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="child-empty-state">
          {filter === "pending"
            ? <p>¡No tienes tareas pendientes! Estás al día. 🎉</p>
            : <p>Aún no has completado ninguna tarea. ¡Tú puedes!</p>}
        </div>
      ) : (
        <div className="task-list">
          {filtered.map((task) => {
            const diff = difficultyOf(task.points);
            const isReview = task.status === "pending_review";
            const isUploadingThis = uploadingFor === task.id;

            return (
              <div className="task-card" key={task.id}>
                {task.status === "completed" ? (
                  <button
                    className="task-check-done task-check-undo"
                    onClick={() => handleUncomplete(task)}
                    disabled={uncompleting === task.id}
                    title="Desmarcar tarea"
                  >✓</button>
                ) : (
                  <div className="task-check-btn" />
                )}

                <div className="task-content">
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}

                  {/* Motivo de rechazo */}
                  {task.rejection_reason && (
                    <p className="rejection-note">
                      ↩️ Devuelta: {task.rejection_reason}
                    </p>
                  )}

                  <div className="task-meta">
                    {task.category && (
                      <span className={`task-badge ${task.category}`}>
                        {task.category === "academica" ? "Académica" : "Doméstica"}
                      </span>
                    )}
                    <span className="difficulty-badge" title={diff.label}>{diff.stars}</span>

                    {isReview && (
                      <span className="pill-review">📷 Esperando revisión</span>
                    )}
                    {task.status === "completed" && task.completed_at ? (
                      <span className="task-date" style={{ color: "#22c55e" }}>
                        ✅ {formatDate(task.completed_at)}
                      </span>
                    ) : !isReview && (
                      (() => {
                        const remaining = getTimeRemaining(task.due_date);
                        return remaining ? (
                          <span className={remaining.className}>⏰ {remaining.text}</span>
                        ) : null;
                      })()
                    )}
                  </div>

                  {/* Uploader de foto */}
                  {isUploadingThis && (
                    <TaskPhotoUploader
                      task={task}
                      onUploadComplete={(url) => handlePhotoUploaded(task, url)}
                      onCancel={() => setUploadingFor(null)}
                    />
                  )}
                </div>

                {/* Puntos y botones */}
                <div className="task-right">
                  <div className="task-points">+{task.points} pts</div>
                  {task.status === "pending" && !isUploadingThis && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button
                        className="btn-complete-task"
                        onClick={() => handleComplete(task)}
                        disabled={completing === task.id}
                      >
                        {completing === task.id ? "Guardando..." : "Completar"}
                      </button>
                      <button
                        className="btn-upload-photo"
                        onClick={() => setUploadingFor(task.id)}
                        style={{ fontSize: 11, padding: "4px 8px" }}
                      >
                        📷 Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast de notificación */}
      {notification && (
        <div className={`child-toast ${isMilestone ? "toast-milestone" : ""}`}>
          {notification.points > 0 ? "✅" : notification.points < 0 ? "↩️" : "📷"}
          {" "}{notification.message}
          {notification.points !== 0 && (
            <span className={notification.points > 0 ? "toast-points" : "toast-points-negative"}>
              {" "}{notification.points > 0 ? "+" : ""}{notification.points} pts
              {notification.points > 0 ? " ⭐" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ChildTasks;
