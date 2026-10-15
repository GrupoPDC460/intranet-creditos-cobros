/**
 * Cifrado de la bóveda en el navegador (Web Crypto).
 *
 * Modelo de llaves:
 * - Los accesos se cifran con una LLAVE INTERNA aleatoria (AES-256-GCM).
 * - Esa llave interna se guarda una vez por persona ("ranura"), cifrada con una
 *   llave derivada de la clave personal (PBKDF2-SHA256).
 * - Así cada quien entra con su propia clave, y quien tiene acceso puede asignarle
 *   una clave nueva a otro sin perder información.
 * Las claves personales y la llave interna nunca salen del navegador.
 */

export const ITERATIONS = 600000;

export interface Acceso {
  app: string;
  usuario: string;
  clave: string;
  url: string;
  notas: string;
}

export interface Slot {
  salt: string;
  iterations: number;
  wrap_iv: string;
  wrapped_key: string;
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

async function derivar(password: string, saltB64: string, iterations: number): Promise<CryptoKey> {
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

/** Llave interna nueva (solo al crear la bóveda). */
export function nuevaLlaveInterna(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function llaveDesdeInterna(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Crea una ranura: la llave interna cifrada con la clave de una persona. */
export async function crearSlot(password: string, interna: Uint8Array): Promise<Slot> {
  const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
  const kek = await derivar(password, salt, ITERATIONS);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kek, interna);
  return { salt, iterations: ITERATIONS, wrap_iv: toB64(iv), wrapped_key: toB64(ct) };
}

/** Abre una ranura con la clave personal; null si la clave no es correcta. */
export async function abrirSlot(
  password: string,
  slot: Slot,
): Promise<{ interna: Uint8Array; llave: CryptoKey } | null> {
  try {
    const kek = await derivar(password, slot.salt, slot.iterations);
    const raw = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(slot.wrap_iv) }, kek, fromB64(slot.wrapped_key)),
    );
    if (raw.length !== 32) return null;
    return { interna: raw, llave: await llaveDesdeInterna(raw) };
  } catch {
    return null; // AES-GCM rechaza una clave equivocada
  }
}

export async function encryptAcceso(key: CryptoKey, a: Acceso): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(a)),
  );
  return { iv: toB64(iv), ciphertext: toB64(ct) };
}

export async function decryptAcceso(key: CryptoKey, iv: string, ct: string): Promise<Acceso> {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, key, fromB64(ct));
  const raw = JSON.parse(new TextDecoder().decode(pt)) as Partial<Acceso>;
  return {
    app: raw.app ?? "", usuario: raw.usuario ?? "", clave: raw.clave ?? "",
    url: raw.url ?? "", notas: raw.notas ?? "",
  };
}

/** Clave temporal legible para asignar a otra persona (se entrega en persona). */
export function claveTemporal(): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0/I/1 para evitar confusiones
  const b = crypto.getRandomValues(new Uint8Array(12));
  const s = Array.from(b, (x) => abc[x % abc.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}
