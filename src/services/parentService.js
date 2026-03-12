import { supabase } from "./supabase";
import { generateFamilyCode } from "../utils/helpers";

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

    // Si no devuelve filas, el codigo es libre y se puede usar.
    if (!data || data.length === 0) {
      isUnique = true;
    }
  }

  return code;
}

export async function registerParent(parentData) {
  // Primero genera el codigo familiar para enlazar futuros hijos.
  const familyCode = await generateUniqueFamilyCode();

  // Inserta el registro del padre/madre en Supabase.
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

  // Retorna el registro creado para usarlo en UI (ej: mostrar family_code).
  return data[0];
}

export async function loginParent(identifier, password) {
  // Permite iniciar sesion con username o email.
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

  // Compara credencial enviada contra el campo password almacenado.
  if (parent.password !== password) {
    throw new Error("INVALID_PASSWORD");
  }

  return parent;
}

export async function findParentByEmail(email) {
  // Verifica si existe un padre con ese correo para flujo de recuperar clave.
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
