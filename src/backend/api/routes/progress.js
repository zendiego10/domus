// ProgressController: GET /api/children/:id/progress (ADR-004).
// Solo traduce HTTP: valida la entrada, llama al dominio y arma la respuesta.
// No calcula nada; las reglas viven en domain/gamification.js.
import { Router } from "express";
import { getChildProgress } from "../../domain/gamification.js";
import * as childRepository from "../../data/childRepository.js";
import * as taskRepository from "../../data/taskRepository.js";

export const progressRouter = Router();

progressRouter.get("/children/:id/progress", async (req, res, next) => {
  // Los id de la base son números enteros: cualquier otra cosa es una petición inválida.
  const childId = Number(req.params.id);
  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({ error: "INVALID_CHILD_ID" });
  }

  try {
    const progress = await getChildProgress(childId, { childRepository, taskRepository });
    if (!progress) {
      return res.status(404).json({ error: "CHILD_NOT_FOUND" });
    }
    return res.json(progress);
  } catch (err) {
    return next(err);
  }
});