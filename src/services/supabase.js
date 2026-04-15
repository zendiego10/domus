import { createClient } from "@supabase/supabase-js";

// Lee las credenciales desde variables de entorno (seguras y flexibles).
// En desarrollo: se cargan desde .env.local
// En producción (Vercel): se cargan desde las variables del dashboard de Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Valida que las variables necesarias existan (importante para debugging).
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variables de entorno de Supabase no configuradas correctamente");
}

// Cliente compartido para consultar e insertar datos en tablas.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
