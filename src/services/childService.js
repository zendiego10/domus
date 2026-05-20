import { supabase } from "./supabase";
import { hashSecret, verifySecret } from "../utils/crypto";

async function findParentByFamilyCode(familyCode) {
  const { data, error } = await supabase
    .from("parents")
    .select("id, family_code")
    .eq("family_code", familyCode)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function registerChild(childData) {
  const parent = await findParentByFamilyCode(childData.familyCode);
  const hashedPin = await hashSecret(childData.pin);

  const { data, error } = await supabase
    .from("children")
    .insert([
      {
        parent_id: parent.id,
        first_name: childData.firstName,
        last_name: childData.lastName,
        username: childData.username,
        birth_date: childData.birthDate,
        pin: hashedPin,
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function loginChild(username, pin) {
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("CHILD_NOT_FOUND");
  }

  const { matches, legacy } = await verifySecret(pin, data.pin);

  if (!matches) {
    throw new Error("INVALID_PIN");
  }

  // Migración lazy: si el PIN estaba en texto plano, lo hashea ahora.
  if (legacy) {
    const newHash = await hashSecret(pin);
    await supabase
      .from("children")
      .update({ pin: newHash })
      .eq("id", data.id);
  }

  return data;
}

export async function updateChildProfile(childId, { firstName, lastName }) {
  const { data, error } = await supabase
    .from("children")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", childId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtiene todas las tareas asignadas al hijo, ordenadas por fecha de creacion.
export async function getTasksByChild(childId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtiene las ultimas N tareas del hijo para el preview del dashboard.
export async function getRecentTasksByChild(childId, limit = 5) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Obtiene el historial de canjes del hijo con datos de la recompensa canjeada.
export async function getRedemptionsByChild(childId) {
  const { data, error } = await supabase
    .from("redemptions")
    .select("*, rewards(title, icon, points_cost)")
    .eq("child_id", childId)
    .order("id", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtiene solo el conteo de canjes del hijo (sin traer filas completas).
export async function getRedemptionCount(childId) {
  const { count, error } = await supabase
    .from("redemptions")
    .select("*", { count: "exact", head: true })
    .eq("child_id", childId);

  if (error) throw error;
  return count || 0;
}

// Obtiene el historial de actividad del hijo desde activity_log.
export async function getActivityHistory(childId, limit = 20) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, points, created_at")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
