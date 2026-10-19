import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginParent from "./pages/LoginParent";
import RegisterParent from "./pages/RegisterParent";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RegisterChild from "./pages/RegisterChild";
import LoginChild from "./pages/LoginChild";
import ParentHome from "./pages/ParentHome";
import ParentTasks from "./pages/ParentTasks";
import ParentRewards from "./pages/ParentRewards";
import ParentProfile from "./pages/ParentProfile";
import ChildHome from "./pages/ChildHome";
import ChildTasks from "./pages/ChildTasks";
import ChildRewards from "./pages/ChildRewards";
import ChildProfile from "./pages/ChildProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import ChildNavbar from "./components/ChildNavbar";

// Muestra la navbar correcta segun si la ruta pertenece al hijo o al padre.
function NavbarRouter() {
  const location = useLocation();
  const isChildRoute = location.pathname.startsWith("/child-");
  return isChildRoute ? <ChildNavbar /> : <Navbar />;
}

function App() {
  return (
    <BrowserRouter>
      {/* Navbar adaptable: ChildNavbar en rutas /child-*, Navbar en el resto. */}
      <NavbarRouter />
      {/* Define todas las rutas de la app y redirige la raiz al login de padres. */}
      <Routes>
        <Route path="/" element={<Navigate to="/login-parent" replace />} />
        <Route path="/login-parent" element={<LoginParent />} />
        <Route path="/register-parent" element={<RegisterParent />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route
          path="/parent-tasks"
          element={
            <ProtectedRoute role="parent">
              <ParentTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent-rewards"
          element={
            <ProtectedRoute role="parent">
              <ParentRewards />
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
        <Route
          path="/child-tasks"
          element={
            <ProtectedRoute role="child">
              <ChildTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/child-rewards"
          element={
            <ProtectedRoute role="child">
              <ChildRewards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent-profile"
          element={
            <ProtectedRoute role="parent">
              <ParentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/child-profile"
          element={
            <ProtectedRoute role="child">
              <ChildProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
