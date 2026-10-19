import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import {
  getTasksByParent, createTask, completeTask, uncompleteTask,
  deleteTask, updateTask, approveTaskReview, rejectTaskReview,
  generateRecurringInstances,
} from "../services/taskService";
import { getChildrenByParent } from "../services/dashboardService";
import { difficultyOf } from "../lib/taskDifficulty";

const CHILD_COLORS = ["pink", "teal", "yellow", "purple"];

// Componente separado para evitar llamar useState dentro de un .map()
function ReviewTaskCard({ task, onApprove, onReject, TaskCardMeta, TaskMenu }) {
  const [rejReason, setRejReason] = useState("");
  const [showRejInput, setShowRejInput] = useState(false);

  return (
    <div className="task-card">
      {task.photo_url && (
        <img src={task.photo_url} alt="Evidencia" className="task-photo-thumb" />
      )}
      <div className="task-content">
        <h3>{task.title}</h3>
        <TaskCardMeta task={task} />
        <div className="review-actions" style={{ marginTop: 8 }}>
          <button className="btn-approve" onClick={() => onApprove(task)}>
            ✓ Aprobar
          </button>
          <button className="btn-reject" onClick={() => setShowRejInput(!showRejInput)}>
            ✗ Rechazar
          </button>
        </div>
        {showRejInput && (
          <div style={{ marginTop: 8 }}>
            <input
              className="add-task-input"
              placeholder="Motivo (opcional)"
              value={rejReason}
              onChange={(e) => setRejReason(e.target.value)}
              style={{ marginBottom: 6 }}
            />
            <button
              className="btn-reject"
              onClick={() => { onReject(task, rejReason); setShowRejInput(false); }}
            >
              Confirmar rechazo
            </button>
          </div>
        )}
      </div>
      <TaskMenu task={task} />
    </div>
  );
}

function ParentTasks() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [tasks, setTasks] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("todas");
  const [filterChild, setFilterChild] = useState("todos");

  const [formData, setFormData] = useState({
    title: "", childId: "", category: "", points: "", description: "", dueDate: "",
    isRecurring: false, recurrenceFrequency: "weekly",
  });

  // Menú de 3 puntos
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Modal de edición
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Modal de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "parent") {
      navigate("/login-parent");
      return;
    }
    loadData();
  }, []);

  // Cierra el menú al hacer clic fuera.
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [tasksData, childrenData] = await Promise.all([
        getTasksByParent(user.id),
        getChildrenByParent(user.id),
      ]);

      // Genera instancias de tareas recurrentes si corresponde.
      let allTasks = tasksData;
      try {
        const newInstances = await generateRecurringInstances(user.id, tasksData);
        if (newInstances.length > 0) allTasks = [...newInstances, ...tasksData];
      } catch {
        // Las columnas recurrentes pueden no existir aún (migración pendiente).
      }

      setTasks(allTasks);
      setChildren(childrenData);
    } catch (error) {
      console.error("Error cargando tareas:", error);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function getFilteredTasks() {
    return tasks.filter((task) => {
      if (filterType !== "todas" && task.category !== filterType) return false;
      if (filterChild !== "todos" && String(task.child_id) !== String(filterChild)) return false;
      return true;
    });
  }

  const filtered = getFilteredTasks();
  const pendingTasks = filtered.filter((t) => t.status === "pending");
  const reviewTasks = filtered.filter((t) => t.status === "pending_review");
  const completedTasks = filtered.filter((t) => t.status === "completed");

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
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        isRecurring: formData.isRecurring,
        recurrenceFrequency: formData.isRecurring ? formData.recurrenceFrequency : null,
      });
      setTasks((prev) => [newTask, ...prev]);
      setFormData({ title: "", childId: "", category: "", points: "", description: "", dueDate: "", isRecurring: false, recurrenceFrequency: "weekly" });
      setShowForm(false);
      showToast("Tarea creada.");
    } catch (error) {
      console.error("Error creando tarea:", error);
    }
  }

  async function handleComplete(task) {
    try {
      await completeTask(task);
      await loadData();
    } catch (error) {
      console.error("Error completando tarea:", error);
    }
  }

  async function handleUncomplete(task) {
    try {
      await uncompleteTask(task);
      await loadData();
    } catch (error) {
      console.error("Error desmarcando tarea:", error);
    }
  }

  async function handleApproveReview(task) {
    try {
      await approveTaskReview(task);
      await loadData();
      showToast("Tarea aprobada. Puntos otorgados.");
    } catch (err) {
      console.error("Error aprobando revisión:", err);
      showToast("No se pudo aprobar.", "error");
    }
  }

  async function handleRejectReview(task, reason) {
    try {
      await rejectTaskReview(task, reason);
      await loadData();
      showToast("Tarea devuelta al hijo.");
    } catch (err) {
      console.error("Error rechazando revisión:", err);
    }
  }

  function openEdit(task) {
    setOpenMenuId(null);
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      category: task.category,
      points: task.points,
      dueDate: task.due_date ? task.due_date.slice(0, 16) : "",
      childId: task.child_id,
    });
  }

  async function saveEdit() {
    if (!editForm.title || !editForm.category || !editForm.points) return;
    setEditSaving(true);
    try {
      const updated = await updateTask(editingTask.id, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        points: parseInt(editForm.points),
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
        childId: editForm.childId,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTask(null);
      showToast("Tarea actualizada.");
    } catch (err) {
      if (err.message === "CANNOT_EDIT_COMPLETED") {
        showToast("No se puede editar una tarea completada.", "error");
      } else {
        showToast("Error al guardar.", "error");
      }
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDeleteTask() {
    setDeleting(true);
    try {
      await deleteTask(confirmDelete);
      setTasks((prev) => prev.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
      showToast("Tarea eliminada.");
    } catch (err) {
      console.error("Error eliminando:", err);
      showToast("No se pudo eliminar.", "error");
    } finally {
      setDeleting(false);
    }
  }

  function getChildInitials(child) {
    if (!child) return "?";
    return ((child.first_name?.[0] || "") + (child.last_name?.[0] || "")).toUpperCase();
  }

  function getChildColor(childId) {
    const idx = children.findIndex((c) => c.id === childId);
    return CHILD_COLORS[idx >= 0 ? idx % CHILD_COLORS.length : 0];
  }

  function avatarStyle(color) {
    const styles = {
      pink:   "linear-gradient(135deg, #ec4899, #f472b6)",
      teal:   "linear-gradient(135deg, #14b8a6, #5eead4)",
      yellow: "linear-gradient(135deg, #eab308, #fbbf24)",
      purple: "linear-gradient(135deg, #9420D4, #b44de8)",
    };
    return { background: styles[color] || styles.purple };
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("es", { day: "numeric", month: "numeric", year: "numeric" });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("es", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  function getDeliveryStatus(task) {
    if (!task.due_date || !task.completed_at) return null;
    const completed = new Date(task.completed_at) <= new Date(task.due_date);
    return completed
      ? { label: "A tiempo", className: "task-ontime" }
      : { label: "Entregada tarde", className: "task-late" };
  }

  function TaskMenu({ task }) {
    const isOpen = openMenuId === task.id;
    return (
      <div className="task-menu-wrap" ref={isOpen ? menuRef : null}>
        <button
          className="btn-task-menu"
          onClick={(e) => { e.stopPropagation(); setOpenMenuId(isOpen ? null : task.id); }}
        >
          ⋯
        </button>
        {isOpen && (
          <div className="task-dropdown">
            {task.status === "pending" && (
              <button className="task-dropdown-item" onClick={() => openEdit(task)}>
                ✏️ Editar
              </button>
            )}
            <button
              className="task-dropdown-item danger"
              onClick={() => { setOpenMenuId(null); setConfirmDelete(task); }}
            >
              🗑️ Eliminar
            </button>
          </div>
        )}
      </div>
    );
  }

  function TaskCardMeta({ task }) {
    const childData = children.find((c) => c.id === task.child_id);
    const childName = task.children?.first_name || childData?.first_name || "Hijo";
    const color = getChildColor(task.child_id);
    const diff = difficultyOf(task.points);
    return (
      <div className="task-meta">
        <div className="task-meta-child">
          <div className="task-meta-child-avatar" style={avatarStyle(color)}>
            {getChildInitials(childData || task.children)}
          </div>
          {childName}
        </div>
        <span className={`task-badge ${task.category}`}>
          {task.category === "academica" ? "Académica" : "Doméstica"}
        </span>
        <span className="difficulty-badge" title={diff.label}>{diff.stars}</span>
      </div>
    );
  }

  if (!user) return null;
  if (loading) return <div className="dashboard-loading">Cargando tareas...</div>;

  return (
    <div className="dashboard">
      {toast && (
        <div className={`child-toast toast-${toast.type}`}>{toast.message}</div>
      )}

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

      {/* Formulario */}
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
              <div className="add-task-field">
                <label className="add-task-label">Fecha y hora límite (opcional)</label>
                <input
                  className="add-task-input"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <textarea
                className="add-task-textarea full-width"
                placeholder="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="add-task-field full-width" style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    style={{ accentColor: "#9420D4" }}
                  />
                  🔁 Tarea recurrente
                </label>
                {formData.isRecurring && (
                  <select
                    className="add-task-select"
                    value={formData.recurrenceFrequency}
                    onChange={(e) => setFormData({ ...formData, recurrenceFrequency: e.target.value })}
                    style={{ maxWidth: 160 }}
                  >
                    <option value="daily">Diaria</option>
                    <option value="weekly">Semanal</option>
                  </select>
                )}
              </div>
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
              <option key={child.id} value={child.id}>{child.first_name}</option>
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

      {/* Columnas */}
      <div className="task-columns">
        {/* Pendientes de Revisión (foto) */}
        {reviewTasks.length > 0 && (
          <div>
            <span className="review-column-header">📷 Por revisar ({reviewTasks.length})</span>
            {reviewTasks.map((task) => (
              <ReviewTaskCard
                key={task.id}
                task={task}
                onApprove={handleApproveReview}
                onReject={handleRejectReview}
                TaskCardMeta={TaskCardMeta}
                TaskMenu={TaskMenu}
              />
            ))}
          </div>
        )}

        {/* Tareas Pendientes */}
        <div>
          <h2>Tareas Pendientes ({pendingTasks.length})</h2>
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <div className="task-card" key={task.id}>
                <div className="task-check">
                  <button
                    className="task-check-btn"
                    onClick={() => handleComplete(task)}
                    title="Marcar como completada"
                  >✓</button>
                </div>
                <div className="task-content">
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}
                  <TaskCardMeta task={task} />
                  {task.due_date && (
                    <span className="task-date">📅 {formatDateTime(task.due_date)}</span>
                  )}
                </div>
                <span className="task-points">+{task.points}</span>
                <TaskMenu task={task} />
              </div>
            ))
          ) : (
            <div className="empty-state"><p>No hay tareas pendientes 🎉</p></div>
          )}
        </div>

        {/* Tareas Completadas */}
        <div>
          <h2>Tareas Completadas ({completedTasks.length})</h2>
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => {
              const delivery = getDeliveryStatus(task);
              return (
                <div className="task-card" key={task.id}>
                  <div className="task-check">
                    <button
                      className="task-check-done task-check-undo"
                      onClick={() => handleUncomplete(task)}
                      title="Desmarcar tarea"
                    >✓</button>
                  </div>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <TaskCardMeta task={task} />
                    <span className="task-date">✅ {formatDate(task.completed_at)}</span>
                    {delivery && (
                      <span className={`task-delivery ${delivery.className}`}>{delivery.label}</span>
                    )}
                  </div>
                  <span className="task-points">+{task.points}</span>
                  <TaskMenu task={task} />
                </div>
              );
            })
          ) : (
            <div className="empty-state"><p>No hay tareas completadas aún</p></div>
          )}
        </div>
      </div>

      {/* Modal editar tarea */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">✏️ Editar tarea</h2>
            <div className="form-group">
              <label>Título</label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Título de la tarea"
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descripción (opcional)"
              />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select
                className="add-task-select"
                value={editForm.category}
                onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
              >
                <option value="academica">Académica</option>
                <option value="domestica">Doméstica</option>
              </select>
            </div>
            <div className="form-group">
              <label>Puntos</label>
              <input
                type="number"
                min="1"
                value={editForm.points}
                onChange={(e) => setEditForm((p) => ({ ...p, points: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Hijo asignado</label>
              <select
                className="add-task-select"
                value={editForm.childId}
                onChange={(e) => setEditForm((p) => ({ ...p, childId: e.target.value }))}
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha y hora límite (opcional)</label>
              <input
                type="datetime-local"
                value={editForm.dueDate}
                onChange={(e) => setEditForm((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-approve" onClick={saveEdit} disabled={editSaving}>
                {editSaving ? "Guardando…" : "Guardar"}
              </button>
              <button className="btn-cancel" onClick={() => setEditingTask(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">🗑️ Eliminar tarea</h2>
            <p style={{ color: "#374151", marginBottom: 8 }}>
              ¿Seguro que quieres eliminar <strong>"{confirmDelete.title}"</strong>?
            </p>
            {confirmDelete.status === "completed" && (
              <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
                Esta tarea estaba completada. Se restarán {confirmDelete.points} pts de {
                  children.find((c) => c.id === confirmDelete.child_id)?.first_name || "el hijo"
                }.
              </p>
            )}
            <div className="modal-actions">
              <button className="btn-reject" onClick={confirmDeleteTask} disabled={deleting}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
              <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentTasks;
