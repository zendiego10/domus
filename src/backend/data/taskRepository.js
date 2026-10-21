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