import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { createAlbum, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let name = "", description = "";
  try { const b = (await req.json()) as { name?: string; description?: string }; name = b.name ?? ""; description = b.description ?? ""; }
  catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!name.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 422 });
  try { const album = await createAlbum(name, description); return NextResponse.json({ ok: true, album }); }
  catch { return NextResponse.json({ error: "No se pudo crear el álbum." }, { status: 500 }); }
}
