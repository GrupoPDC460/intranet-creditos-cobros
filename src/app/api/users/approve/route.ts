import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { approveRequest } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  let id = "";
  try {
    const body = (await req.json()) as { id?: string };
    id = typeof body.id === "string" ? body.id : "";
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });
  try {
    const creds = await approveRequest(id);
    if (!creds) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
    return NextResponse.json({ ok: true, ...creds });
  } catch {
    return NextResponse.json({ error: "No se pudo aprobar." }, { status: 500 });
  }
}
