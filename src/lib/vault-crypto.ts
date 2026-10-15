/**
 * Cifrado de la bóveda en el navegador (Web Crypto).
 * - Llave: PBKDF2-SHA256 sobre la clave maestra + sal aleatoria.
 * - Cifrado: AES-256-GCM con IV aleatorio por registro (autenticado: detecta
 *   cualquier alteración del texto cifrado).
 * La clave maestra y la llave derivada nunca salen del navegador.
 */

export const ITERATIONS = 600000;
const CHECK_TEXT = "PDC-ACCESOS-OK";

export interface Acceso {
  app: string;
  usuario: string;
  clave: string;
  url: string;
  notas: string;
}

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomB64(len: number): string {
  return toB64(crypto.getRandomValues(new Uint8Array(len)));
}

export async function deriveKey(password: string, saltB64: string, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromB64(saltB64), iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptText(key: CryptoKey, text: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return { iv: toB64(iv), ciphertext: toB64(ct) };
}

export async function decryptText(key: CryptoKey, ivB64: string, ctB64: string): Promise<string> {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(ivB64) }, key, fromB64(ctB64));
  return new TextDecoder().decode(pt);
}

/** Crea los parámetros iniciales: sal + verificador cifrado con la nueva clave. */
export async function createVaultMeta(password: string) {
  const salt = randomB64(16);
  const key = await deriveKey(password, salt, ITERATIONS);
  const check = await encryptText(key, CHECK_TEXT);
  return { meta: { salt, iterations: ITERATIONS, check_iv: check.iv, check_ct: check.ciphertext }, key };
}

/** Devuelve la llave si la clave maestra es correcta; null si no. */
export async function unlockVault(
  password: string,
  meta: { salt: string; iterations: number; check_iv: string; check_ct: string },
): Promise<CryptoKey | null> {
  try {
    const key = await deriveKey(password, meta.salt, meta.iterations);
    const text = await decryptText(key, meta.check_iv, meta.check_ct);
    return text === CHECK_TEXT ? key : null;
  } catch {
    return null; // AES-GCM falla la autenticación con una llave equivocada
  }
}

export async function encryptAcceso(key: CryptoKey, a: Acceso) {
  return encryptText(key, JSON.stringify(a));
}

export async function decryptAcceso(key: CryptoKey, iv: string, ct: string): Promise<Acceso> {
  const raw = JSON.parse(await decryptText(key, iv, ct)) as Partial<Acceso>;
  return {
    app: raw.app ?? "", usuario: raw.usuario ?? "", clave: raw.clave ?? "",
    url: raw.url ?? "", notas: raw.notas ?? "",
  };
}
