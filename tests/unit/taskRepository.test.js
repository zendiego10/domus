// Pruebas unitarias de TaskRepository.completeTask (ADR-003).
// Se reemplaza el cliente de Supabase para revisar cómo se llama a la
// función transaccional y cómo se traducen sus errores.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/backend/data/supabaseAdmin.js", () => ({
  supabaseAdmin: { rpc: vi.fn() },
}));

const { supabaseAdmin } = await import("../../src/backend/data/supabaseAdmin.js");
const { completeTask } = await import("../../src/backend/data/taskRepository.js");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("completeTask", () => {
  it("llama a la función complete_task con el id de la tarea", async () => {
    supabaseAdmin.rpc.mockResolvedValue({ data: { id: 17, status: "completed" }, error: null });

    const task = await completeTask(17);

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith("complete_task", { p_task_id: 17 });
    expect(task.status).toBe("completed");
  });

  it("traduce INVALID_TRANSITION cuando la tarea ya no está pendiente", async () => {
    supabaseAdmin.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "INVALID_TRANSITION" } });

    await expect(completeTask(17)).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("traduce TASK_NOT_FOUND cuando la tarea no existe", async () => {
    supabaseAdmin.rpc.mockResolvedValue({ data: null, error: { code: "P0002", message: "TASK_NOT_FOUND" } });

    await expect(completeTask(999)).rejects.toMatchObject({ code: "TASK_NOT_FOUND" });
  });

  it("deja pasar cualquier otro error de la base de datos", async () => {
    supabaseAdmin.rpc.mockResolvedValue({ data: null, error: { code: "08006", message: "connection failure" } });

    await expect(completeTask(17)).rejects.toMatchObject({ message: "connection failure" });
  });
});