import { supabase } from "./supabase";

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

  if (data.pin !== pin) {
    throw new Error("INVALID_PIN");
  }

  return data;
}