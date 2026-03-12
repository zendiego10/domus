import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginParent from "./pages/LoginParent";
import RegisterParent from "./pages/RegisterParent";
import ForgotPassword from "./pages/ForgotPassword";
import RegisterChild from "./pages/RegisterChild";
import LoginChild from "./pages/LoginChild";
import ParentHome from "./pages/ParentHome";
import ChildHome from "./pages/ChildHome";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      {/* Define todas las rutas de la app y redirige la raiz al login de padres. */}
      <Routes>
        <Route path="/" element={<Navigate to="/login-parent" replace />} />
        <Route path="/login-parent" element={<LoginParent />} />
        <Route path="/register-parent" element={<RegisterParent />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-child" element={<RegisterChild />} />
        <Route path="/login-child" element={<LoginChild />} />
        {/* Zona protegida para cuentas con rol padre/madre. */}
        <Route
          path="/parent-home"
          element={
            <ProtectedRoute role="parent">
              <ParentHome />
            </ProtectedRoute>
          }
        />

        {/* Zona protegida para cuentas con rol hijo. */}
        <Route
          path="/child-home"
          element={
            <ProtectedRoute role="child">
              <ChildHome />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
