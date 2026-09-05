import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { deletePhoto, deleteAlbum, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let photoId = "", albumId = "";
  try { const b = (await req.json()) as { photoId?: string; albumId?: string }; photoId = b.photoId ?? ""; albumId = b.albumId ?? ""; }
  catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  try {
    if (photoId) await deletePhoto(photoId);
    else if (albumId) await deleteAlbum(albumId);
    else return NextResponse.json({ error: "Falta id." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 }); }
}
