import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FormContainer from "../components/FormContainer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import AvatarPicker from "../components/AvatarPicker";
import { isValidPin } from "../utils/validators";
import { registerChild, updateChildAvatar } from "../services/childService";

function RegisterChild() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    birthDate: "",
    familyCode: codeFromUrl,
    pin: "",
    confirmPin: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Paso 2: selección de avatar
  const [savedChild, setSavedChild] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Paso 3: registro completado
  const [done, setDone] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm() {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Ingresa el nombre.";
    if (!formData.lastName.trim())  newErrors.lastName  = "Ingresa el apellido.";
    if (!formData.username.trim())  newErrors.username  = "Ingresa el nombre de usuario.";
    if (!formData.birthDate)        newErrors.birthDate = "Selecciona la fecha de nacimiento.";

    if (!formData.familyCode.trim()) {
      newErrors.familyCode = "Ingresa el código del padre.";
    } else if (formData.familyCode.trim().length !== 6) {
      newErrors.familyCode = "El código debe tener 6 caracteres.";
    }

    if (!formData.pin) {
      newErrors.pin = "Ingresa el PIN.";
    } else if (!isValidPin(formData.pin)) {
      newErrors.pin = "El PIN debe tener exactamente 4 dígitos.";
    }

    if (!formData.confirmPin) {
      newErrors.confirmPin = "Confirma el PIN.";
    } else if (formData.pin !== formData.confirmPin) {
      newErrors.confirmPin = "Los PIN no coinciden.";
    }

    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);
      const child = await registerChild(formData);
      // Pasar al paso de selección de avatar
      setSavedChild(child);
    } catch (error) {
      const message = error?.message || "";
      if (message.includes("JSON object requested, multiple (or no) rows returned")) {
        setErrors({ familyCode: "El código del padre no existe." });
      } else if (message.includes("children_username_key")) {
        setErrors({ username: "Ese nombre de usuario ya está registrado." });
      } else {
        setErrors({ general: "Ocurrió un error al registrar. Intenta nuevamente." });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarConfirm(avatarId) {
    setAvatarLoading(true);
    try {
      await updateChildAvatar(savedChild.id, avatarId);
      setDone(true);
    } catch {
      // Si falla el avatar, igual completamos el registro
      setDone(true);
    } finally {
      setAvatarLoading(false);
    }
  }

  // Paso 3: registro completo
  if (done) {
    return (
      <FormContainer
        title={`¡Bienvenido, ${savedChild.first_name}! 🎉`}
        subtitle="Tu cuenta fue creada con éxito."
      >
        <p className="success-text" style={{ textAlign: "center", fontSize: 15 }}>
          Ya puedes iniciar sesión con tu usuario y PIN.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link to="/login-child" className="primary-btn" style={{
            display: "block", textAlign: "center", padding: "12px",
            background: "linear-gradient(135deg, #9420D4, #b44de8)",
            color: "#fff", borderRadius: 12, fontWeight: 700,
            textDecoration: "none", fontSize: 15,
          }}>
            Ir a iniciar sesión →
          </Link>
        </div>
      </FormContainer>
    );
  }

  // Paso 2: selección de avatar
  if (savedChild) {
    return (
      <FormContainer
        title={`¡Hola, ${savedChild.first_name}!`}
        subtitle="Un último paso antes de empezar."
      >
        <AvatarPicker
          confirmLabel="Continuar"
          loading={avatarLoading}
          onConfirm={handleAvatarConfirm}
        />
      </FormContainer>
    );
  }

  // Paso 1: formulario de registro
  return (
    <FormContainer
      title="Registro de Hijo"
      subtitle="Regístrate usando el código único del padre."
    >
      <form onSubmit={handleSubmit}>
        <InputField
          label="Nombre"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="Ingresa tu nombre"
        />
        {errors.firstName && <p className="error-text">{errors.firstName}</p>}

        <InputField
          label="Apellido"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Ingresa tu apellido"
        />
        {errors.lastName && <p className="error-text">{errors.lastName}</p>}

        <InputField
          label="Nombre de usuario"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Ejemplo: juanito1"
        />
        {errors.username && <p className="error-text">{errors.username}</p>}

        <InputField
          label="Fecha de nacimiento"
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
        />
        {errors.birthDate && <p className="error-text">{errors.birthDate}</p>}

        <InputField
          label="Código del padre"
          name="familyCode"
          value={formData.familyCode}
          onChange={handleChange}
          placeholder="Ejemplo: A1B2C3"
        />
        {errors.familyCode && <p className="error-text">{errors.familyCode}</p>}

        <InputField
          label="PIN"
          type="password"
          name="pin"
          value={formData.pin}
          onChange={handleChange}
          placeholder="4 dígitos"
        />
        {errors.pin && <p className="error-text">{errors.pin}</p>}

        <InputField
          label="Confirmar PIN"
          type="password"
          name="confirmPin"
          value={formData.confirmPin}
          onChange={handleChange}
          placeholder="Repite el PIN"
        />
        {errors.confirmPin && <p className="error-text">{errors.confirmPin}</p>}

        <Button type="submit" text={loading ? "Registrando..." : "Registrarse"} />

        {errors.general && <p className="error-text">{errors.general}</p>}

        <p className="link-row">
          ¿Ya tienes cuenta? <Link to="/login-child">Inicia sesión</Link>
        </p>
        <p className="link-row">
          ¿Eres padre o madre? <Link to="/register-parent">Regístrate aquí</Link>
        </p>
      </form>
    </FormContainer>
  );
}

export default RegisterChild;
