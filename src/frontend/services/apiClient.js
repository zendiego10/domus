// apiClient: único punto del navegador que llama a la API REST propia (ADR-001).
// Las vistas usan estas funciones en lugar de consultar Supabase directamente.
// En la semana 15 aquí se agrega el token JWT a cada petición (ADR-002).

// En desarrollo, Vite redirige /api al servidor local (ver vite.config.js).
// En Vercel, la API vive en el mismo dominio, así que la ruta relativa sirve igual.
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Error con el código HTTP y el código de error que devuelve la API.
export class ApiError extends Error {
  constructor(status, code) {
    super(`La API respondió ${status}: ${code}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, body?.error || "REQUEST_FAILED");
  }
  return body;
}

// Progreso del hijo: puntos, nivel, racha e insignias, calculados en el servidor.
export function fetchChildProgress(childId) {
  return request(`/children/${encodeURIComponent(childId)}/progress`);
}