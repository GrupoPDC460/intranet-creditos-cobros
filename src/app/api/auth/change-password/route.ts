import { NextResponse } from "next/server";
import { getSession } from "@/lib/require-admin";
import { changeOwnPassword } from "@/lib/users";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (session.role === "admin" && session.sub === (process.env.ADMIN_USER || "admin")) {
    return NextResponse.json(
      { error: "La cuenta de administrador principal se gestiona por variable de entorno." },
      { status: 400 },
    );
  }
  let current = "", next = "";
  try {
    const b = (await req.json()) as { current?: string; next?: string };
    current = b.current ?? ""; next = b.next ?? "";
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (next.length < 8) return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres." }, { status: 422 });
  const r = await changeOwnPassword(session.sub, current, next);
  if (!r.ok) return NextResponse.json({ error: r.error ?? "No se pudo cambiar." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
