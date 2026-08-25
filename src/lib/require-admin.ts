import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "@/lib/auth";
import { getUserByLogin, usersConfigured } from "@/lib/users";

/** Devuelve el payload de sesión si es válido, o null. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/**
 * true si la sesión actual es administradora.
 * El rol se verifica EN VIVO contra la base: así, delegar o quitar admin
 * surte efecto de inmediato, sin necesidad de re-iniciar sesión.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (usersConfigured()) {
    try {
      const user = await getUserByLogin(session.sub);
      if (user) return user.active && user.role === "admin";
    } catch {
      // Si falla la consulta, se cae al rol del token.
    }
  }
  // Sin fila en la base (admin maestro por variable de entorno) → rol del token.
  return session.role === "admin";
}
