import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession, saveUserSession, clearUserSession } from "../utils/auth";
import { getChildPoints, getChildProgress } from "../services/dashboardService";
import { updateChildProfile } from "../services/childService";
import { computeBadges } from "../lib/badges";
import PointsTimeline from "../components/child/PointsTimeline";

function ChildProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserSession());

  const [points, setPoints] = useState(0);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  // Estado edición de nombre
  const [editingName, setEditingName] = useState(false);
  const [nameForm, setNameForm] = useState({ firstName: "", lastName: "" });
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
      return;
    }
    Promise.all([
      getChildPoints(user.id),
      getChildProgress(user.id),
    ])
      .then(([pts, prog]) => {
        setPoints(pts);
        setProgress(prog);
      })
      .catch((err) => console.error("Error cargando perfil:", err))
      .finally(() => setLoading(false));
  }, []);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  function getInitials(u = user) {
    if (!u) return "";
    const first = u.firstName?.[0] || "";
    const last = u.lastName?.[0] || "";
    return (first + last).toUpperCase() || u.username?.[0]?.toUpperCase() || "?";
  }

  function startEditName() {
    setNameForm({ firstName: user.firstName || "", lastName: user.lastName || "" });
    setNameError("");
    setEditingName(true);
  }

  async function saveName() {
    if (!nameForm.firstName.trim()) {
      setNameError("El nombre no puede estar vacío.");
      return;
    }
    setNameSaving(true);
    setNameError("");
    try {
      await updateChildProfile(user.id, {
        firstName: nameForm.firstName.trim(),
        lastName: nameForm.lastName.trim(),
      });
      const updated = { ...user, firstName: nameForm.firstName.trim(), lastName: nameForm.lastName.trim() };
      saveUserSession(updated);
      setUser(updated);
      setEditingName(false);
      showToast("Nombre actualizado.");
    } catch {
      setNameError("No se pudo guardar. Intenta nuevamente.");
    } finally {
      setNameSaving(false);
    }
  }

  const progressPercent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const badges = computeBadges({
    points,
    completedTasks: progress.completed,
    streak: 0,
    redemptions: 0,
  });
  const unlockedBadges = badges.filter((b) => b.unlocked);

  if (!user) return null;

  if (loading) {
    return <div className="dashboard-loading">Cargando perfil...</div>;
  }

  return (
    <div className="dashboard">
      {toast && <div className="child-toast toast-success">{toast}</div>}

      {/* Perfil */}
      <div className="profile-card">
        <div className="profile-avatar">{getInitials()}</div>
        <div className="profile-info">
          {editingName ? (
            <div className="profile-edit-name">
              <div className="profile-edit-row">
                <input
                  className="profile-edit-input"
                  value={nameForm.firstName}
                  onChange={(e) => setNameForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Nombre"
                />
                <input
                  className="profile-edit-input"
                  value={nameForm.lastName}
                  onChange={(e) => setNameForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Apellido"
                />
              </div>
              {nameError && <p className="profile-edit-error">{nameError}</p>}
              <div className="profile-edit-actions">
                <button className="btn-save-inline" onClick={saveName} disabled={nameSaving}>
                  {nameSaving ? "Guardando…" : "Guardar"}
                </button>
                <button className="btn-cancel-inline" onClick={() => setEditingName(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-name-row">
              <h1 className="profile-name">{user.firstName} {user.lastName || ""}</h1>
              <button className="btn-pencil" onClick={startEditName} title="Editar nombre">✏️</button>
            </div>
          )}
          <p className="profile-username">@{user.username}</p>
          <span className="profile-role-badge child">Hijo</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-cards stat-cards-3">
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Puntos actuales</h3>
            <div className="stat-card-value">{points}</div>
          </div>
          <div className="stat-card-icon purple">⭐</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Tareas completadas</h3>
            <div className="stat-card-value green">{progress.completed}</div>
          </div>
          <div className="stat-card-icon green">✅</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-info">
            <h3>Progreso total</h3>
            <div className="stat-card-value">{progressPercent}%</div>
          </div>
          <div className="stat-card-icon blue">📈</div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="chart-card">
        <h2>Progreso de tareas</h2>
        <p className="dashboard-subtitle">{progress.completed} de {progress.total} tareas completadas</p>
        <div className="progress-bar" style={{ height: "12px", borderRadius: "8px", background: "#f0f0f5" }}>
          <div
            className="progress-fill purple"
            style={{ width: `${progressPercent}%`, height: "100%", borderRadius: "8px" }}
          />
        </div>
      </div>

      {/* Logros */}
      <div className="chart-card">
        <h2>Mis logros</h2>
        <p className="dashboard-subtitle">
          {unlockedBadges.length === 0
            ? "Completa tareas para desbloquear logros."
            : `${unlockedBadges.length} de ${badges.length} desbloqueados`}
        </p>
        <div className="badges-grid">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`badge-item ${badge.unlocked ? "badge-unlocked" : "badge-locked"}`}
              title={badge.name}
            >
              <span className="badge-emoji">{badge.emoji}</span>
              <span className="badge-name">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de actividad */}
      <PointsTimeline childId={user.id} />

      {/* Cerrar sesión */}
      <div style={{ marginTop: 8 }}>
        <button
          className="btn-logout-profile"
          onClick={() => { clearUserSession(); navigate("/login-child"); }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default ChildProfile;
