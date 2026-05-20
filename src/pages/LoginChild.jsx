import { useState } from "react";
import { Link } from "react-router-dom";
import FormContainer from "../components/FormContainer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { isValidPin } from "../utils/validators";
import { loginChild } from "../services/childService";
import { useNavigate } from "react-router-dom";
import { saveUserSession } from "../utils/auth";

function LoginChild() {
  // Navegacion programatica despues de autenticar.
  const navigate = useNavigate();

  // Estado del formulario de login de hijo.
  const [formData, setFormData] = useState({
    username: "",
    pin: "",
  });

  // Estado de errores, mensajes de exito y loading.
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    // Actualiza el campo modificado por el usuario.
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    // Valida campos antes de invocar al servicio.
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Ingresa tu nombre de usuario.";
    }

    if (!formData.pin) {
      newErrors.pin = "Ingresa tu PIN.";
    } else if (!isValidPin(formData.pin)) {
      newErrors.pin = "El PIN debe tener exactamente 4 dígitos.";
    }

    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Ejecuta validaciones y detiene envio si hay errores.
    const validationErrors = validateForm();
    setErrors(validationErrors);
    setSuccessMessage("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      // Autentica al hijo por username + PIN.
      const child = await loginChild(formData.username.trim(), formData.pin);

      // Guarda sesion local para acceso a rutas protegidas.
      saveUserSession({
        role: "child",
        id: child.id,
        username: child.username,
        firstName: child.first_name,
        lastName: child.last_name,
        parentId: child.parent_id,
        avatar: child.avatar || null,
      });

      setSuccessMessage(
        `Inicio de sesión exitoso. Bienvenido, ${child.first_name}.`
      );

      // Muestra confirmacion breve y redirige.
      setTimeout(() => {
        navigate("/child-home");
      }, 1000);

      setErrors({});
    } catch (error) {
      console.error(error);

      // Mapea codigos de error a mensajes de pantalla.
      if (error.message === "CHILD_NOT_FOUND") {
        setErrors({
          username: "Ese usuario no está registrado.",
        });
      } else if (error.message === "INVALID_PIN") {
        setErrors({
          pin: "El PIN no coincide con el registrado.",
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
      title="Inicio de Sesión - Hijo"
      subtitle="Ingresa con tu usuario y tu PIN."
    >
      <form onSubmit={handleSubmit}>
        <InputField
          label="Usuario"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Tu usuario"
        />
        {errors.username && <p className="error-text">{errors.username}</p>}

        <InputField
          label="PIN"
          type="password"
          name="pin"
          value={formData.pin}
          onChange={handleChange}
          placeholder="4 dígitos"
        />
        {errors.pin && <p className="error-text">{errors.pin}</p>}

        <Button
          type="submit"
          text={loading ? "Iniciando sesión..." : "Iniciar sesión"}
        />

        {errors.general && <p className="error-text">{errors.general}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

        <p className="link-row">
          ¿No tienes cuenta? <Link to="/register-child">Regístrate</Link>
        </p>

        <p className="link-row">
          ¿Eres padre o madre? <Link to="/login-parent">Ir al login padre</Link>
        </p>
      </form>
    </FormContainer>
  );
}

export default LoginChild;
