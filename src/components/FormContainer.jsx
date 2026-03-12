function FormContainer({ title, subtitle, children }) {
  return (
    // Contenedor comun: centra la tarjeta y muestra titulo/subtitulo consistente.
    <div className="page-center">
      <div className="form-card">
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export default FormContainer;
