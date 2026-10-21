// TaskRepository: lectura de tareas (capa de datos).
// Las escrituras de varias tablas llegan como funciones transaccionales (ADR-003).
import { supabaseAdmin } from "./supabaseAdmin.js";

// Tareas de un hijo con los campos que usa la gamificación.
export async function findTasksByChild(childId) {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("id, title, status, points, completed_at")
    .eq("child_id", childId);

  if (error) throw error;
  return data || [];
}

// Devuelve una tarea o null si no existe. La usa la API para conocer
// su estado actual antes de validar la acción con TaskStateMachine.
export async function findTaskById(taskId) {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("id, parent_id, child_id, title, status, points, completed_at")
    .eq("id", taskId)
    .maybeSingle();

  if (error) throw error;
  return data;
}


// Completa una tarea con la función transaccional complete_task (ADR-003).
// La base de datos actualiza la tarea y registra el historial en una sola
// transacción: o se hacen las dos escrituras, o no se hace ninguna.
const COMPLETE_TASK_ERRORS = ["TASK_NOT_FOUND", "INVALID_TRANSITION"];

export async function completeTask(taskId) {
  const { data, error } = await supabaseAdmin.rpc("complete_task", { p_task_id: taskId });

  if (error) {
    // La función avisa con estos códigos cuando la tarea no existe o ya no está pendiente.
    if (COMPLETE_TASK_ERRORS.includes(error.message)) {
      const err = new Error(error.message);
      err.code = error.message;
      throw err;
    }
    throw error;
  }
  return data;
}