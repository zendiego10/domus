import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FormContainer from "../components/FormContainer";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { isValidPin } from "../utils/validators";
import { registerChild } from "../services/childService";



function RegisterChild() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";

  // Estado del formulario para crear un hijo asociado a un codigo familiar.
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    birthDate: "",
    familyCode: codeFromUrl,
    pin: "",
    confirmPin: "",
  });

  // Errores de validacion/servicio, feedback de exito y estado de carga.
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(event) {
    // Actualiza el estado con el valor del input cambiado.
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    // Valida datos obligatorios y formato del PIN/codigo familiar.
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Ingresa el nombre.";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Ingresa el apellido.";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Ingresa el nombre de usuario.";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Selecciona la fecha de nacimiento.";
    }

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

    // Ejecuta validaciones locales antes de enviar al backend.
    const validationErrors = validateForm();
    setErrors(validationErrors);
    setSuccessMessage("");

    if (Object.keys(validationErrors).length > 0) return;
    
    try {
      setLoading(true);

      // Registra al hijo y lo enlaza con el padre por familyCode.
      const savedChild = await registerChild(formData);

      setSuccessMessage(
        `Registro exitoso. El hijo ${savedChild.first_name} quedó asociado correctamente al padre.`
      );

      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        birthDate: "",
        familyCode: "",
        pin: "",
        confirmPin: "",
      });

      setErrors({});
    } catch (error) {
      console.error(error);

      // Traduce errores de backend a mensajes legibles.
      const message = error?.message || "";

      if (message.includes("JSON object requested, multiple (or no) rows returned")) {
        setErrors({ familyCode: "El código del padre no existe." });
      } else if (message.includes("children_username_key")) {
        setErrors({ username: "Ese nombre de usuario ya está registrado." });
      } else {
        setErrors({
          general: "Ocurrió un error al registrar el hijo. Intenta nuevamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

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
        {errors.confirmPin && (
          <p className="error-text">{errors.confirmPin}</p>
        )}

        <Button type="submit" text={loading ? "Registrando..." : "Registrarse"} />
        
        {errors.general && <p className="error-text">{errors.general}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

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
