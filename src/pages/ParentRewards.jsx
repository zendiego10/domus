import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getRewardsByParent, redeemReward } from "../services/rewardService";
import { getChildrenByParent, getChildPoints } from "../services/dashboardService";

const CHILD_COLORS = ["pink", "teal", "yellow", "purple"];

// Iconos predefinidos para las recompensas.
const REWARD_ICONS = {
  "📺": "📺", "🎬": "🎬", "🍕": "🍕", "🌙": "🌙", "👫": "👫", "📖": "📖",
  "🎮": "🎮", "🎁": "🎁", "🍦": "🍦", "🎪": "🎪", "🎵": "🎵", "⚽": "⚽",
};

function ParentRewards() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [rewards, setRewards] = useState([]);
  const [children, setChildren] = useState([]);
  const [childPoints, setChildPoints] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterChild, setFilterChild] = useState("todos");

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
      setRewards(rewardsData);
      setChildren(childrenData);

      // Calcula los puntos de cada hijo.
      const pointsMap = {};
      for (const child of childrenData) {
        pointsMap[child.id] = await getChildPoints(child.id);
      }
      setChildPoints(pointsMap);
    } catch (error) {
      console.error("Error cargando recompensas:", error);
    } finally {
      setLoading(false);
    }
  }

  // Canjea una recompensa para un hijo seleccionado.
  async function handleRedeem(reward) {
    // Si solo hay un hijo, canjear directamente.
    // Si hay varios, pedir seleccion.
    let selectedChildId;

    if (children.length === 1) {
      selectedChildId = children[0].id;
    } else {
      // Mostrar un prompt basico para seleccionar hijo.
      const childNames = children.map((c, i) => `${i + 1}. ${c.first_name}`).join("\n");
      const choice = prompt(
        `¿Para quién deseas canjear "${reward.title}" (${reward.points_cost} pts)?\n\n${childNames}\n\nIngresa el número:`
      );

      if (!choice) return;
      const idx = parseInt(choice) - 1;
      if (idx < 0 || idx >= children.length) {
        alert("Selección inválida.");
        return;
      }
      selectedChildId = children[idx].id;
    }

    const currentPoints = childPoints[selectedChildId] || 0;
    if (currentPoints < reward.points_cost) {
      alert("Puntos insuficientes para canjear esta recompensa.");
      return;
    }

    try {
      await redeemReward(reward.id, selectedChildId, reward.points_cost, user.id, reward.title);
      alert("¡Recompensa canjeada exitosamente!");
      await loadData();
    } catch (error) {
      if (error.message === "INSUFFICIENT_POINTS") {
        alert("Puntos insuficientes para canjear esta recompensa.");
      } else {
        console.error("Error canjeando recompensa:", error);
        alert("Error al canjear la recompensa.");
      }
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

  // Filtra hijos que pueden canjear una recompensa (tienen suficientes puntos).
  function getEligibleChildren(reward) {
    if (filterChild !== "todos") {
      const child = children.find((c) => c.id === filterChild);
      if (child && (childPoints[child.id] || 0) >= reward.points_cost) return [child];
      return [];
    }
    return children.filter((c) => (childPoints[c.id] || 0) >= reward.points_cost);
  }

  if (!user) return null;

  if (loading) {
    return <div className="dashboard-loading">Cargando recompensas...</div>;
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <h1 className="dashboard-title">Catálogo de Recompensas</h1>
      <p className="dashboard-subtitle">Mira las recompensas disponibles y canjea puntos por privilegios especiales</p>

      {/* Filtro por hijo */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Ver recompensas para:</label>
        </div>
        <div className="filter-pills">
          <button
            className={`filter-pill ${filterChild === "todos" ? "active" : ""}`}
            onClick={() => setFilterChild("todos")}
          >
            Todos los Hijos
          </button>
          {children.map((child, i) => {
            const color = getChildColor(i);
            return (
              <button
                key={child.id}
                className={`filter-pill ${filterChild === child.id ? "active" : ""}`}
                onClick={() => setFilterChild(child.id)}
              >
                <span className={`reward-chip-avatar`} style={{
                  background: color === "pink" ? "linear-gradient(135deg, #ec4899, #f472b6)" :
                    color === "teal" ? "linear-gradient(135deg, #14b8a6, #5eead4)" :
                    color === "yellow" ? "linear-gradient(135deg, #eab308, #fbbf24)" :
                    "linear-gradient(135deg, #9420D4, #b44de8)",
                  display: "inline-flex", width: 22, height: 22, borderRadius: "50%",
                  alignItems: "center", justifyContent: "center", fontSize: 10,
                  fontWeight: 700, color: "#fff"
                }}>
                  {getChildInitials(child)}
                </span>
                {child.first_name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Balance cards */}
      <div className="balance-cards">
        {children.map((child, i) => {
          const color = getChildColor(i);
          return (
            <div className="balance-card" key={child.id}>
              <div className="balance-avatar" style={{
                background: color === "pink" ? "linear-gradient(135deg, #ec4899, #f472b6)" :
                  color === "teal" ? "linear-gradient(135deg, #14b8a6, #5eead4)" :
                  color === "yellow" ? "linear-gradient(135deg, #eab308, #fbbf24)" :
                  "linear-gradient(135deg, #9420D4, #b44de8)"
              }}>
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

      {/* Titulo de recompensas disponibles */}
      <h2 className="section-title">Recompensas Disponibles</h2>

      {/* Grid de recompensas */}
      {rewards.length > 0 ? (
        <div className="rewards-grid">
          {rewards.map((reward) => {
            const eligible = getEligibleChildren(reward);
            return (
              <div className="reward-card" key={reward.id}>
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
                <div className="reward-eligible">
                  <div className="reward-eligible-label">Pueden canjear:</div>
                  <div className="reward-eligible-chips">
                    {eligible.length > 0 ? (
                      eligible.map((child, ci) => {
                        const color = getChildColor(children.indexOf(child));
                        return (
                          <div className="reward-chip" key={child.id}>
                            <div className="reward-chip-avatar" style={{
                              background: color === "pink" ? "linear-gradient(135deg, #ec4899, #f472b6)" :
                                color === "teal" ? "linear-gradient(135deg, #14b8a6, #5eead4)" :
                                color === "yellow" ? "linear-gradient(135deg, #eab308, #fbbf24)" :
                                "linear-gradient(135deg, #9420D4, #b44de8)"
                            }}>
                              {getChildInitials(child)}
                            </div>
                            {child.first_name}
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>Nadie tiene suficientes puntos</span>
                    )}
                  </div>
                </div>
                <button className="btn-redeem" onClick={() => handleRedeem(reward)}>
                  Canjear Recompensa
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎁</div>
          <p>No hay recompensas creadas aún. Crea recompensas para motivar a tus hijos.</p>
        </div>
      )}
    </div>
  );
}

export default ParentRewards;
