function Button({ text, type = "button", onClick }) {
  return (
    // Boton reutilizable para acciones primarias en formularios y pantallas.
    <button className="primary-btn" type={type} onClick={onClick}>
      {text}
    </button>
  );
}

export default Button;
