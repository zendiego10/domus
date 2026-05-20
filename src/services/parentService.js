import { supabase } from "./supabase";
import { generateFamilyCode } from "../utils/helpers";
import { hashSecret, verifySecret } from "../utils/crypto";

async function generateUniqueFamilyCode() {
  // Repite hasta encontrar un codigo familiar que no exista en la tabla parents.
  let isUnique = false;
  let code = "";

  while (!isUnique) {
    code = generateFamilyCode(6);

    const { data, error } = await supabase
      .from("parents")
      .select("id")
      .eq("family_code", code);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      isUnique = true;
    }
  }

  return code;
}

export async function registerParent(parentData) {
  const familyCode = await generateUniqueFamilyCode();
  const hashedPassword = await hashSecret(parentData.password);

  const { data, error } = await supabase
    .from("parents")
    .insert([
      {
        first_name: parentData.firstName,
        last_name: parentData.lastName,
        username: parentData.username,
        email: parentData.email,
        phone: parentData.phone,
        birth_date: parentData.birthDate,
        password: hashedPassword,
        family_code: familyCode,
        accepted_terms: parentData.acceptedTerms,
        accepted_marketing: parentData.acceptedMarketing,
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function loginParent(identifier, password) {
  const { data, error } = await supabase
    .from("parents")
    .select("*")
    .or(`username.eq.${identifier},email.eq.${identifier}`);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("PARENT_NOT_FOUND");
  }

  const parent = data[0];
  const { matches, legacy } = await verifySecret(password, parent.password);

  if (!matches) {
    throw new Error("INVALID_PASSWORD");
  }

  // Migración lazy: si la contraseña estaba en texto plano, la hashea ahora.
  if (legacy) {
    const newHash = await hashSecret(password);
    await supabase
      .from("parents")
      .update({ password: newHash })
      .eq("id", parent.id);
  }

  return parent;
}

export async function findParentByEmail(email) {
  const { data, error } = await supabase
    .from("parents")
    .select("id, email, username")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("EMAIL_NOT_FOUND");
  }

  return data;
}

export async function updateParentProfile(parentId, { firstName, lastName }) {
  const { data, error } = await supabase
    .from("parents")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", parentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function changeParentPassword(parentId, currentPassword, newPassword) {
  const { data, error } = await supabase
    .from("parents")
    .select("password")
    .eq("id", parentId)
    .single();

  if (error) throw error;

  const { matches } = await verifySecret(currentPassword, data.password);
  if (!matches) throw new Error("WRONG_CURRENT_PASSWORD");

  const newHash = await hashSecret(newPassword);
  const { error: updateError } = await supabase
    .from("parents")
    .update({ password: newHash })
    .eq("id", parentId);

  if (updateError) throw updateError;
}
