// Pruebas de integración de GET /api/children/:id/progress.
// Recorren las capas api → domain con peticiones HTTP reales a la app Express.
// La capa de datos se reemplaza por repositorios falsos para no depender de Supabase.
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/backend/data/childRepository.js", () => ({
  findChildById: vi.fn(),
  findRedemptionsByChild: vi.fn(),
}));
vi.mock("../../src/backend/data/taskRepository.js", () => ({
  findTasksByChild: vi.fn(),
  findTaskById: vi.fn(),
}));

const childRepository = await import("../../src/backend/data/childRepository.js");
const taskRepository = await import("../../src/backend/data/taskRepository.js");
const { default: app } = await import("../../src/backend/api/app.js");

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/children/:id/progress", () => {
  it("devuelve puntos, nivel e insignias del hijo", async () => {
    childRepository.findChildById.mockResolvedValue({ id: 7, parent_id: 1 });
    childRepository.findRedemptionsByChild.mockResolvedValue([{ points_spent: 50 }]);
    taskRepository.findTasksByChild.mockResolvedValue([
      { status: "completed", points: 100, completed_at: "2026-10-20T20:00:00Z" },
      { status: "completed", points: 100, completed_at: "2026-10-19T20:00:00Z" },
      { status: "pending", points: 40, completed_at: null },
    ]);

    const res = await request(app).get("/api/children/7/progress");

    expect(res.status).toBe(200);
    expect(res.body.childId).toBe(7);
    expect(res.body.points).toBe(150);
    expect(res.body.level).toBe(2);
    expect(res.body.completedTasks).toBe(2);
    expect(res.body.totalTasks).toBe(3);
    expect(res.body.badges).toHaveLength(5);
    expect(childRepository.findChildById).toHaveBeenCalledWith(7);
  });

  it("responde 404 si el hijo no existe", async () => {
    childRepository.findChildById.mockResolvedValue(null);

    const res = await request(app).get("/api/children/999/progress");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("CHILD_NOT_FOUND");
    expect(taskRepository.findTasksByChild).not.toHaveBeenCalled();
  });

  it("responde 400 si el id no es un número válido", async () => {
    const res = await request(app).get("/api/children/abc/progress");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_CHILD_ID");
    expect(childRepository.findChildById).not.toHaveBeenCalled();
  });

  it("responde 500 sin mostrar detalles internos si falla la base de datos", async () => {
    childRepository.findChildById.mockRejectedValue(new Error("conexión perdida con Supabase"));

    const res = await request(app).get("/api/children/7/progress");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "INTERNAL_ERROR" });
  });
});

describe("rutas generales", () => {
  it("GET /api/health confirma que la API está en línea", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("una ruta inexistente responde 404", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
  });
});