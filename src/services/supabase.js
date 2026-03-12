import { createClient } from "@supabase/supabase-js";

// URL del proyecto en Supabase (backend como servicio).
const supabaseUrl = "https://vcqxiraarzbajscoqjpa.supabase.co";
// Clave publica anonima para operaciones permitidas desde frontend.
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcXhpcmFhcnpiYWpzY29xanBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTg5OTksImV4cCI6MjA4ODc3NDk5OX0.A-8gEMn1gBhb33AtDY8PLynn_qt1bF7OZDPy8Dgq3RY";

// Cliente compartido para consultar e insertar datos en tablas.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
