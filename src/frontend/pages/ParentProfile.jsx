import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSession, saveUserSession, clearUserSession } from "../utils/auth";
import { getChildrenByParent } from "../services/dashboardService";
import { updateParentProfile, changeParentPassword } from "../services/parentService";

const CHILD_COLORS = ["pink", "teal", "yellow", "purple"];

function ParentProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserSession());

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado edición de nombre
  const [editingName, setEditingName] = useState(false);
  const [nameForm, setNameForm] = useState({ firstName: "", lastName: "" });
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  // Estado cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Estado modal agregar hijo
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Toast general
  const [toast, setToast] = useState(null);

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

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function getInitials(u = user) {
    if (!u) return "";
    const first = u.firstName?.[0] || "";
    const last = u.lastName?.[0] || "";
    return (first + last).toUpperCase() || u.username?.[0]?.toUpperCase() || "?";
  }

  function getChildInitials(child) {
    return ((child.first_name?.[0] || "") + (child.last_name?.[0] || "")).toUpperCase();
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
      await updateParentProfile(user.id, {
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

  async function savePassword() {
    if (!passwordForm.current) {
      setPasswordError("Ingresa tu contraseña actual.");
      return;
    }
    if (passwordForm.newPass.length < 8) {
      setPasswordError("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError("");
    try {
      await changeParentPassword(user.id, passwordForm.current, passwordForm.newPass);
      setPasswordSuccess(true);
      setPasswordForm({ current: "", newPass: "", confirm: "" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        showToast("Contraseña actualizada correctamente.");
      }, 1500);
    } catch (err) {
      if (err.message === "WRONG_CURRENT_PASSWORD") {
        setPasswordError("La contraseña actual no es correcta.");
      } else {
        setPasswordError("Ocurrió un error. Intenta nuevamente.");
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  async function copyFamilyCode() {
    await navigator.clipboard.writeText(user.familyCode || "");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function copyChildLink() {
    const link = `${window.location.origin}/register-child?code=${user.familyCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLogout() {
    clearUserSession();
    navigate("/login-parent");
  }

  if (!user) return null;

  if (loading) {
    return <div className="dashboard-loading">Cargando perfil...</div>;
  }

  return (
    <div className="dashboard">
      {toast && (
        <div className={`child-toast toast-${toast.type}`}>{toast.message}</div>
      )}

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
          <p className="profile-email">{user.email}</p>
          <span className="profile-role-badge">Padre/Madre</span>
        </div>
      </div>

      {/* Código familiar */}
      <div className="chart-card profile-code-card">
        <h2>Código familiar</h2>
        <p className="dashboard-subtitle">Compártelo con tus hijos para que puedan registrarse.</p>
        <div className="profile-code-row">
          <span className="profile-family-code">{user.familyCode || "—"}</span>
          <button className="btn-copy" onClick={copyFamilyCode}>
            {codeCopied ? "✓ Copiado" : "Copiar código"}
          </button>
        </div>
        <div className="profile-code-actions">
          <button className="btn-add-child" onClick={() => setShowAddChildModal(true)}>
            👶 Agregar hijo
          </button>
          <button className="btn-secondary-action" onClick={() => setShowPasswordModal(true)}>
            🔒 Cambiar contraseña
          </button>
          <button className="btn-logout-profile" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Hijos vinculados */}
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
          <button className="btn-add-child" style={{ marginTop: 12 }} onClick={() => setShowAddChildModal(true)}>
            Agregar primer hijo
          </button>
        </div>
      )}

      {/* Modal cambio de contraseña */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => { setShowPasswordModal(false); setPasswordError(""); setPasswordSuccess(false); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">🔒 Cambiar contraseña</h2>
            {passwordSuccess ? (
              <p className="profile-success-msg">¡Contraseña actualizada correctamente!</p>
            ) : (
              <>
                <div className="form-group">
                  <label>Contraseña actual</label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                    placeholder="Tu contraseña actual"
                  />
                </div>
                <div className="form-group">
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordForm.newPass}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPass: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>
                {passwordError && <p className="profile-edit-error">{passwordError}</p>}
                <div className="modal-actions">
                  <button className="btn-approve" onClick={savePassword} disabled={passwordSaving}>
                    {passwordSaving ? "Guardando…" : "Guardar"}
                  </button>
                  <button className="btn-cancel" onClick={() => { setShowPasswordModal(false); setPasswordError(""); }}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal agregar hijo */}
      {showAddChildModal && (
        <div className="modal-overlay" onClick={() => setShowAddChildModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">👶 Agregar hijo</h2>
            <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>
              Comparte el código o el enlace con tu hijo para que se registre.
            </p>
            <div className="add-child-code-block">
              <span className="add-child-code-label">Código familiar</span>
              <span className="add-child-code-value">{user.familyCode}</span>
            </div>
            <div className="modal-actions" style={{ flexDirection: "column", gap: 10 }}>
              <button className="btn-approve" onClick={copyChildLink}>
                {copied ? "✓ Enlace copiado" : "📋 Copiar enlace de registro"}
              </button>
              <button className="btn-cancel" onClick={() => setShowAddChildModal(false)}>
                Cerrar
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12, textAlign: "center" }}>
              El enlace lleva a /register-child con el código ya cargado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentProfile;
