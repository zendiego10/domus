import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getRedemptionsByChild } from "../services/childService";
import { getRewardsForChild, requestReward, getChildPendingRequests } from "../services/rewardService";
import { getChildPoints } from "../services/dashboardService";

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function ChildRewards() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requestedIds, setRequestedIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [requesting, setRequesting] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    // Cada bloque es completamente independiente para evitar que un fallo
    // bloquee el resto de la página.

    // ── 1. Puntos del hijo ──
    try {
      const pts = await getChildPoints(user.id);
      setPoints(pts);
    } catch (err) {
      console.error("Error cargando puntos:", err);
    }

    // ── 2. Catálogo de recompensas del padre ──
    try {
      const rewardsData = await getRewardsForChild(user.parentId, user.id);
      setRewards(rewardsData);
    } catch (err) {
      console.warn("Error cargando catálogo de recompensas:", err.message);
    }

    // ── 3. Historial de canjes aprobados ──
    try {
      const redemptionsData = await getRedemptionsByChild(user.id);
      setRedemptions(redemptionsData);
    } catch (err) {
      console.warn("Error cargando historial de canjes:", err.message);
    }

    // ── 4. Solicitudes pendientes (tabla puede no existir aún) ──
    try {
      const pendingIds = await getChildPendingRequests(user.id);
      setRequestedIds(new Set(pendingIds));
    } catch (err) {
      console.warn("No se pudieron cargar solicitudes pendientes:", err.message);
    }

    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRequestReward(reward) {
    if (points < reward.points_cost) {
      showToast("No tienes suficientes puntos");
      return;
    }

    if (requestedIds.has(reward.id)) {
      showToast("Ya habias solicitado esta recompensa");
      return;
    }

    setConfirmModal(reward);
  }

  async function confirmRequest() {
    if (!confirmModal) return;

    setRequesting(confirmModal.id);
    try {
      await requestReward(confirmModal.id, user.id, user.parentId);
      setRequestedIds((prev) => new Set([...prev, confirmModal.id]));
      showToast("Solicitud enviada. Tu papa/mama la revisara pronto.");
      setConfirmModal(null);
    } catch (err) {
      console.error("Error enviando solicitud:", err);
      showToast("Error al enviar la solicitud");
    } finally {
      setRequesting(null);
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard">
        <p className="dashboard-subtitle">Cargando recompensas...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Encabezado */}
      <div className="child-dashboard-header">
        <div>
          <h1 className="dashboard-title">Recompensas</h1>
          <p className="dashboard-subtitle">
            Solicita los premios que mas desees. Tu familia los revisara y aprobara.
          </p>
        </div>
      </div>

      {/* Hero de Puntos */}
      <div className="child-points-hero">
        <div className="child-points-hero-icon">⭐</div>
        <div className="child-points-hero-value">{points}</div>
        <div className="child-points-hero-label">Puntos disponibles</div>
      </div>

      {/* Catalogo de Recompensas */}
      <h2 className="section-title" style={{ marginBottom: 16 }}>
        Catalogo de recompensas
      </h2>

      {rewards.length === 0 ? (
        <div className="child-empty-state">
          <p>Tu familia aun no ha agregado recompensas. Pronto habra premios!</p>
        </div>
      ) : (
        <div className="rewards-grid">
          {rewards.map((reward) => {
            const canAfford = points >= reward.points_cost;
            const alreadyRequested = requestedIds.has(reward.id);
            const expired = reward.expires_at && new Date(reward.expires_at) < new Date();

            if (expired) return null;

            return (
              <div className="reward-card" key={reward.id}>
                <div className="reward-icon">{reward.icon || "🎁"}</div>
                <h3 className="reward-title">{reward.title}</h3>
                <p className="reward-desc">{reward.description}</p>

                <div className="reward-cost">
                  <span>⭐</span>
                  <span className="cost-number">{reward.points_cost}</span>
                  <span>puntos</span>
                </div>

                {canAfford ? (
                  <p className="reward-can-afford">
                    Tienes suficientes puntos{" "}
                    {points > reward.points_cost ? `(+${points - reward.points_cost} de sobra)` : ""}
                  </p>
                ) : (
                  <p className="reward-cannot-afford">
                    Necesitas {reward.points_cost - points} pts mas
                  </p>
                )}

                <button
                  className={`btn-redeem ${alreadyRequested ? "btn-requested" : ""}`}
                  onClick={() => handleRequestReward(reward)}
                  disabled={!canAfford || alreadyRequested}
                  style={
                    alreadyRequested
                      ? { cursor: "not-allowed", opacity: 0.65 }
                      : !canAfford
                      ? { opacity: 0.45, cursor: "not-allowed" }
                      : {}
                  }
                >
                  {alreadyRequested ? "Solicitud enviada" : "🎁 Reclamar"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Historial de Canjes */}
      {redemptions.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Historial de Canjes Aprobados
          </h2>
          <div className="activity-card">
            {redemptions.map((r) => (
              <div className="activity-item" key={r.id}>
                <div className="activity-avatar purple">
                  {r.rewards?.icon || "🎁"}
                </div>
                <div className="activity-info">
                  <span className="activity-action">
                    {r.rewards?.title || "Recompensa canjeada"}
                  </span>
                  <span className="activity-time">{formatDate(r.created_at)}</span>
                </div>
                <div className="activity-points">
                  <span
                    className="points-number"
                    style={{ color: "#f59e0b", fontSize: 15, fontWeight: 700 }}
                  >
                    -{r.points_spent} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Confirmacion */}
      {confirmModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmModal(null)}>
          <div className="modal-box">
            <h2 className="modal-title">Confirmar solicitud?</h2>

            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {confirmModal.icon || "🎁"}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>
                {confirmModal.title}
              </h3>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
                {confirmModal.description}
              </p>

              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                  Costo: <span style={{ fontWeight: 700, color: "#1f2937" }}>⭐ {confirmModal.points_cost} puntos</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Saldo actual: <span style={{ fontWeight: 700, color: "#1f2937" }}>⭐ {points}</span> →{" "}
                  <span style={{ fontWeight: 700, color: points - confirmModal.points_cost >= 0 ? "#16a34a" : "#dc2626" }}>
                    ⭐ {points - confirmModal.points_cost}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-add-task"
                style={{ flex: 1, background: "#f3f4f6", color: "#6b7280", marginBottom: 0 }}
                onClick={() => setConfirmModal(null)}
                disabled={requesting}
              >
                Cancelar
              </button>
              <button
                className="btn-add-task"
                style={{ flex: 1, marginBottom: 0 }}
                onClick={confirmRequest}
                disabled={requesting}
              >
                {requesting ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Notificacion */}
      {toast && <div className="child-toast">{toast}</div>}
    </div>
  );
}

export default ChildRewards;
