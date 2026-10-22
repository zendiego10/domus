// Arranca la API en tu computador para desarrollo (npm run api).
// En producción no se usa: Vercel ejecuta app.js como función serverless.
import app from "./app.js";

const PORT = Number(process.env.API_PORT) || 3001;

app.listen(PORT, () => {
  console.log(`API de Domus escuchando en http://localhost:${PORT}`);
});