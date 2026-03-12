import { useState } from "react";
import { Link } from "react-router-dom";
import FormContainer from "../components/FormContainer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { isValidEmail } from "../utils/validators";
import { findParentByEmail } from "../services/parentService";

function ForgotPassword() {
  // Formulario minimo: solo correo para verificar existencia de cuenta.
  const [formData, setFormData] = useState({
    email: "",
  });

  // Estado de errores, mensaje de confirmacion y loading.
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    // Sincroniza input de correo con el estado.
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    // Verifica que haya correo y que cumpla formato basico.
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Ingresa tu correo electrónico.";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "El correo no es válido.";
    }

    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Valida y evita consultar backend si hay errores locales.
    const validationErrors = validateForm();
    setErrors(validationErrors);
    setSuccessMessage("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      // Solo comprueba existencia del correo por ahora (sin envio real).
      await findParentByEmail(formData.email.trim());

      setSuccessMessage(
        "Correo verificado correctamente. Más adelante aquí se enviará el enlace de recuperación."
      );

      setFormData({
        email: "",
      });

      setErrors({});
    } catch (error) {
      console.error(error);

      // Mapea errores del servicio a mensajes amigables.
      if (error.message === "EMAIL_NOT_FOUND") {
        setErrors({
          email: "Ese correo no coincide con ningún registro del sistema.",
        });
      } else {
        setErrors({
          general: "Ocurrió un error al verificar el correo. Intenta nuevamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormContainer
      title="Recuperar contraseña"
      subtitle="Ingresa tu correo para continuar con la recuperación."
    >
      <form onSubmit={handleSubmit}>
        <InputField
          label="Correo electrónico"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
        />
        {errors.email && <p className="error-text">{errors.email}</p>}

        <Button type="submit" text={loading ? "Verificando..." : "Enviar"} />

        {errors.general && <p className="error-text">{errors.general}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

        <p className="link-row">
          <Link to="/login-parent">Volver al inicio de sesión</Link>
        </p>
      </form>
    </FormContainer>
  );
}

export default ForgotPassword;
