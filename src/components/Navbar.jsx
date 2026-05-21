import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserSession, clearUserSession } from "../utils/auth";
import { getUnreadCount } from "../services/notificationService";
import NotificationPanel from "./NotificationPanel";

function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread]       = useState(0);
  const menuRef = useRef(null);

  const user     = getUserSession();
  const isParent = user?.role === "parent";

  const parentTabs = [
    { label: "Inicio",       path: "/parent-home",    icon: "🏠" },
    { label: "Tareas",       path: "/parent-tasks",   icon: "📋" },
    { label: "Recompensas",  path: "/parent-rewards", icon: "🎁" },
  ];

  // Carga el conteo de no leídas al montar y al cambiar de ruta.
  useEffect(() => {
    if (user?.id && user?.role) {
      getUnreadCount(user.id, user.role).then(setUnread).catch(() => {});
    }
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    const loginRoute = user?.role === "child" ? "/login-child" : "/login-parent";
    clearUserSession();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate(loginRoute);
  }

  function getInitials() {
    if (!user) return "";
    const first = user.firstName?.[0] || "";
    const last  = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || "?";
  }

  function openNotifications() {
    setMenuOpen(false);
    setShowNotif(true);
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner parent-navbar-inner">

          {isParent && (
            <button
              className={`parent-hamburger${mobileOpen ? " open" : ""}`}
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Menú de navegación"
              aria-expanded={mobileOpen}
            >
              <span className="parent-hamburger-bar" />
              <span className="parent-hamburger-bar" />
              <span className="parent-hamburger-bar" />
            </button>
          )}

          <div
            className="navbar-brand parent-navbar-brand"
            onClick={() => navigate(user ? (isParent ? "/parent-home" : "/child-home") : "/login-parent")}
          >
            <img src="/logo domus.svg" alt="Domus logo" className="navbar-logo" />
            <div className="navbar-brand-text">
              <span className="navbar-title">Domus!</span>
              {isParent && <span className="navbar-subtitle">Sistema de Guía Parental</span>}
            </div>
          </div>

          {isParent && (
            <div className="navbar-tabs parent-navbar-tabs">
              {parentTabs.map((tab) => (
                <button
                  key={tab.path}
                  className={`navbar-tab ${location.pathname === tab.path ? "active" : ""}`}
                  onClick={() => navigate(tab.path)}
                >
                  <span className="navbar-tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {user && (
            <div className="navbar-user" ref={menuRef}>
              {/* Botón de avatar con punto rojo si hay notificaciones */}
              <div className="navbar-avatar-wrap">
                <button
                  className="navbar-avatar"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-label="Menú de usuario"
                  aria-expanded={menuOpen}
                >
                  {getInitials()}
                </button>
                {unread > 0 && <span className="notif-red-dot" />}
              </div>

              {menuOpen && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown-header">
                    <span className="navbar-dropdown-name">{user.firstName} {user.lastName || ""}</span>
                    <span className="navbar-dropdown-role">
                      {user.role === "parent" ? "Padre/Madre" : "Hijo"}
                    </span>
                  </div>
                  <hr className="navbar-dropdown-divider" />
                  <button className="navbar-dropdown-item" onClick={() => { navigate("/parent-profile"); setMenuOpen(false); }}>
                    <span className="navbar-dropdown-icon">👤</span>
                    Mi cuenta
                  </button>
                  <button className="navbar-dropdown-item" onClick={openNotifications}>
                    <span className="navbar-dropdown-icon">🔔</span>
                    Notificaciones
                    {unread > 0 && <span className="notif-badge-inline">{unread}</span>}
                  </button>
                  <button className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <span className="navbar-dropdown-icon">⚙️</span>
                    Configuración
                  </button>
                  <hr className="navbar-dropdown-divider" />
                  <button className="navbar-dropdown-item navbar-dropdown-logout" onClick={handleLogout}>
                    <span className="navbar-dropdown-icon">🚪</span>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {mobileOpen && (
        <div className="parent-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {isParent && (
        <div className={`parent-mobile-menu${mobileOpen ? " open" : ""}`}>
          {parentTabs.map((tab) => (
            <button
              key={tab.path}
              className={`navbar-tab ${location.pathname === tab.path ? "active" : ""}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="navbar-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Panel de notificaciones */}
      {showNotif && (
        <div className="modal-overlay" onClick={() => setShowNotif(false)}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <NotificationPanel
              recipientId={user.id}
              recipientRole={user.role}
              onClose={() => setShowNotif(false)}
              onRead={() => setUnread(0)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
