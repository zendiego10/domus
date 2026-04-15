import { supabase } from "./supabase";

async function findParentByFamilyCode(familyCode) {
  // Busca al padre/madre dueño del codigo familiar para crear la relacion.
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
  // Paso 1: valida que el codigo familiar pertenezca a un padre existente.
  const parent = await findParentByFamilyCode(childData.familyCode);

  // Paso 2: crea al hijo ligado por parent_id.
  const { data, error } = await supabase
    .from("children")
    .insert([
      {
        parent_id: parent.id,
        first_name: childData.firstName,
        last_name: childData.lastName,
        username: childData.username,
        birth_date: childData.birthDate,
        pin: childData.pin,
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  // Retorna el hijo creado para confirmar en interfaz.
  return data[0];
}

export async function loginChild(username, pin) {
  // Busca al hijo por username (se espera unico).
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

  // Valida que el PIN enviado coincida con el PIN guardado.
  if (data.pin !== pin) {
    throw new Error("INVALID_PIN");
  }

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
    .order("created_at", { ascending: false });

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
