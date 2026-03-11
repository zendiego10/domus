import { Navigate } from "react-router-dom";
import { getUserSession } from "../utils/auth";

function ProtectedRoute({ children, role }) {
  const user = getUserSession();

  if (!user) {
    return <Navigate to="/login-parent" />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/login-parent" />;
  }

  return children;
}

export default ProtectedRoute;