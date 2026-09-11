import { NextResponse } from "next/server";
import { getSession } from "@/lib/require-admin";
import { movePhotos, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let photoIds: string[] = [], targetAlbumId = "";
  try {
    const b = (await req.json()) as { photoId?: string; photoIds?: string[]; targetAlbumId?: string };
    targetAlbumId = b.targetAlbumId ?? "";
    photoIds = b.photoIds ?? (b.photoId ? [b.photoId] : []);
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!photoIds.length || !targetAlbumId)
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  try {
    await movePhotos(photoIds, targetAlbumId);
    return NextResponse.json({ ok: true, moved: photoIds.length });
  } catch { return NextResponse.json({ error: "No se pudo mover." }, { status: 500 }); }
}
