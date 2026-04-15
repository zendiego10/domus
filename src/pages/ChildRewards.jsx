import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getRedemptionsByChild } from "../services/childService";
import { getRewardsByParent, redeemReward } from "../services/rewardService";
import { getChildPoints } from "../services/dashboardService";

// Formatea una fecha ISO a texto legible en español.
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
  const [redeeming, setRedeeming] = useState(null); // id de la recompensa en proceso
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
      return;
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    try {
      const [pts, rewardsData, redemptionsData] = await Promise.all([
        getChildPoints(user.id),
        getRewardsByParent(user.parentId),
        getRedemptionsByChild(user.id),
      ]);
      setPoints(pts);
      setRewards(rewardsData);
      setRedemptions(redemptionsData);
    } catch (err) {
      console.error("Error cargando recompensas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(reward) {
    if (points < reward.points_cost || redeeming) return;
    setRedeeming(reward.id);
    try {
      await redeemReward(reward.id, user.id, reward.points_cost, user.parentId, reward.title);
      // Actualiza estado local sin recargar desde la BD.
      setPoints((prev) => prev - reward.points_cost);
      setRedemptions((prev) => [
        {
          id: Date.now(),
          reward_id: reward.id,
          points_spent: reward.points_cost,
          created_at: new Date().toISOString(),
          rewards: { title: reward.title, icon: reward.icon, points_cost: reward.points_cost },
        },
        ...prev,
      ]);
      setNotification(`¡Canjeaste "${reward.title}"! 🎉`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      if (err.message === "INSUFFICIENT_POINTS") {
        setNotification("No tienes suficientes puntos para esta recompensa.");
        setTimeout(() => setNotification(null), 3000);
      } else {
        console.error("Error canjeando recompensa:", err);
      }
    } finally {
      setRedeeming(null);
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

      {/* ─── Encabezado ─── */}
      <div className="child-dashboard-header">
        <div>
          <h1 className="dashboard-title">Recompensas</h1>
          <p className="dashboard-subtitle">Canjea tus puntos por premios increíbles.</p>
        </div>
      </div>

      {/* ─── Hero de Puntos ─── */}
      <div className="child-points-hero">
        <div className="child-points-hero-icon">⭐</div>
        <div className="child-points-hero-value">{points}</div>
        <div className="child-points-hero-label">Puntos disponibles</div>
      </div>

      {/* ─── Catálogo de Recompensas ─── */}
      <h2 className="section-title" style={{ marginBottom: 16 }}>
        Catálogo de recompensas
      </h2>

      {rewards.length === 0 ? (
        <div className="child-empty-state">
          <p>Tu familia aún no ha agregado recompensas. ¡Pronto habrá premios!</p>
        </div>
      ) : (
        <div className="rewards-grid">
          {rewards.map((reward) => {
            const canAfford = points >= reward.points_cost;
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
                {!canAfford && (
                  <p className="reward-missing">
                    Te faltan {reward.points_cost - points} pts
                  </p>
                )}
                <button
                  className="btn-redeem"
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford || redeeming === reward.id}
                  style={
                    !canAfford
                      ? { opacity: 0.45, cursor: "not-allowed" }
                      : {}
                  }
                >
                  {redeeming === reward.id ? "Canjeando..." : "Canjear"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Historial de Canjes ─── */}
      {redemptions.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Historial de Canjes
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

      {/* ─── Toast de Notificación ─── */}
      {notification && (
        <div className="child-toast">{notification}</div>
      )}

    </div>
  );
}

export default ChildRewards;
