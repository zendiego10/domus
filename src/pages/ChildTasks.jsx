import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getTasksByChild } from "../services/childService";
import { completeTask, uncompleteTask } from "../services/taskService";
import { getChildPoints } from "../services/dashboardService";

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

  // Si ya vencio, mostrar como vencida.
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

function ChildTasks() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [completing, setCompleting] = useState(null); // id de la tarea en proceso
  const [uncompleting, setUncompleting] = useState(null); // id de la tarea que se esta desmarcando

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
      return;
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleComplete(task) {
    if (completing) return; // evita doble clic
    setCompleting(task.id);
    try {
      await completeTask(task);
      // Actualiza estado local sin recargar desde la BD.
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "completed", completed_at: new Date().toISOString() }
            : t
        )
      );
      setPoints((prev) => prev + task.points);
      setNotification({ message: "¡Tarea completada!", points: task.points });
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error("Error completando tarea:", err);
    } finally {
      setCompleting(null);
    }
  }

  // Desmarca una tarea completada y la devuelve a pendiente.
  async function handleUncomplete(task) {
    if (uncompleting) return; // evita doble clic
    setUncompleting(task.id);
    try {
      await uncompleteTask(task);
      // Actualiza estado local sin recargar desde la BD.
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "pending", completed_at: null }
            : t
        )
      );
      setPoints((prev) => prev - task.points);
      setNotification({ message: "Tarea desmarcada", points: -task.points });
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error("Error desmarcando tarea:", err);
    } finally {
      setUncompleting(null);
    }
  }

  if (!user) return null;

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const filtered = filter === "pending" ? pendingTasks : completedTasks;

  if (loading) {
    return (
      <div className="dashboard">
        <p className="dashboard-subtitle">Cargando tus tareas...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* ─── Encabezado ─── */}
      <div className="child-dashboard-header">
        <div>
          <h1 className="dashboard-title">Mis Tareas</h1>
          <p className="dashboard-subtitle">Completa tus tareas y gana puntos.</p>
        </div>
        <div className="child-points-pill">
          ⭐ <span className="child-points-pill-value">{points}</span> puntos
        </div>
      </div>

      {/* ─── Filtros ─── */}
      <div className="filter-pills" style={{ marginBottom: 24 }}>
        <button
          className={`filter-pill ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          ⏳ Pendientes ({pendingTasks.length})
        </button>
        <button
          className={`filter-pill ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          ✅ Completadas ({completedTasks.length})
        </button>
      </div>

      {/* ─── Lista de Tareas ─── */}
      {filtered.length === 0 ? (
        <div className="child-empty-state">
          {filter === "pending" ? (
            <p>¡No tienes tareas pendientes! Estás al día. 🎉</p>
          ) : (
            <p>Aún no has completado ninguna tarea. ¡Tú puedes!</p>
          )}
        </div>
      ) : (
        <div className="task-list">
          {filtered.map((task) => (
            <div className="task-card" key={task.id}>
              {/* Indicador de estado (clickeable para marcar/desmarcar) */}
              {task.status === "completed" ? (
                <button
                  className="task-check-done task-check-undo"
                  onClick={() => handleUncomplete(task)}
                  disabled={uncompleting === task.id}
                  title="Desmarcar tarea"
                >
                  ✓
                </button>
              ) : (
                <div className="task-check-btn" />
              )}

              {/* Contenido de la tarea */}
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
                      ✅ Completada el {formatDate(task.completed_at)}
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

              {/* Puntos y botón */}
              <div className="task-right">
                <div className="task-points">+{task.points} pts</div>
                {task.status === "pending" && (
                  <button
                    className="btn-complete-task"
                    onClick={() => handleComplete(task)}
                    disabled={completing === task.id}
                  >
                    {completing === task.id ? "Guardando..." : "Completar"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Toast de Notificación ─── */}
      {notification && (
        <div className="child-toast">
          {notification.points > 0 ? "✅" : "↩️"} {notification.message}
          <span className={notification.points > 0 ? "toast-points" : "toast-points-negative"}>
            {" "}{notification.points > 0 ? "+" : ""}{notification.points} pts {notification.points > 0 ? "⭐" : ""}
          </span>
        </div>
      )}

    </div>
  );
}

export default ChildTasks;
