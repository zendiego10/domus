import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserSession, clearUserSession } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Lee la sesion actual para decidir si mostrar el avatar y los tabs.
  const user = getUserSession();
  const isParent = user?.role === "parent";

  // Tabs del dashboard visibles solo para padres autenticados.
  const parentTabs = [
    { label: "Inicio", path: "/parent-home", icon: "🏠" },
    { label: "Tareas", path: "/parent-tasks", icon: "📋" },
    { label: "Recompensas", path: "/parent-rewards", icon: "🎁" },
  ];

  // Cierra el menu si se hace clic fuera de el.
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cierra el menu al cambiar de ruta.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    // Cierra sesion y redirige al login segun el rol.
    const loginRoute = user?.role === "child" ? "/login-child" : "/login-parent";
    clearUserSession();
    setMenuOpen(false);
    navigate(loginRoute);
  }

  // Genera las iniciales del usuario para el avatar.
  function getInitials() {
    if (!user) return "";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || "?";
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo y marca */}
        <div className="navbar-brand" onClick={() => navigate(user ? (isParent ? "/parent-home" : "/child-home") : "/login-parent")}>
          <img src="/logo.png" alt="Domus logo" className="navbar-logo" />
          <div className="navbar-brand-text">
            <span className="navbar-title">Domus!</span>
            {isParent && <span className="navbar-subtitle">Sistema de Guía Parental</span>}
          </div>
        </div>

        {/* Tabs de navegacion (solo para padres autenticados) */}
        {isParent && (
          <div className="navbar-tabs">
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

        {/* Avatar y menu desplegable (solo si hay sesion activa) */}
        {user && (
          <div className="navbar-user" ref={menuRef}>
            <button
              className="navbar-avatar"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menú de usuario"
              aria-expanded={menuOpen}
            >
              {getInitials()}
            </button>

            {menuOpen && (
              <div className="navbar-dropdown">
                <div className="navbar-dropdown-header">
                  <span className="navbar-dropdown-name">{user.firstName} {user.lastName || ""}</span>
                  <span className="navbar-dropdown-role">
                    {user.role === "parent" ? "Padre/Madre" : "Hijo"}
                  </span>
                </div>
                <hr className="navbar-dropdown-divider" />
                <button className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                  <span className="navbar-dropdown-icon">👤</span>
                  Mi cuenta
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
  );
}

export default Navbar;
