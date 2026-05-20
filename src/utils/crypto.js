import bcrypt from "bcryptjs";
import { BCRYPT_COST } from "../lib/constants";

export async function hashSecret(value) {
  return bcrypt.hash(value, BCRYPT_COST);
}

// Retorna { matches: boolean, legacy: boolean }.
// Si el hash guardado no es bcrypt (no empieza con $2), compara en texto plano
// y marca legacy=true para que el caller pueda migrar el hash en ese momento.
export async function verifySecret(value, stored) {
  if (stored && stored.startsWith("$2")) {
    const matches = await bcrypt.compare(value, stored);
    return { matches, legacy: false };
  }
  return { matches: stored === value, legacy: true };
}
