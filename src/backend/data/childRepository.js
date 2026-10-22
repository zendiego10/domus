// ChildRepository: lectura de datos de los hijos (capa de datos).
// Es la única capa que habla con Supabase; el dominio recibe datos ya leídos.
import { supabaseAdmin } from "./supabaseAdmin.js";

// Columnas que se pueden devolver. Nunca se incluye el PIN.
const CHILD_COLUMNS = "id, parent_id, first_name, last_name, username, avatar";

// Devuelve el hijo o null si no existe.
export async function findChildById(childId) {
  const { data, error } = await supabaseAdmin
    .from("children")
    .select(CHILD_COLUMNS)
    .eq("id", childId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Canjes del hijo, necesarios para calcular su saldo de puntos.
// Se leen aquí hasta que RewardRepository se implemente en la semana 15.
export async function findRedemptionsByChild(childId) {
  const { data, error } = await supabaseAdmin
    .from("redemptions")
    .select("id, points_spent")
    .eq("child_id", childId);

  if (error) throw error;
  return data || [];
}