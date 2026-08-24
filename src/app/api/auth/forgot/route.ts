import { NextResponse } from "next/server";
import { requestReset, usersConfigured } from "@/lib/users";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!usersConfigured()) return NextResponse.json({ ok: true });
  let email = "";
  try { email = (((await req.json()) as { email?: string }).email ?? "").trim().toLowerCase(); }
  catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  // Respuesta uniforme para no revelar qué correos existen.
  try { if (email) await requestReset(email); } catch { /* noop */ }
  return NextResponse.json({ ok: true });
}
