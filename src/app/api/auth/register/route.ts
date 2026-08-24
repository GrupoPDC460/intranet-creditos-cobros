import { NextResponse } from "next/server";
import { ALLOWED_DOMAIN, createUser, emailTaken, usersConfigured } from "@/lib/users";
import { generatePassword } from "@/lib/password";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!usersConfigured()) {
    return NextResponse.json(
      { error: "El registro no está disponible. Falta configurar la base de datos." },
      { status: 503 },
    );
  }

  let email = "";
  let fullName = "";
  try {
    const body = (await req.json()) as { email?: string; fullName?: string };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    fullName = typeof body.fullName === "string" ? body.fullName : "";
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 422 });
  }
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return NextResponse.json(
      { error: `Solo se permiten correos ${ALLOWED_DOMAIN}.` },
      { status: 422 },
    );
  }

  if (await emailTaken(email)) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo. Inicia sesión." },
      { status: 409 },
    );
  }

  const password = generatePassword(10);
  try {
    const { username } = await createUser({ email, password, fullName });
    return NextResponse.json({ ok: true, username, password, email });
  } catch {
    return NextResponse.json({ error: "No se pudo crear la cuenta." }, { status: 500 });
  }
}
