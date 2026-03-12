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
