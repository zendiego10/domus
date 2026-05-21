import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import {
  getRewardsByParent,
  createReward,
  deleteReward,
  getPendingRequests,
  approveRequest,
  rejectRequest,
} from "../services/rewardService";
import { getChildrenByParent, getChildPoints } from "../services/dashboardService";

const CHILD_COLORS = ["pink", "teal", "yellow", "purple"];
const REWARD_ICONS = {
  "📺": "📺",
  "🎬": "🎬",
  "🍕": "🍕",
  "🌙": "🌙",
  "👫": "👫",
  "📖": "📖",
  "🎮": "🎮",
  "🎁": "🎁",
  "🍦": "🍦",
  "🎪": "🎪",
  "🎵": "🎵",
  "⚽": "⚽",
};

function ParentRewards() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [rewards, setRewards] = useState([]);
  const [children, setChildren] = useState([]);
  const [childPoints, setChildPoints] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    title: "",
    pointsCost: 100,
    icon: "🎁",
    expiresAt: "",
    description: "",
    childId: "",
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

      const [rewardsData, childrenData] = await Promise.all([
        getRewardsByParent(user.id),
        getChildrenByParent(user.id),
      ]);

      // Cargar solicitudes pendientes (resiliente si la tabla no existe)
      let requestsData = [];
      try {
        requestsData = await getPendingRequests(user.id);
      } catch (err) {
        console.warn("No se pudieron cargar solicitudes pendientes:", err.message);
      }

      setRewards(rewardsData);
      setChildren(childrenData);
      setPendingRequests(requestsData);

      // Cargar puntos de cada hijo
      const pointsMap = {};
      for (const child of childrenData) {
        pointsMap[child.id] = await getChildPoints(child.id);
      }
      setChildPoints(pointsMap);
    } catch (error) {
      console.error("Error cargando datos:", error);
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleCreateReward() {
    if (!form.title.trim()) {
      showToast("El nombre de la recompensa es obligatorio", "error");
      return;
    }
    if (form.pointsCost < 1) {
      showToast("Los puntos deben ser mayor a 0", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createReward({
        parentId: user.id,
        title: form.title,
        pointsCost: parseInt(form.pointsCost),
        icon: form.icon,
        expiresAt: form.expiresAt || null,
        description: form.description,
        childId: form.childId || null,
      });

      showToast("Recompensa creada exitosamente!", "success");
      setForm({ title: "", pointsCost: 100, icon: "🎁", expiresAt: "", description: "", childId: "" });
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error("Error creando recompensa:", error);
      showToast("Error al crear la recompensa", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(rewardId) {
    if (!window.confirm("Estas seguro de que deseas eliminar esta recompensa?")) return;

    try {
      await deleteReward(rewardId);
      showToast("Recompensa eliminada", "success");
      await loadData();
    } catch (error) {
      console.error("Error eliminando recompensa:", error);
      showToast("Error al eliminar la recompensa", "error");
    }
  }

  async function handleApprove(request) {
    try {
      const { rewards: rewardData } = request;
      await approveRequest(
        request.id,
        request.child_id,
        rewardData.points_cost,
        user.id,
        rewardData.title,
        rewardData.id
      );

      showToast(`Solicitud aprobada para ${request.children.first_name}`, "success");
      await loadData();
    } catch (error) {
      if (error.message === "INSUFFICIENT_POINTS") {
        showToast("El hijo no tiene suficientes puntos", "error");
      } else {
        console.error("Error aprobando solicitud:", error);
        showToast("Error al aprobar la solicitud", "error");
      }
    }
  }

  async function handleReject(request) {
    if (!window.confirm("Rechazar esta solicitud?")) return;

    try {
      await rejectRequest(request.id, request.child_id, request.rewards?.title);
      showToast("Solicitud rechazada", "info");
      await loadData();
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      showToast("Error al rechazar la solicitud", "error");
    }
  }

  function getChildInitials(child) {
    const first = child.first_name?.[0] || "";
    const last = child.last_name?.[0] || "";
    return (first + last).toUpperCase();
  }

  function getChildColor(index) {
    return CHILD_COLORS[index % CHILD_COLORS.length];
  }

  function getChildNameById(childId) {
    const child = children.find((c) => c.id === childId);
    return child ? child.first_name : "";
  }

  function isExpired(reward) {
    return reward.expires_at && new Date(reward.expires_at) < new Date();
  }

  function formatTimeAgo(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now - date) / 1000);

    if (secondsAgo < 60) return "hace unos segundos";
    if (secondsAgo < 3600) return `hace ${Math.floor(secondsAgo / 60)} min`;
    if (secondsAgo < 86400) return `hace ${Math.floor(secondsAgo / 3600)} h`;
    return `hace ${Math.floor(secondsAgo / 86400)} dias`;
  }

  if (!user) return null;

  if (loading) {
    return <div className="dashboard-loading">Cargando recompensas...</div>;
  }

  const colorGradients = {
    pink: "linear-gradient(135deg, #ec4899, #f472b6)",
    teal: "linear-gradient(135deg, #14b8a6, #5eead4)",
    yellow: "linear-gradient(135deg, #eab308, #fbbf24)",
    purple: "linear-gradient(135deg, #9420D4, #b44de8)",
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 className="dashboard-title">Catalogo de Recompensas</h1>
          <p className="dashboard-subtitle">Crea recompensas para motivar a tus hijos y aprueba sus solicitudes</p>
        </div>
        <button
          className="btn-add-task"
          onClick={() => setShowForm(true)}
          style={{ marginBottom: 0 }}
        >
          + Agregar Recompensa
        </button>
      </div>

      {/* Modal: Crear Recompensa */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box">
            <h2 className="modal-title">Nueva Recompensa</h2>

            <div className="form-group">
              <label>Nombre de la recompensa *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="ej. Ver pelicula en cine"
              />
            </div>

            <div className="form-group">
              <label>Puntos necesarios *</label>
              <input
                type="number"
                min="1"
                value={form.pointsCost}
                onChange={(e) => setForm({ ...form, pointsCost: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Asignar a</label>
              <select
                value={form.childId}
                onChange={(e) => setForm({ ...form, childId: e.target.value })}
                className="child-select"
              >
                <option value="">Todos los hijos</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Icono de la recompensa</label>
              <div className="icon-selector">
                {Object.entries(REWARD_ICONS).map(([emoji]) => (
                  <button
                    key={emoji}
                    className={`icon-option ${form.icon === emoji ? "selected" : ""}`}
                    onClick={() => setForm({ ...form, icon: emoji })}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Fecha de vencimiento (opcional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Descripcion (opcional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="ej. Salida al cine con los papas"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-add-task"
                style={{ flex: 1, background: "#f3f4f6", color: "#6b7280", marginBottom: 0 }}
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                className="btn-add-task"
                style={{ flex: 1, marginBottom: 0 }}
                onClick={handleCreateReward}
                disabled={submitting}
              >
                {submitting ? "Creando..." : "Crear Recompensa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seccion: Solicitudes Pendientes */}
      {pendingRequests.length > 0 && (
        <div className="requests-section">
          <div className="requests-header">
            <h2>Solicitudes de Canje</h2>
            <span className="requests-badge">{pendingRequests.length}</span>
          </div>
          {pendingRequests.map((request) => {
            const childColor = getChildColor(children.findIndex((c) => c.id === request.child_id));
            return (
              <div className="request-card" key={request.id}>
                <div
                  className="request-avatar"
                  style={{ background: colorGradients[childColor] }}
                >
                  {getChildInitials(request.children)}
                </div>
                <div className="request-info">
                  <div className="request-reward-name">
                    {request.rewards.icon} {request.rewards.title}
                  </div>
                  <div className="request-meta">
                    {request.children.first_name} - {formatTimeAgo(request.requested_at)}
                  </div>
                </div>
                <span className="request-cost">{request.rewards.points_cost} pts</span>
                <div className="request-actions">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(request)}
                  >
                    Aprobar
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(request)}
                  >
                    Declinar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Balance de Puntos */}
      <div className="balance-cards">
        {children.map((child, i) => {
          const color = getChildColor(i);
          return (
            <div className="balance-card" key={child.id}>
              <div className="balance-avatar" style={{ background: colorGradients[color] }}>
                {getChildInitials(child)}
              </div>
              <div className="balance-info">
                <h3>{child.first_name}</h3>
                <div className="balance-points">
                  <span>⭐</span>
                  <span className="balance-number">{childPoints[child.id] || 0}</span>
                  <span>puntos</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recompensas */}
      <h2 className="section-title">Recompensas Disponibles</h2>

      {rewards.length > 0 ? (
        <div className="rewards-grid">
          {rewards.map((reward) => {
            const expired = isExpired(reward);
            return (
              <div
                className={`reward-card ${expired ? "expired-card" : ""}`}
                key={reward.id}
                style={expired ? { opacity: 0.5, pointerEvents: "none" } : {}}
              >
                <button
                  className="btn-reward-delete"
                  onClick={() => handleDelete(reward.id)}
                  title="Eliminar recompensa"
                  style={expired ? { pointerEvents: "auto" } : {}}
                >
                  🗑
                </button>

                {/* Badges de estado */}
                <div className="reward-badges-row">
                  {expired && <span className="reward-badge expired">Vencida</span>}
                  {!expired && reward.expires_at && (
                    <span className="reward-badge active">Activa</span>
                  )}
                  {reward.child_id ? (
                    <span className="reward-badge child-target">
                      {getChildNameById(reward.child_id)}
                    </span>
                  ) : (
                    <span className="reward-badge all-children">Todos</span>
                  )}
                </div>

                <div className="reward-icon">
                  {REWARD_ICONS[reward.icon] || reward.icon || "🎁"}
                </div>
                <h3>{reward.title}</h3>
                <p className="reward-desc">{reward.description}</p>
                <div className="reward-cost">
                  <span>⭐</span>
                  <span className="cost-number">{reward.points_cost}</span>
                  <span>puntos</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎁</div>
          <p>No hay recompensas creadas aun. Crea recompensas para motivar a tus hijos.</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`child-toast ${toast.type === "success" ? "toast-success" : toast.type === "error" ? "toast-error" : "toast-info"}`}
          style={{ color: "#fff" }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default ParentRewards;
