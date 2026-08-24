import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { deleteUser } from "@/lib/users";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let id = "";
  try { id = ((await req.json()) as { id?: string }).id ?? ""; } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  try { await deleteUser(id); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 }); }
}
