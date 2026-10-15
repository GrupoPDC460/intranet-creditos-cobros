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

export interface SlotRow {
  login: string;
  salt: string;
  iterations: number;
  wrap_iv: string;
  wrapped_key: string;
  must_change: boolean;
}

export interface Miembro {
  login: string;
  nombre: string;
  tieneClave: boolean;
  temporal: boolean;
}

/** Login con el que el administrador maestro aparece en la bóveda. */
export function loginMaestro(): string {
  return masterLogin();
}

export async function getSlot(login: string): Promise<SlotRow | null> {
  const { data } = await db()
    .from("vault_keyslots")
    .select("login, salt, iterations, wrap_iv, wrapped_key, must_change")
    .eq("login", login)
    .maybeSingle();
  return (data as SlotRow) || null;
}

export async function countSlots(): Promise<number> {
  const { count } = await db().from("vault_keyslots").select("login", { count: "exact", head: true });
  return count || 0;
}

export async function upsertSlot(
  login: string,
  slot: { salt: string; iterations: number; wrap_iv: string; wrapped_key: string },
  mustChange: boolean,
  by: string,
) {
  const { error } = await db().from("vault_keyslots").upsert({
    login, ...slot, must_change: mustChange, updated_by: by, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Personas con derecho a la bóveda: el maestro + los miembros autorizados. */
export async function listarMiembros(): Promise<Miembro[]> {
  const cli = db();
  const [{ data: miembros }, { data: slots }] = await Promise.all([
    cli.from("vault_members").select("login"),
    cli.from("vault_keyslots").select("login, must_change"),
  ]);
  const logins = [masterLogin(), ...((miembros || []) as { login: string }[]).map((m) => m.login)];
  const unicos = Array.from(new Set(logins));
  const { data: users } = await cli.from("app_users").select("username, full_name").in("username", unicos);
  const nombres = new Map(((users || []) as { username: string; full_name: string | null }[]).map((u) => [u.username, u.full_name]));
  const porSlot = new Map(((slots || []) as { login: string; must_change: boolean }[]).map((x) => [x.login, x.must_change]));
  return unicos.map((login) => ({
    login,
    nombre: login === masterLogin() ? "Administrador (Daniel Monge)" : nombres.get(login) || login,
    tieneClave: porSlot.has(login),
    temporal: porSlot.get(login) === true,
  }));
}

/** Validación de una ranura recibida del navegador. */
export function validSlot(x: unknown): x is { salt: string; iterations: number; wrap_iv: string; wrapped_key: string } {
  const s = x as Record<string, unknown> | null;
  return !!s &&
    typeof s.salt === "string" && /^[A-Za-z0-9+/=]{20,64}$/.test(s.salt) &&
    typeof s.iterations === "number" && s.iterations >= 300000 && s.iterations <= 5000000 &&
    typeof s.wrap_iv === "string" && /^[A-Za-z0-9+/=]{16,24}$/.test(s.wrap_iv) &&
    typeof s.wrapped_key === "string" && /^[A-Za-z0-9+/=]{40,80}$/.test(s.wrapped_key);
}

export interface VaultEntry {
  id: string;
  iv: string;
  ciphertext: string;
  updated_at: string;
  updated_by: string | null;
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
