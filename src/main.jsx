import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "./styles/forms.css";

// Punto de entrada: monta la app React dentro del div #root del index.html.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* StrictMode ayuda a detectar efectos secundarios y malas practicas en desarrollo. */}
    <App />
  </React.StrictMode>
);
