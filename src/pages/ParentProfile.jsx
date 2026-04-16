import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";
import { getChildrenByParent } from "../services/dashboardService";

const CHILD_COLORS = ["pink", "teal", "yellow", "purple"];

function ParentProfile() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "parent") {
      navigate("/login-parent");
      return;
    }
    getChildrenByParent(user.id)
      .then(setChildren)
      .catch((err) => console.error("Error cargando hijos:", err))
      .finally(() => setLoading(false));
  }, []);

  function getInitials() {
    if (!user) return "";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || "?";
  }

  function getChildInitials(child) {
    const first = child.first_name?.[0] || "";
    const last = child.last_name?.[0] || "";
    return (first + last).toUpperCase();
  }

  if (!user) return null;

  if (loading) {
    return <div className="dashboard-loading">Cargando perfil...</div>;
  }

  return (
    <div className="dashboard">
      {/* Profile card */}
      <div className="profile-card">
        <div className="profile-avatar">{getInitials()}</div>
        <div className="profile-info">
          <h1 className="profile-name">{user.firstName} {user.lastName || ""}</h1>
          <p className="profile-username">@{user.username}</p>
          <p className="profile-email">{user.email}</p>
          <span className="profile-role-badge">Padre/Madre</span>
        </div>
      </div>

      {/* Children section */}
      <h2 className="section-title">Hijos vinculados</h2>
      {children.length > 0 ? (
        <div className="children-grid">
          {children.map((child, index) => {
            const color = CHILD_COLORS[index % CHILD_COLORS.length];
            return (
              <div className="child-card" key={child.id}>
                <div className="child-card-header">
                  <div className={`child-avatar ${color}`}>{getChildInitials(child)}</div>
                  <div className="child-card-name">
                    <h3>{child.first_name} {child.last_name}</h3>
                    <span>@{child.username}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">👶</div>
          <p>No tienes hijos vinculados aún.</p>
        </div>
      )}
    </div>
  );
}

export default ParentProfile;
