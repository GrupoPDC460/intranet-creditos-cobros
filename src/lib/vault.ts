/**
 * Bóveda de accesos — control de acceso y datos (solo servidor).
 *
 * Seguridad:
 * - Las contraseñas se cifran EN EL NAVEGADOR con una clave maestra (AES-256-GCM,
 *   llave derivada con PBKDF2-SHA256). El servidor y la base solo ven texto cifrado.
 * - Acceso por identidad exacta, nunca por rol: el administrador maestro (cuenta
 *   de entorno) y los usuarios listados en `vault_members`. Otros admins no la ven.
 * - Toda verificación se hace en el servidor; ocultar la tarjeta es solo cosmético.
 */
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/require-admin";
import { getUserByLogin, usersConfigured } from "@/lib/users";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: { persistSession: false },
      global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) },
    },
  );
}

/** Login del administrador maestro (variable de entorno). */
function masterLogin(): string {
  return (process.env.ADMIN_USER || "admin").trim().toLowerCase();
}

/**
 * Devuelve el login de la sesión si puede usar la bóveda, o null.
 * - Admin maestro: el token lo emite solo el login por variable de entorno, y no
 *   existe como fila en app_users.
 * - Miembro: usuario activo en app_users y listado en vault_members.
 */
export async function vaultUser(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.mc) return null;
  if (!usersConfigured()) return null;
  const login = session.sub.trim().toLowerCase();

  try {
    const user = await getUserByLogin(login);
    if (!user) {
      // Sin fila en la base: solo el maestro llega aquí con rol admin.
      return session.role === "admin" && login === masterLogin() ? login : null;
    }
    if (!user.active) return null;
    const { data } = await db()
      .from("vault_members")
      .select("login")
      .eq("login", user.username.toLowerCase())
      .limit(1);
    return data && data.length ? user.username.toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function audit(login: string, action: string, entryId?: string | null) {
  try {
    await db().from("vault_audit").insert({ login, action, entry_id: entryId ?? null });
  } catch {
    // La bitácora no debe tumbar la operación principal.
  }
}

export interface VaultMeta {
  salt: string;
  iterations: number;
  check_iv: string;
  check_ct: string;
}

export interface VaultEntry {
  id: string;
  iv: string;
  ciphertext: string;
  updated_at: string;
  updated_by: string | null;
}

export async function getMeta(): Promise<VaultMeta | null> {
  const { data } = await db()
    .from("vault_meta")
    .select("salt, iterations, check_iv, check_ct")
    .eq("id", 1)
    .maybeSingle();
  return (data as VaultMeta) || null;
}

export async function createMeta(meta: VaultMeta): Promise<boolean> {
  // Solo se puede crear una vez: si ya existe, no se sobrescribe.
  const { error } = await db().from("vault_meta").insert({ id: 1, ...meta });
  return !error;
}

export async function listEntries(): Promise<VaultEntry[]> {
  const { data } = await db()
    .from("vault_entries")
    .select("id, iv, ciphertext, updated_at, updated_by")
    .order("created_at", { ascending: true });
  return (data as VaultEntry[]) || [];
}

export async function createEntry(iv: string, ciphertext: string, by: string) {
  const { data, error } = await db()
    .from("vault_entries")
    .insert({ iv, ciphertext, updated_by: by })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateEntry(id: string, iv: string, ciphertext: string, by: string) {
  const { error } = await db()
    .from("vault_entries")
    .update({ iv, ciphertext, updated_by: by, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEntry(id: string) {
  const { error } = await db().from("vault_entries").delete().eq("id", id);
  if (error) throw error;
}

/** Validación de bloques cifrados (base64, tamaños razonables). */
export function validCipher(iv: unknown, ct: unknown): iv is string {
  return (
    typeof iv === "string" &&
    typeof ct === "string" &&
    /^[A-Za-z0-9+/=]{16,24}$/.test(iv) &&
    /^[A-Za-z0-9+/=]+$/.test(ct) &&
    ct.length > 0 &&
    ct.length < 20000
  );
}
