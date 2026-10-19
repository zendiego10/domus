import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import FormContainer from "../components/FormContainer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { supabase } from "../services/supabase";
import { hashSecret } from "../utils/crypto";
import { isStrongPassword } from "../utils/validators";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("validating"); // validating | valid | invalid | success
  const [formData, setFormData] = useState({ newPassword: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    validateToken();
  }, [token]);

  async function validateToken() {
    const { data } = await supabase
      .from("password_reset_tokens")
      .select("id, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();

    if (!data || data.used_at || new Date(data.expires_at) < new Date()) {
      setStatus("invalid");
    } else {
      setStatus("valid");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "Ingresa la nueva contraseña.";
    } else if (!isStrongPassword(formData.newPassword)) {
      newErrors.newPassword = "La contraseña debe tener mínimo 8 caracteres.";
    }

    if (!formData.confirm) {
      newErrors.confirm = "Confirma la contraseña.";
    } else if (formData.newPassword !== formData.confirm) {
      newErrors.confirm = "Las contraseñas no coinciden.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      // Re-validar el token antes de aplicar el cambio.
      const { data: tokenRow } = await supabase
        .from("password_reset_tokens")
        .select("id, parent_id, expires_at, used_at")
        .eq("token", token)
        .maybeSingle();

      if (!tokenRow || tokenRow.used_at || new Date(tokenRow.expires_at) < new Date()) {
        setStatus("invalid");
        return;
      }

      const hashedPassword = await hashSecret(formData.newPassword);

      // Actualizar la contraseña del padre.
      const { error: updateError } = await supabase
        .from("parents")
        .update({ password: hashedPassword })
        .eq("id", tokenRow.parent_id);

      if (updateError) throw updateError;

      // Marcar el token como usado.
      await supabase
        .from("password_reset_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenRow.id);

      setStatus("success");
      setTimeout(() => navigate("/login-parent"), 3000);
    } catch {
      setErrors({ general: "Ocurrió un error. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  if (status === "validating") {
    return (
      <FormContainer title="Verificando enlace..." subtitle="">
        <p className="dashboard-subtitle" style={{ textAlign: "center" }}>Un momento...</p>
      </FormContainer>
    );
  }

  if (status === "invalid") {
    return (
      <FormContainer title="Enlace inválido" subtitle="Este enlace ya fue usado o expiró.">
        <p className="link-row">
          <Link to="/forgot-password">Solicitar un nuevo enlace</Link>
        </p>
        <p className="link-row">
          <Link to="/login-parent">Volver al inicio de sesión</Link>
        </p>
      </FormContainer>
    );
  }

  if (status === "success") {
    return (
      <FormContainer title="¡Contraseña actualizada!" subtitle="Serás redirigido al inicio de sesión en segundos.">
        <p className="success-text" style={{ textAlign: "center" }}>✅ Tu contraseña fue cambiada correctamente.</p>
        <p className="link-row"><Link to="/login-parent">Ir al inicio de sesión →</Link></p>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta."
    >
      <form onSubmit={handleSubmit}>
        <InputField
          label="Nueva contraseña *"
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
        />
        {errors.newPassword && <p className="error-text">{errors.newPassword}</p>}

        <InputField
          label="Confirmar contraseña *"
          type="password"
          name="confirm"
          value={formData.confirm}
          onChange={handleChange}
          placeholder="Repite la contraseña"
        />
        {errors.confirm && <p className="error-text">{errors.confirm}</p>}

        <Button type="submit" text={loading ? "Guardando..." : "Guardar contraseña"} />

        {errors.general && <p className="error-text">{errors.general}</p>}

        <p className="link-row">
          <Link to="/login-parent">Volver al inicio de sesión</Link>
        </p>
      </form>
    </FormContainer>
  );
}

export default ResetPassword;
