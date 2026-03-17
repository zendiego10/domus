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

// Canjea una recompensa para un hijo (descuenta puntos).
export async function redeemReward(rewardId, childId, pointsCost, parentId, rewardTitle) {
  // Validar que el hijo tenga suficientes puntos.
  const currentPoints = await getChildPoints(childId);

  if (currentPoints < pointsCost) {
    throw new Error("INSUFFICIENT_POINTS");
  }

  // Registrar el canje.
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

// Crea una nueva recompensa.
export async function createReward(rewardData) {
  const { data, error } = await supabase
    .from("rewards")
    .insert([
      {
        parent_id: rewardData.parentId,
        title: rewardData.title,
        description: rewardData.description || "",
        icon: rewardData.icon || "🎁",
        points_cost: rewardData.pointsCost,
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
}
