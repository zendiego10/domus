import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearUserSession, getUserSession } from "../utils/auth";
import Button from "../components/Button";

function ChildHome() {
  const navigate = useNavigate();
  const user = getUserSession();

  useEffect(() => {
    if (!user || user.role !== "child") {
      navigate("/login-child");
    }
  }, [user, navigate]);

  function handleLogout() {
    clearUserSession();
    navigate("/login-child");
  }

  if (!user) return null;

  return (
    <div className="page-center">
      <div className="form-card">
        <h1>Bienvenido, {user.firstName}</h1>
        <p className="subtitle">Has iniciado sesión como hijo.</p>
        <p><strong>Usuario:</strong> {user.username}</p>
        <Button text="Cerrar sesión" type="button" onClick={handleLogout} />
      </div>
    </div>
  );
}

export default ChildHome;