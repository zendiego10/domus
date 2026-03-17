import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getTasksByParent, createTask, completeTask } from "../services/taskService";
import { getChildrenByParent } from "../services/dashboardService";

const CHILD_COLORS = ["pink", "teal", "yellow", "purple"];

function ParentTasks() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [tasks, setTasks] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("todas");
  const [filterChild, setFilterChild] = useState("todos");

  // Estado del formulario de nueva tarea.
  const [formData, setFormData] = useState({
    title: "",
    childId: "",
    category: "",
    points: "",
    description: "",
  });

  useEffect(() => {
    if (!user || user.role !== "parent") {
      navigate("/login-parent");
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [tasksData, childrenData] = await Promise.all([
        getTasksByParent(user.id),
        getChildrenByParent(user.id),
      ]);
      setTasks(tasksData);
      setChildren(childrenData);
    } catch (error) {
      console.error("Error cargando tareas:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filtra las tareas segun tipo y hijo seleccionado.
  function getFilteredTasks() {
    return tasks.filter((task) => {
      if (filterType !== "todas" && task.category !== filterType) return false;
      if (filterChild !== "todos" && task.child_id !== filterChild) return false;
      return true;
    });
  }

  const filtered = getFilteredTasks();
  const pendingTasks = filtered.filter((t) => t.status === "pending");
  const completedTasks = filtered.filter((t) => t.status === "completed");

  // Maneja el envio del formulario de nueva tarea.
  async function handleAddTask(event) {
    event.preventDefault();
    if (!formData.title || !formData.childId || !formData.category || !formData.points) return;

    try {
      const newTask = await createTask({
        parentId: user.id,
        childId: formData.childId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        points: parseInt(formData.points),
      });

      setTasks((prev) => [newTask, ...prev]);
      setFormData({ title: "", childId: "", category: "", points: "", description: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Error creando tarea:", error);
    }
  }

  // Marca una tarea como completada.
  async function handleComplete(task) {
    try {
      await completeTask(task);
      // Reload para reflejar cambios.
      await loadData();
    } catch (error) {
      console.error("Error completando tarea:", error);
    }
  }

  function getChildInitials(child) {
    if (!child) return "?";
    const first = child.first_name?.[0] || "";
    const last = child.last_name?.[0] || "";
    return (first + last).toUpperCase();
  }

  function getChildColor(childId) {
    const idx = children.findIndex((c) => c.id === childId);
    return CHILD_COLORS[idx >= 0 ? idx % CHILD_COLORS.length : 0];
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("es", { day: "numeric", month: "numeric", year: "numeric" });
  }

  if (!user) return null;

  if (loading) {
    return <div className="dashboard-loading">Cargando tareas...</div>;
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h1 className="dashboard-title">Gestión de Tareas</h1>
          <p className="dashboard-subtitle">Administra y rastrea las responsabilidades académicas y domésticas</p>
        </div>
        <button className="btn-add-task" onClick={() => setShowForm(!showForm)}>
          <span>+</span> Agregar Nueva Tarea
        </button>
      </div>

      {/* Formulario de agregar tarea */}
      {showForm && (
        <div className="add-task-card">
          <h2>Agregar Nueva Tarea</h2>
          <form onSubmit={handleAddTask}>
            <div className="add-task-grid">
              <input
                className="add-task-input"
                type="text"
                placeholder="Título de la tarea"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <select
                className="add-task-select"
                value={formData.childId}
                onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
                required
              >
                <option value="">Seleccionar hijo</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </select>
              <select
                className="add-task-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Seleccionar tipo</option>
                <option value="academica">Académica</option>
                <option value="domestica">Doméstica</option>
              </select>
              <input
                className="add-task-input"
                type="number"
                placeholder="Puntos"
                min="1"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                required
              />
              <textarea
                className="add-task-textarea full-width"
                placeholder="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="add-task-actions">
              <button type="submit" className="btn-add">Agregar Tarea</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-row">
        <div className="filter-group">
          <label>Filtrar por Tipo</label>
          <div className="filter-pills">
            {[
              { value: "todas", label: "Todas" },
              { value: "academica", label: "📚 Académicas" },
              { value: "domestica", label: "🏠 Domésticas" },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`filter-pill ${filterType === opt.value ? "active" : ""}`}
                onClick={() => setFilterType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label>Filtrar por Hijo</label>
          <select
            className="filter-select"
            value={filterChild}
            onChange={(e) => setFilterChild(e.target.value)}
          >
            <option value="todos">Todos los Hijos</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.first_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-cards stat-cards-3">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Total de Tareas</h3>
            <div className="stat-card-value">{filtered.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Pendientes</h3>
            <div className="stat-card-value orange">{pendingTasks.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Completadas</h3>
            <div className="stat-card-value green">{completedTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Columnas de tareas */}
      <div className="task-columns">
        {/* Tareas Pendientes */}
        <div>
          <h2>Tareas Pendientes ({pendingTasks.length})</h2>
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => {
              const childData = children.find((c) => c.id === task.child_id);
              const childName = task.children?.first_name || childData?.first_name || "Hijo";
              const color = getChildColor(task.child_id);
              return (
                <div className="task-card" key={task.id}>
                  <div className="task-check">
                    <button
                      className="task-check-btn"
                      onClick={() => handleComplete(task)}
                      title="Marcar como completada"
                    >
                      ✓
                    </button>
                  </div>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <div className="task-meta-child">
                        <div className={`task-meta-child-avatar`} style={{
                          background: color === "pink" ? "linear-gradient(135deg, #ec4899, #f472b6)" :
                            color === "teal" ? "linear-gradient(135deg, #14b8a6, #5eead4)" :
                            color === "yellow" ? "linear-gradient(135deg, #eab308, #fbbf24)" :
                            "linear-gradient(135deg, #9420D4, #b44de8)"
                        }}>
                          {getChildInitials(childData || task.children)}
                        </div>
                        {childName}
                      </div>
                      <span className={`task-badge ${task.category}`}>
                        {task.category === "academica" ? "Académica" : "Doméstica"}
                      </span>
                      <span className="task-date">📅 {formatDate(task.due_date)}</span>
                    </div>
                  </div>
                  <span className="task-points">+{task.points}</span>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p>No hay tareas pendientes 🎉</p>
            </div>
          )}
        </div>

        {/* Tareas Completadas */}
        <div>
          <h2>Tareas Completadas ({completedTasks.length})</h2>
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => {
              const childData = children.find((c) => c.id === task.child_id);
              const childName = task.children?.first_name || childData?.first_name || "Hijo";
              const color = getChildColor(task.child_id);
              return (
                <div className="task-card" key={task.id}>
                  <div className="task-check">
                    <div className="task-check-done">✓</div>
                  </div>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <div className="task-meta-child">
                        <div className={`task-meta-child-avatar`} style={{
                          background: color === "pink" ? "linear-gradient(135deg, #ec4899, #f472b6)" :
                            color === "teal" ? "linear-gradient(135deg, #14b8a6, #5eead4)" :
                            color === "yellow" ? "linear-gradient(135deg, #eab308, #fbbf24)" :
                            "linear-gradient(135deg, #9420D4, #b44de8)"
                        }}>
                          {getChildInitials(childData || task.children)}
                        </div>
                        {childName}
                      </div>
                      <span className={`task-badge ${task.category}`}>
                        {task.category === "academica" ? "Académica" : "Doméstica"}
                      </span>
                      <span className="task-date">✅ {formatDate(task.completed_at)}</span>
                    </div>
                  </div>
                  <span className="task-points">+{task.points}</span>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p>No hay tareas completadas aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParentTasks;
