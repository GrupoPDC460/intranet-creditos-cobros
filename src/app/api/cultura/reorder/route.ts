import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { reorderAlbums, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let items: { id: string; order: number }[] = [];
  try { items = (await req.json()) as { id: string; order: number }[]; }
  catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  try { await reorderAlbums(items); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "No se pudo reordenar." }, { status: 500 }); }
}
