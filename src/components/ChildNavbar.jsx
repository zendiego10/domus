import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserSession, clearUserSession } from "../utils/auth";

function ChildNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = getUserSession();

  const childTabs = [
    { label: "Inicio",      path: "/child-home",    icon: "🏠" },
    { label: "Tareas",      path: "/child-tasks",   icon: "📋" },
    { label: "Recompensas", path: "/child-rewards", icon: "🎁" },
  ];

  // Cierra ambos menus al cambiar de ruta.
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Cierra el dropdown del avatar si se hace clic fuera.
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    clearUserSession();
    setMobileOpen(false);
    setDropdownOpen(false);
    navigate("/login-child");
  }

  function getInitials() {
    if (!user) return "";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || "?";
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner child-navbar-inner">

          {/* Boton hamburger (visible solo en movil via CSS) */}
          <button
            className={`child-hamburger${mobileOpen ? " open" : ""}`}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menú de navegación"
            aria-expanded={mobileOpen}
          >
            <span className="child-hamburger-bar" />
            <span className="child-hamburger-bar" />
            <span className="child-hamburger-bar" />
          </button>

          {/* Logo y marca (centrado en movil via CSS) */}
          <div
            className="navbar-brand child-navbar-brand"
            onClick={() => navigate("/child-home")}
            style={{ cursor: "pointer" }}
          >
            <img src="/logo domus.svg" alt="Domus logo" className="navbar-logo" />
            <div className="navbar-brand-text">
              <span className="navbar-title">Domus!</span>
            </div>
          </div>

          {/* Tabs de navegacion (ocultos en movil via CSS) */}
          <div className="navbar-tabs child-navbar-tabs">
            {childTabs.map((tab) => (
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

          {/* Avatar y dropdown de cuenta */}
          {user && (
            <div className="navbar-user" ref={dropdownRef}>
              <button
                className="navbar-avatar"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="Menú de usuario"
                aria-expanded={dropdownOpen}
              >
                {getInitials()}
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown">
                  <div className="navbar-dropdown-header">
                    <span className="navbar-dropdown-name">
                      {user.firstName} {user.lastName || ""}
                    </span>
                    <span className="navbar-dropdown-role">Hijo</span>
                  </div>
                  <hr className="navbar-dropdown-divider" />
                  <button
                    className="navbar-dropdown-item"
                    onClick={() => { navigate("/child-profile"); setDropdownOpen(false); }}
                  >
                    <span className="navbar-dropdown-icon">👤</span>
                    Mi cuenta
                  </button>
                  <button
                    className="navbar-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="navbar-dropdown-icon">⚙️</span>
                    Configuración
                  </button>
                  <hr className="navbar-dropdown-divider" />
                  <button
                    className="navbar-dropdown-item navbar-dropdown-logout"
                    onClick={handleLogout}
                  >
                    <span className="navbar-dropdown-icon">🚪</span>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Overlay que cierra el menu movil al hacer clic fuera */}
      {mobileOpen && (
        <div
          className="child-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Menu movil desplegable con los 3 tabs */}
      <div className={`child-mobile-menu${mobileOpen ? " open" : ""}`}>
        {childTabs.map((tab) => (
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
    </>
  );
}

export default ChildNavbar;
