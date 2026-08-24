import { createClient } from "@supabase/supabase-js";
import { hashPassword, generatePassword } from "@/lib/password";

export const ALLOWED_DOMAIN = "@grupopdc.com";

export interface AppUser {
  id: string;
  email: string;
  username: string;
  password_hash: string | null;
  full_name: string | null;
  role: string;
  status: string;
  active: boolean;
  reset_requested: boolean;
  must_change_password: boolean;
  created_at: string;
  decided_at: string | null;
}

export function usersConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: { persistSession: false },
      global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) },
    },
  );
}

/** Login: solo usuarios activos con contraseña definida. */
export async function getUserByLogin(login: string): Promise<AppUser | null> {
  const l = login.trim().toLowerCase();
  const db = admin();
  const byEmail = await db
    .from("app_users")
    .select("*")
    .eq("email", l)
    .eq("active", true)
    .limit(1);
  if (byEmail.data && byEmail.data[0]) return byEmail.data[0] as AppUser;
  const byUser = await db
    .from("app_users")
    .select("*")
    .eq("username", l)
    .eq("active", true)
    .limit(1);
  return (byUser.data && (byUser.data[0] as AppUser)) || null;
}

async function exists(field: "email" | "username", value: string): Promise<boolean> {
  const db = admin();
  const { data } = await db.from("app_users").select("id").eq(field, value).limit(1);
  return Boolean(data && data.length);
}

async function generateUsername(email: string): Promise<string> {
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .replace(/^[._-]+|[._-]+$/g, "") || "usuario";
  let candidate = base;
  let n = 1;
  while (await exists("username", candidate)) {
    candidate = `${base}${n}`;
    n += 1;
  }
  return candidate;
}

export async function emailTaken(email: string): Promise<boolean> {
  return exists("email", email.trim().toLowerCase());
}

/** Crea una SOLICITUD de acceso (pendiente de aval del administrador). */
export async function createRequest(input: {
  email: string;
  fullName?: string;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const username = await generateUsername(email);
  const db = admin();
  const { error } = await db.from("app_users").insert({
    email,
    username,
    password_hash: null,
    full_name: input.fullName?.trim() || null,
    role: "member",
    status: "pending",
    active: false,
  });
  if (error) throw new Error(error.message);
}

/** Lista solicitudes/cuentas por estado (para el panel admin). */
export async function listUsers(status?: string): Promise<AppUser[]> {
  const db = admin();
  let q = db.from("app_users").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data as AppUser[]) || [];
}

/** Aprueba una solicitud: genera contraseña, activa la cuenta y devuelve credenciales. */
export async function approveRequest(
  id: string,
): Promise<{ username: string; password: string; email: string } | null> {
  const db = admin();
  const { data: rows } = await db.from("app_users").select("*").eq("id", id).limit(1);
  const user = rows && (rows[0] as AppUser);
  if (!user) return null;
  const password = generatePassword(10);
  const { error } = await db
    .from("app_users")
    .update({
      password_hash: hashPassword(password),
      status: "active",
      active: true,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { username: user.username, password, email: user.email };
}

/** Rechaza una solicitud. */
export async function rejectRequest(id: string): Promise<void> {
  const db = admin();
  const { error } = await db
    .from("app_users")
    .update({ status: "rejected", active: false, decided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Elimina un usuario/solicitud por id. */
export async function deleteUser(id: string): Promise<void> {
  const db = admin();
  const { error } = await db.from("app_users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Restablece la contraseña: genera una nueva, la guarda y la devuelve. */
export async function resetPassword(
  id: string,
): Promise<{ username: string; password: string; email: string } | null> {
  const db = admin();
  const { data: rows } = await db.from("app_users").select("*").eq("id", id).limit(1);
  const user = rows && (rows[0] as AppUser);
  if (!user) return null;
  const password = generatePassword(10);
  const { error } = await db
    .from("app_users")
    .update({
      password_hash: hashPassword(password),
      status: "active",
      active: true,
      reset_requested: false,
      must_change_password: true,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { username: user.username, password, email: user.email };
}

/** El propio usuario cambia su contraseña (verifica la actual). */
export async function changeOwnPassword(
  username: string,
  currentPw: string,
  newPw: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = admin();
  const { data: rows } = await db
    .from("app_users")
    .select("*")
    .eq("username", username)
    .eq("active", true)
    .limit(1);
  const user = rows && (rows[0] as AppUser);
  if (!user || !user.password_hash) {
    return { ok: false, error: "Cuenta no encontrada." };
  }
  const { verifyPassword } = await import("@/lib/password");
  if (!verifyPassword(currentPw, user.password_hash)) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }
  const { error } = await db
    .from("app_users")
    .update({ password_hash: hashPassword(newPw), must_change_password: false })
    .eq("id", user.id);
  if (error) return { ok: false, error: "No se pudo actualizar." };
  return { ok: true };
}

/** El usuario solicita restablecimiento (marca la bandera si existe la cuenta). */
export async function requestReset(email: string): Promise<void> {
  const db = admin();
  await db
    .from("app_users")
    .update({ reset_requested: true })
    .eq("email", email.trim().toLowerCase())
    .eq("active", true);
}

/** Cuenta de pendientes para el administrador: solicitudes + restablecimientos. */
export async function countPending(): Promise<number> {
  const db = admin();
  const pend = await db
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  const resets = await db
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .eq("reset_requested", true);
  return (pend.count || 0) + (resets.count || 0);
}

/** Cambia el rol de un usuario: 'admin' o 'member'. */
export async function setRole(id: string, role: "admin" | "member"): Promise<void> {
  const db = admin();
  const { error } = await db.from("app_users").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
}
