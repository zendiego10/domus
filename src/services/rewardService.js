import { supabase } from "./supabase";
import { getChildPoints } from "./dashboardService";

// Obtiene todas las recompensas creadas por un padre.
export async function getRewardsByParent(parentId) {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("parent_id", parentId)
    .order("points_cost", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Obtiene las recompensas visibles para un hijo específico:
// - Recompensas donde child_id = childId (asignadas a este hijo)
// - Recompensas donde child_id IS NULL (para todos los hijos)
// Si la columna child_id no existe aún (migración pendiente), retorna todas las del padre.
export async function getRewardsForChild(parentId, childId) {
  if (!parentId) return [];

  // Intento principal: filtro con child_id (requiere migración)
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("parent_id", parentId)
    .or(`child_id.eq.${childId},child_id.is.null`)
    .order("points_cost", { ascending: true });

  if (!error) return data || [];

  // Fallback: columna child_id no existe aún — devuelve todas las del padre
  console.warn("getRewardsForChild con filtro falló, usando fallback:", error.message);
  const { data: fallbackData, error: fallbackError } = await supabase
    .from("rewards")
    .select("*")
    .eq("parent_id", parentId)
    .order("points_cost", { ascending: true });

  if (fallbackError) throw fallbackError;
  return fallbackData || [];
}

// Crea una nueva recompensa.
// Si las columnas child_id / expires_at no existen (migración pendiente), reintenta sin ellas.
export async function createReward(rewardData) {
  const fullPayload = {
    parent_id: rewardData.parentId,
    title: rewardData.title,
    description: rewardData.description || "",
    icon: rewardData.icon || "🎁",
    points_cost: rewardData.pointsCost,
    expires_at: rewardData.expiresAt || null,
    child_id: rewardData.childId || null,
  };

  let { data, error } = await supabase.from("rewards").insert([fullPayload]).select();

  if (error) {
    // Columnas nuevas no existen aún — reintenta solo con campos originales
    console.warn("createReward con campos completos falló, usando fallback:", error.message);
    const basicPayload = {
      parent_id: rewardData.parentId,
      title: rewardData.title,
      description: rewardData.description || "",
      icon: rewardData.icon || "🎁",
      points_cost: rewardData.pointsCost,
    };
    const fallback = await supabase.from("rewards").insert([basicPayload]).select();
    if (fallback.error) throw fallback.error;
    data = fallback.data;
  }

  return data[0];
}

// Elimina una recompensa.
export async function deleteReward(rewardId) {
  const { error } = await supabase
    .from("rewards")
    .delete()
    .eq("id", rewardId);

  if (error) throw error;
  return true;
}

// Solicita una recompensa (crea un reward_request).
export async function requestReward(rewardId, childId, parentId) {
  const { data, error } = await supabase
    .from("reward_requests")
    .insert([
      {
        reward_id: rewardId,
        child_id: childId,
        parent_id: parentId,
        status: "pending",
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
}

// Obtiene solicitudes pendientes de un padre.
export async function getPendingRequests(parentId) {
  const { data, error } = await supabase
    .from("reward_requests")
    .select(
      `
      id,
      status,
      requested_at,
      child_id,
      children (
        id,
        first_name,
        last_name
      ),
      rewards (
        id,
        title,
        icon,
        points_cost
      )
      `
    )
    .eq("parent_id", parentId)
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtiene los reward_ids ya solicitados por un hijo (pendientes).
export async function getChildPendingRequests(childId) {
  const { data, error } = await supabase
    .from("reward_requests")
    .select("reward_id")
    .eq("child_id", childId)
    .eq("status", "pending");

  if (error) {
    // Si la tabla no existe aún, retornar vacío en vez de romper
    console.warn("reward_requests query failed (table may not exist yet):", error.message);
    return [];
  }
  return (data || []).map((r) => r.reward_id);
}

// Aprueba una solicitud y efectúa el canje.
export async function approveRequest(requestId, childId, pointsCost, parentId, rewardTitle, rewardId) {
  const currentPoints = await getChildPoints(childId);

  if (currentPoints < pointsCost) {
    throw new Error("INSUFFICIENT_POINTS");
  }

  // Actualizar solicitud a aprobada.
  const { error: updateError } = await supabase
    .from("reward_requests")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (updateError) throw updateError;

  // Registrar el canje en redemptions.
  const { error: redeemError } = await supabase
    .from("redemptions")
    .insert([
      {
        reward_id: rewardId,
        child_id: childId,
        points_spent: pointsCost,
      },
    ]);

  if (redeemError) throw redeemError;

  // Registrar en actividad (como puntos negativos).
  const { error: logError } = await supabase
    .from("activity_log")
    .insert([
      {
        parent_id: parentId,
        child_id: childId,
        action: `Canjeó: ${rewardTitle}`,
        points: -pointsCost,
      },
    ]);

  if (logError) throw logError;

  return true;
}

// Rechaza una solicitud.
export async function rejectRequest(requestId) {
  const { error } = await supabase
    .from("reward_requests")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) throw error;
  return true;
}
