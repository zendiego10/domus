function FormContainer({ title, subtitle, children }) {
  return (
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