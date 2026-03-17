import { supabase } from "./supabase";

// Obtiene todas las tareas de un padre, con datos del hijo asignado.
export async function getTasksByParent(parentId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, children(first_name, last_name)")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Crea una nueva tarea asignada a un hijo.
export async function createTask(taskData) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        parent_id: taskData.parentId,
        child_id: taskData.childId,
        title: taskData.title,
        description: taskData.description || "",
        category: taskData.category,
        points: taskData.points,
        status: "pending",
        due_date: taskData.dueDate || new Date().toISOString().split("T")[0],
      },
    ])
    .select("*, children(first_name, last_name)");

  if (error) throw error;
  return data[0];
}

// Marca una tarea como completada y registra la actividad.
export async function completeTask(task) {
  // Actualiza el status de la tarea.
  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", task.id);

  if (updateError) throw updateError;

  // Registra en el log de actividad.
  const { error: logError } = await supabase
    .from("activity_log")
    .insert([
      {
        parent_id: task.parent_id,
        child_id: task.child_id,
        action: task.title,
        points: task.points,
      },
    ]);

  if (logError) throw logError;

  return true;
}
