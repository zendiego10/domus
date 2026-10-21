// Punto de entrada de la API en Vercel.
// Vercel convierte cada archivo de la carpeta api/ en una función serverless;
// aquí solo se reutiliza la app Express de src/backend/api/app.js.
import app from "../src/backend/api/app.js";

export default app;