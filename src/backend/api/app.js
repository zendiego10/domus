// App Express: arma el servidor de la API REST y registra las rutas (ADR-001).
// Se exporta sin arrancar, para que la usen el servidor local, Vercel y las pruebas.
import express from "express";
import { progressRouter } from "./routes/progress.js";

const app = express();

app.use(express.json());

// Permite comprobar rápido que la API está en línea.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", progressRouter);

// Cualquier ruta que no exista.
app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

// Errores no controlados: se registran en el servidor y al cliente
// solo le llega un mensaje genérico, sin detalles internos.
// Express reconoce este manejador porque recibe 4 parámetros.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

export default app;