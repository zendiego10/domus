import { Navigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";

function ProtectedRoute({ children, role }) {
  // Lee la sesion guardada localmente para validar acceso.
  const user = getUserSession();

  // Si no hay sesion, envia al login principal.
  if (!user) {
    return <Navigate to="/login-parent" />;
  }

  // Si existe sesion pero el rol no coincide, bloquea acceso.
  if (role && user.role !== role) {
    return <Navigate to="/login-parent" />;
  }

  // Si pasa validaciones, renderiza el contenido protegido.
  return children;
}

export default ProtectedRoute;
