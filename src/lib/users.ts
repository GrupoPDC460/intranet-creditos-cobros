import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/password";

export const ALLOWED_DOMAIN = "@grupopdc.com";

export interface AppUser {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  full_name: string | null;
  role: string;
  active: boolean;
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

/** Busca por correo o por usuario (exacto, sin distinguir may/min). */
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

/** Genera un usuario único a partir del correo (parte antes de la @). */
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

/** Crea un usuario miembro. Devuelve el usuario generado (sin el hash). */
export async function createUser(input: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<{ username: string; email: string }> {
  const email = input.email.trim().toLowerCase();
  const username = await generateUsername(email);
  const db = admin();
  const { error } = await db.from("app_users").insert({
    email,
    username,
    password_hash: hashPassword(input.password),
    full_name: input.fullName?.trim() || null,
    role: "member",
  });
  if (error) throw new Error(error.message);
  return { username, email };
}
