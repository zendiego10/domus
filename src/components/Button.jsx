function Button({ text, type = "button", onClick }) {
  return (
    <button className="primary-btn" type={type} onClick={onClick}>
      {text}
    </button>
  );
}

export default Button;