import { useState } from "react";
import { Link } from "react-router-dom";
import FormContainer from "../components/FormContainer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { loginParent } from "../services/parentService";
import { useNavigate } from "react-router-dom";
import { saveUserSession } from "../utils/auth";

function LoginParent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Ingresa tu usuario o correo.";
    }

    if (!formData.password) {
      newErrors.password = "Ingresa tu contraseña.";
    }

    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);
    setSuccessMessage("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      const parent = await loginParent(
        formData.identifier.trim(),
        formData.password
      );

      saveUserSession({
        role: "parent",
        id: parent.id,
        username: parent.username,
        firstName: parent.first_name,
        lastName: parent.last_name,
        email: parent.email,
      });
      
      setSuccessMessage(
        `Inicio de sesión exitoso. Bienvenido, ${parent.first_name}.`
      );

      setTimeout(() => {
        navigate("/parent-home");
      }, 1000);

      setErrors({});
    } catch (error) {
      console.error(error);

      if (error.message === "PARENT_NOT_FOUND") {
        setErrors({
          identifier: "El usuario o correo no está registrado.",
        });
      } else if (error.message === "INVALID_PASSWORD") {
        setErrors({
          password: "La contraseña no coincide con la registrada.",
        });
      } else {
        setErrors({
          general: "Ocurrió un error al iniciar sesión. Intenta nuevamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormContainer
      title="Inicio de Sesión - Padre/Madre"
      subtitle="Ingresa con tu usuario o correo y contraseña."
    >
      <form onSubmit={handleSubmit}>
        <InputField
          label="Usuario o correo"
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          placeholder="Usuario o correo"
        />
        {errors.identifier && (
          <p className="error-text">{errors.identifier}</p>
        )}

        <InputField
          label="Contraseña"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Ingresa tu contraseña"
        />
        {errors.password && <p className="error-text">{errors.password}</p>}

        <Button
          type="submit"
          text={loading ? "Iniciando sesión..." : "Iniciar sesión"}
        />

        {errors.general && <p className="error-text">{errors.general}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

        <p className="link-row">
          <Link to="/forgot-password">Olvidé mi contraseña</Link>
        </p>

        <p className="link-row">
          ¿No tienes cuenta? <Link to="/register-parent">Regístrate</Link>
        </p>

        <p className="link-row">
          ¿Eres hijo? <Link to="/login-child">Ir al login de hijo</Link>
        </p>
      </form>
    </FormContainer>
  );
}

export default LoginParent;