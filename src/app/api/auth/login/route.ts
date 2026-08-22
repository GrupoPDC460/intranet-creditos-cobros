import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  checkPassword,
  createSessionToken,
  sessionMaxAge,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let password = "";
  let username = "";
  try {
    const body = (await req.json()) as { password?: string; username?: string };
    password = typeof body.password === "string" ? body.password : "";
    username = typeof body.username === "string" ? body.username.trim() : "";
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Autenticación no configurada. Define ADMIN_PASSWORD en el entorno." },
      { status: 503 },
    );
  }

  // Si se define ADMIN_USER, el usuario también debe coincidir (sin distinguir may/min).
  const expectedUser = process.env.ADMIN_USER;
  if (expectedUser && username.toLowerCase() !== expectedUser.trim().toLowerCase()) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge(),
  });
  return res;
}
