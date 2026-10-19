import { supabase } from "./supabase";

// Obtiene todos los hijos vinculados a un padre.
export async function getChildrenByParent(parentId) {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("parent_id", parentId);

  if (error) throw error;
  return data || [];
}

// Calcula los puntos actuales de un hijo (ganados - gastados).
export async function getChildPoints(childId) {
  // Puntos ganados por tareas completadas
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("points")
    .eq("child_id", childId)
    .eq("status", "completed");

  if (tasksError) throw tasksError;

  const earned = (tasks || []).reduce((sum, t) => sum + t.points, 0);

  // Puntos gastados en canjes
  const { data: redemptions, error: redemptionsError } = await supabase
    .from("redemptions")
    .select("points_spent")
    .eq("child_id", childId);

  if (redemptionsError) throw redemptionsError;

  const spent = (redemptions || []).reduce((sum, r) => sum + r.points_spent, 0);

  return earned - spent;
}

// Obtiene estadisticas generales del dashboard para un padre.
export async function getDashboardStats(parentId) {
  const children = await getChildrenByParent(parentId);

  // Total de puntos de todos los hijos
  let totalPoints = 0;
  const childrenWithPoints = [];

  for (const child of children) {
    const points = await getChildPoints(child.id);
    totalPoints += points;
    childrenWithPoints.push({ ...child, points });
  }

  // Conteo de tareas
  const { data: allTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("status")
    .eq("parent_id", parentId);

  if (tasksError) throw tasksError;

  const completedTasks = (allTasks || []).filter(t => t.status === "completed").length;
  const pendingTasks = (allTasks || []).filter(t => t.status === "pending").length;

  return {
    totalPoints,
    completedTasks,
    pendingTasks,
    childrenCount: children.length,
    children: childrenWithPoints,
  };
}

// Obtiene el progreso de tareas de un hijo especifico.
export async function getChildProgress(childId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("status")
    .eq("child_id", childId);

  if (error) throw error;

  const total = (data || []).length;
  const completed = (data || []).filter(t => t.status === "completed").length;

  return { total, completed };
}

// Obtiene las ultimas actividades del padre (limitado a 10).
export async function getActivityLog(parentId) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*, children(first_name, last_name)")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}
