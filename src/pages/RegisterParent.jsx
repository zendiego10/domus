import { useState } from "react";
import { Link } from "react-router-dom";
import FormContainer from "../components/FormContainer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { calculateAge } from "../utils/helpers";
import {
  isAdult,
  isStrongPassword,
  isValidEmail,
  isValidPhone,
} from "../utils/validators";
import { registerParent } from "../services/parentService";

function RegisterParent() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
    acceptedMarketing: false,
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Ingresa el nombre.";
    if (!formData.lastName.trim()) newErrors.lastName = "Ingresa el apellido.";
    if (!formData.username.trim()) newErrors.username = "Ingresa el usuario.";

    if (!formData.email.trim()) {
      newErrors.email = "Ingresa el correo.";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "El correo no es válido.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Ingresa el teléfono.";
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = "El teléfono debe tener solo números.";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Selecciona la fecha de nacimiento.";
    } else {
      const age = calculateAge(formData.birthDate);
      if (!isAdult(age)) {
        newErrors.birthDate = "Debes ser mayor de edad para registrarte.";
      }
    }

    if (!formData.password) {
      newErrors.password = "Ingresa la contraseña.";
    } else if (!isStrongPassword(formData.password)) {
      newErrors.password = "La contraseña debe tener mínimo 8 caracteres.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma la contraseña.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = "Debes aceptar los términos y condiciones.";
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

      const savedParent = await registerParent(formData);

      setSuccessMessage(
        `Registro exitoso. Tu código familiar es: ${savedParent.family_code}`
      );

      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phone: "",
        birthDate: "",
        password: "",
        confirmPassword: "",
        acceptedTerms: false,
        acceptedMarketing: false,
      });

      setErrors({});
    } catch (error) {
      console.error(error);

      const message = error?.message || "";

      if (message.includes("parents_username_key")) {
        setErrors({ username: "Ese nombre de usuario ya está registrado." });
      } else if (message.includes("parents_email_key")) {
        setErrors({ email: "Ese correo ya está registrado." });
      } else {
        setErrors({
          general: "Ocurrió un error al registrar el padre. Intenta nuevamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormContainer
      title="Registro de Padre/Madre"
      subtitle="Crea tu cuenta para administrar a tus hijos y sus tareas."
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
          placeholder="Ejemplo: mama123"
        />
        {errors.username && <p className="error-text">{errors.username}</p>}

        <InputField
          label="Correo electrónico"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
        />
        {errors.email && <p className="error-text">{errors.email}</p>}

        <InputField
          label="Teléfono"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="3001234567"
        />
        {errors.phone && <p className="error-text">{errors.phone}</p>}

        <InputField
          label="Fecha de nacimiento"
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
        />
        {errors.birthDate && <p className="error-text">{errors.birthDate}</p>}

        <InputField
          label="Contraseña"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
        />
        {errors.password && <p className="error-text">{errors.password}</p>}

        <InputField
          label="Confirmar contraseña"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repite la contraseña"
        />
        {errors.confirmPassword && (
          <p className="error-text">{errors.confirmPassword}</p>
        )}

        <div className="checkbox-group">
          <input
            id="acceptedTerms"
            type="checkbox"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleChange}
          />
          <label htmlFor="acceptedTerms">
            Acepto los términos y condiciones
          </label>
        </div>
        {errors.acceptedTerms && (
          <p className="error-text">{errors.acceptedTerms}</p>
        )}

        <div className="checkbox-group">
          <input
            id="acceptedMarketing"
            type="checkbox"
            name="acceptedMarketing"
            checked={formData.acceptedMarketing}
            onChange={handleChange}
          />
          <label htmlFor="acceptedMarketing">
            Acepto recibir información por los canales registrados
          </label>
        </div>

        <Button type="submit" text={loading ? "Registrando..." : "Registrarse"} />

        {errors.general && <p className="error-text">{errors.general}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

        <p className="link-row">
          ¿Ya tienes cuenta? <Link to="/login-parent">Inicia sesión</Link>
        </p>

        <p className="link-row">
          ¿Eres hijo? <Link to="/register-child">Regístrate aquí</Link>
        </p>
      </form>
    </FormContainer>
  );
}

export default RegisterParent;