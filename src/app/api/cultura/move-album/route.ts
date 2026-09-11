import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { moveAlbumInto, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let albumId = "", newParentId: string | null = null;
  try {
    const b = (await req.json()) as { albumId?: string; newParentId?: string | null };
    albumId = b.albumId ?? "";
    newParentId = b.newParentId ?? null;
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!albumId) return NextResponse.json({ error: "Falta albumId." }, { status: 400 });
  try {
    await moveAlbumInto(albumId, newParentId);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No se pudo mover." }, { status: 500 }); }
}
