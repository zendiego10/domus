import { supabase } from "./supabase";
import { generateFamilyCode } from "../utils/helpers";

async function generateUniqueFamilyCode() {
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
        password: parentData.password,
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

  if (parent.password !== password) {
    throw new Error("INVALID_PASSWORD");
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