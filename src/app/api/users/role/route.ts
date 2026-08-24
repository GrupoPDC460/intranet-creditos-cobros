import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { setRole } from "@/lib/users";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let id = "", role = "";
  try {
    const b = (await req.json()) as { id?: string; role?: string };
    id = b.id ?? ""; role = b.role ?? "";
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!id || (role !== "admin" && role !== "member")) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  try { await setRole(id, role as "admin" | "member"); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "No se pudo actualizar el rol." }, { status: 500 }); }
}
