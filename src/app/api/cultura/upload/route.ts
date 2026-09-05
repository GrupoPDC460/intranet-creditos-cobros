import { NextResponse } from "next/server";
import { getSession } from "@/lib/require-admin";
import { addPhoto, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Formato inválido." }, { status: 400 }); }
  const albumId = String(form.get("albumId") || "");
  const file = form.get("file");
  if (!albumId || !(file instanceof File)) return NextResponse.json({ error: "Faltan datos." }, { status: 422 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes." }, { status: 422 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Máx 15 MB por imagen." }, { status: 422 });
  try {
    const bytes = await file.arrayBuffer();
    const photo = await addPhoto(albumId, { name: file.name, type: file.type, bytes });
    return NextResponse.json({ ok: true, photo });
  } catch { return NextResponse.json({ error: "No se pudo subir la imagen." }, { status: 500 }); }
}
