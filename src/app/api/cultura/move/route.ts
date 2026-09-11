import { NextResponse } from "next/server";
import { getSession } from "@/lib/require-admin";
import { movePhoto, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let photoId = "", targetAlbumId = "";
  try {
    const b = (await req.json()) as { photoId?: string; targetAlbumId?: string };
    photoId = b.photoId ?? ""; targetAlbumId = b.targetAlbumId ?? "";
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!photoId || !targetAlbumId) return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  try { await movePhoto(photoId, targetAlbumId); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "No se pudo mover la foto." }, { status: 500 }); }
}
