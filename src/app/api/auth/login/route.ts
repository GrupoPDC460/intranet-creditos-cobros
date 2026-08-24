import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  checkPassword,
  createSessionToken,
  sessionMaxAge,
} from "@/lib/auth";
import { getUserByLogin, usersConfigured } from "@/lib/users";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let password = "";
  let login = "";
  try {
    const body = (await req.json()) as { password?: string; username?: string };
    password = typeof body.password === "string" ? body.password : "";
    login = typeof body.username === "string" ? body.username.trim() : "";
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  let session: { sub: string; role: string; mc?: boolean } | null = null;

  // 1) Administrador maestro por variable de entorno (evita bloqueos).
  const expectedUser = process.env.ADMIN_USER;
  const userMatches =
    !expectedUser || login.toLowerCase() === expectedUser.trim().toLowerCase();
  if (process.env.ADMIN_PASSWORD && userMatches && checkPassword(password)) {
    session = { sub: expectedUser || "admin", role: "admin" };
  }

  // 2) Usuario registrado en la tabla.
  if (!session && usersConfigured() && login) {
    try {
      const user = await getUserByLogin(login);
      if (user && user.password_hash && verifyPassword(password, user.password_hash)) {
        session = { sub: user.username, role: user.role, mc: user.must_change_password };
      }
    } catch {
      // Si falla la consulta, se trata como credenciales inválidas.
    }
  }

  if (!session) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos." },
      { status: 401 },
    );
  }

  const token = await createSessionToken(session.sub, session.role, session.mc);
  const res = NextResponse.json({ ok: true, role: session.role, mustChange: !!session.mc });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge(),
  });
  return res;
}
