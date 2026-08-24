import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/** Hashea una contraseña con scrypt. Formato: scrypt$<salt>$<hash>. */
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

/** Verifica una contraseña contra el hash almacenado (tiempo constante). */
export function verifyPassword(pw: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  try {
    const test = scryptSync(pw, salt, 64);
    const orig = Buffer.from(hashHex, "hex");
    if (test.length !== orig.length) return false;
    return timingSafeEqual(test, orig);
  } catch {
    return false;
  }
}

/** Genera una contraseña fuerte y legible (sin caracteres ambiguos). */
export function generatePassword(length = 10): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  // Garantiza al menos un dígito y una mayúscula.
  return out.slice(0, -2) + (bytes[0] % 9) + "A";
}
