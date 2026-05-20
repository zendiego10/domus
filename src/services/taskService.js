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
        due_date: taskData.dueDate || null,
        is_recurring: taskData.isRecurring || false,
        recurrence_frequency: taskData.recurrenceFrequency || null,
      },
    ])
    .select("*, children(first_name, last_name)");

  if (error) throw error;
  return data[0];
}

// Genera la siguiente instancia de tareas recurrentes completadas.
// Llamar después de cargar las tareas del padre (lazy generation).
export async function generateRecurringInstances(parentId, existingTasks) {
  const recurringTemplates = existingTasks.filter(
    (t) => t.is_recurring && t.template_task_id === null && t.status === "completed"
  );

  const newTasks = [];

  for (const template of recurringTemplates) {
    const freq = template.recurrence_frequency;
    if (!freq || !template.due_date) continue;

    const lastDue = new Date(template.due_date);
    const nextDue = new Date(lastDue);
    if (freq === "daily")  nextDue.setDate(nextDue.getDate() + 1);
    if (freq === "weekly") nextDue.setDate(nextDue.getDate() + 7);

    // Solo generar si la siguiente fecha ya es hoy o pasó.
    if (nextDue > new Date()) continue;

    // Verificar que no exista ya una instancia para esa fecha.
    const alreadyExists = existingTasks.some(
      (t) => t.template_task_id === template.id &&
        t.due_date?.slice(0, 10) === nextDue.toISOString().slice(0, 10)
    );
    if (alreadyExists) continue;

    const { data, error } = await supabase
      .from("tasks")
      .insert([{
        parent_id: template.parent_id,
        child_id: template.child_id,
        title: template.title,
        description: template.description,
        category: template.category,
        points: template.points,
        status: "pending",
        due_date: nextDue.toISOString(),
        is_recurring: true,
        recurrence_frequency: freq,
        template_task_id: template.id,
      }])
      .select("*, children(first_name, last_name)");

    if (!error && data?.[0]) newTasks.push(data[0]);
  }

  return newTasks;
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

// Sube la foto de evidencia y cambia el estado a pending_review (sin otorgar puntos aún).
export async function submitTaskWithPhoto(taskId, photoUrl) {
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "pending_review",
      photo_url: photoUrl,
    })
    .eq("id", taskId);

  if (error) throw error;
  return true;
}

// Aprueba una tarea con foto (pending_review → completed) y otorga los puntos.
export async function approveTaskReview(task) {
  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", task.id);

  if (updateError) throw updateError;

  const { error: logError } = await supabase
    .from("activity_log")
    .insert([{
      parent_id: task.parent_id,
      child_id: task.child_id,
      action: task.title,
      points: task.points,
    }]);

  if (logError) throw logError;
  return true;
}

// Rechaza la evidencia de una tarea y la devuelve a estado pendiente.
export async function rejectTaskReview(task, reason = "") {
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "pending",
      photo_url: null,
      rejection_reason: reason || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", task.id);

  if (error) throw error;
  return true;
}

// Elimina una tarea. Si estaba completada, también elimina su entrada en activity_log.
export async function deleteTask(task) {
  if (task.status === "completed") {
    await supabase
      .from("activity_log")
      .delete()
      .eq("child_id", task.child_id)
      .eq("parent_id", task.parent_id)
      .eq("action", task.title);
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", task.id);

  if (error) throw error;
  return true;
}

// Edita los campos de una tarea pendiente. Lanza error si ya está completada.
export async function updateTask(taskId, patch) {
  const { data: current, error: fetchError } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", taskId)
    .single();

  if (fetchError) throw fetchError;
  if (current.status !== "pending") throw new Error("CANNOT_EDIT_COMPLETED");

  const allowed = {};
  if (patch.title       !== undefined) allowed.title       = patch.title;
  if (patch.description !== undefined) allowed.description = patch.description;
  if (patch.category    !== undefined) allowed.category    = patch.category;
  if (patch.points      !== undefined) allowed.points      = patch.points;
  if (patch.dueDate     !== undefined) allowed.due_date    = patch.dueDate || null;
  if (patch.childId     !== undefined) allowed.child_id    = patch.childId;

  const { data, error } = await supabase
    .from("tasks")
    .update(allowed)
    .eq("id", taskId)
    .select("*, children(first_name, last_name)")
    .single();

  if (error) throw error;
  return data;
}

// Revierte una tarea completada a estado pendiente y elimina su registro de actividad.
export async function uncompleteTask(task) {
  // Devuelve la tarea a estado pendiente.
  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      status: "pending",
      completed_at: null,
    })
    .eq("id", task.id);

  if (updateError) throw updateError;

  // Busca el registro de actividad mas reciente asociado a esta tarea.
  const { data: logEntries, error: fetchError } = await supabase
    .from("activity_log")
    .select("id")
    .eq("child_id", task.child_id)
    .eq("parent_id", task.parent_id)
    .eq("action", task.title)
    .order("created_at", { ascending: false })
    .limit(1);

  if (fetchError) throw fetchError;

  // Elimina el registro de actividad si existe.
  if (logEntries && logEntries.length > 0) {
    const { error: deleteError } = await supabase
      .from("activity_log")
      .delete()
      .eq("id", logEntries[0].id);

    if (deleteError) throw deleteError;
  }

  return true;
}
