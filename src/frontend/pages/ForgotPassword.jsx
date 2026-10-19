import { useState } from "react";
import { Link } from "react-router-dom";
import FormContainer from "../components/FormContainer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { isValidEmail } from "../utils/validators";
import { supabase } from "../services/supabase";

function ForgotPassword() {
  const [formData, setFormData] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm() {
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
    const validationErrors = validateForm();
    setErrors(validationErrors);
    setSuccessMessage("");
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);

      // Invoca la Edge Function que genera el token y envía el email.
      await supabase.functions.invoke("send-reset-email", {
        body: { email: formData.email.trim() },
      });

      // Siempre mostrar el mismo mensaje (anti-enumeración).
      setSuccessMessage(
        "Si el correo está registrado, recibirás un enlace en los próximos minutos."
      );
      setFormData({ email: "" });
      setErrors({});
    } catch {
      setErrors({
        general: "Ocurrió un error al procesar la solicitud. Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormContainer
      title="Recuperar contraseña"
      subtitle="Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña."
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

        <Button type="submit" text={loading ? "Enviando..." : "Enviar enlace"} />

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
