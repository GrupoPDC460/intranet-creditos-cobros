/**
 * Autenticación administrativa mínima y segura.
 *
 * - La contraseña vive en la variable de entorno ADMIN_PASSWORD (nunca en código).
 * - La sesión es un token firmado con HMAC-SHA256 (SESSION_SECRET), httpOnly.
 * - Firmado/verificado con Web Crypto para funcionar en Node y en el middleware Edge.
 *
 * La arquitectura queda lista para reemplazar este proveedor por
 * Microsoft Entra ID / Azure AD sin tocar la UI: basta con emitir el mismo cookie
 * de sesión tras el callback OAuth.
 */

export const SESSION_COOKIE = "pdc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    // Respaldo solo para desarrollo local; en producción SIEMPRE definir SESSION_SECRET.
    "dev-insecure-secret-change-me"
  );
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64url(sig);
}

/** Comparación en tiempo constante para evitar timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type SessionPayload = { sub: string; role: string; exp: number; mc?: boolean };

export async function createSessionToken(
  sub = "admin",
  role = "admin",
  mc = false,
): Promise<string> {
  const payload: SessionPayload = {
    sub,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    ...(mc ? { mc: true } : {}),
  };
  const body = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

/** Verifica el token y devuelve el payload, o null si es inválido/expirado. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(body);
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64url(body)),
    ) as SessionPayload;
    if (!payload.sub || !payload.role) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionMaxAge(): number {
  return SESSION_TTL_SECONDS;
}

/** Verifica la contraseña administrativa contra la variable de entorno. */
export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
