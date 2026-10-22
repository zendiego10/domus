// Cliente de Supabase para el servidor (capa de datos).
// Usa la clave de servicio, que tiene acceso total y salta RLS. Por eso:
// - solo existe en el backend, nunca se importa desde src/frontend;
// - sus variables NO llevan el prefijo VITE_, porque Vite publica en el
//   navegador todas las variables que empiezan por VITE_.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor");
}

// El servidor no maneja sesiones de usuario de Supabase: cada petición es independiente.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});