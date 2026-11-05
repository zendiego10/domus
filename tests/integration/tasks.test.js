// Pruebas de integración de POST /api/tasks/:id/complete.
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
  completeTask: vi.fn(),
}));

const taskRepository = await import("../../src/backend/data/taskRepository.js");
const { default: app } = await import("../../src/backend/api/app.js");

const pendingTask = { id: 5, parent_id: 1, child_id: 11, title: "Tender la cama", status: "pending", points: 20 };

function dbError(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/tasks/:id/complete", () => {
  it("completa la tarea con la función transaccional", async () => {
    taskRepository.findTaskById.mockResolvedValue(pendingTask);
    taskRepository.completeTask.mockResolvedValue({ ...pendingTask, status: "completed" });

    const res = await request(app).post("/api/tasks/5/complete").send({ childId: 11 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(taskRepository.completeTask).toHaveBeenCalledWith(5);
  });

  it("responde 400 si el id de la tarea no es válido", async () => {
    const res = await request(app).post("/api/tasks/abc/complete").send({ childId: 11 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_TASK_ID");
    expect(taskRepository.findTaskById).not.toHaveBeenCalled();
  });

  it("responde 400 si no llega childId en el cuerpo", async () => {
    const res = await request(app).post("/api/tasks/5/complete").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_CHILD_ID");
  });

  it("responde 404 si la tarea no existe", async () => {
    taskRepository.findTaskById.mockResolvedValue(null);

    const res = await request(app).post("/api/tasks/999/complete").send({ childId: 11 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("TASK_NOT_FOUND");
    expect(taskRepository.completeTask).not.toHaveBeenCalled();
  });

  it("responde 403 si la tarea es de otro hijo", async () => {
    taskRepository.findTaskById.mockResolvedValue(pendingTask);

    const res = await request(app).post("/api/tasks/5/complete").send({ childId: 99 });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("TASK_NOT_OWNED");
    expect(taskRepository.completeTask).not.toHaveBeenCalled();
  });

  it("responde 409 si la máquina de estados no permite completarla", async () => {
    taskRepository.findTaskById.mockResolvedValue({ ...pendingTask, status: "pending_review" });

    const res = await request(app).post("/api/tasks/5/complete").send({ childId: 11 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_TRANSITION");
    expect(taskRepository.completeTask).not.toHaveBeenCalled();
  });

  it("responde 409 si otra petición la completó primero", async () => {
    taskRepository.findTaskById.mockResolvedValue(pendingTask);
    taskRepository.completeTask.mockRejectedValue(dbError("INVALID_TRANSITION"));

    const res = await request(app).post("/api/tasks/5/complete").send({ childId: 11 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_TRANSITION");
  });

  it("responde 500 sin detalles internos si falla la base de datos", async () => {
    taskRepository.findTaskById.mockRejectedValue(new Error("conexión perdida con Supabase"));

    const res = await request(app).post("/api/tasks/5/complete").send({ childId: 11 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "INTERNAL_ERROR" });
  });
});