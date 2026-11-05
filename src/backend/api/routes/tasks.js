// TaskController: POST /api/tasks/:id/complete (ADR-001, ADR-003).
// Solo traduce HTTP: valida la entrada, consulta la máquina de estados
// y delega la escritura a la función transaccional complete_task.
import { Router } from "express";
import { assertTransition, ROLES } from "../../domain/taskStateMachine.js";
import * as taskRepository from "../../data/taskRepository.js";

export const tasksRouter = Router();

// Código de error del dominio o de la base → código HTTP.
const HTTP_STATUS = {
  UNKNOWN_ACTION: 400,
  FORBIDDEN_ROLE: 403,
  TASK_NOT_OWNED: 403,
  TASK_NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
};

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

// Cuerpo esperado: { "childId": 11 }
tasksRouter.post("/tasks/:id/complete", async (req, res, next) => {
  const taskId = Number(req.params.id);
  const childId = Number(req.body?.childId);

  if (!isPositiveInt(taskId)) return res.status(400).json({ error: "INVALID_TASK_ID" });
  if (!isPositiveInt(childId)) return res.status(400).json({ error: "INVALID_CHILD_ID" });

  try {
    const task = await taskRepository.findTaskById(taskId);
    if (!task) return res.status(404).json({ error: "TASK_NOT_FOUND" });

    // Mientras no exista el token JWT (ADR-002), el hijo se identifica con childId.
    // La API sí comprueba que la tarea le pertenezca.
    if (task.child_id !== childId) return res.status(403).json({ error: "TASK_NOT_OWNED" });

    // La regla de qué puede hacer el hijo vive en el dominio, no en el navegador (P4).
    assertTransition("complete", ROLES.CHILD, task.status);

    // Una sola transacción: actualiza la tarea y registra el historial (P2).
    const completed = await taskRepository.completeTask(taskId);
    return res.json(completed);
  } catch (err) {
    const status = HTTP_STATUS[err.code];
    if (status) return res.status(status).json({ error: err.code });
    return next(err);
  }
});