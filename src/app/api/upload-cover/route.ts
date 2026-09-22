import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { uploadCoverImage, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Formato inválido." }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo." }, { status: 422 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes." }, { status: 422 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Máx 10 MB." }, { status: 422 });
  try {
    const bytes = await file.arrayBuffer();
    const url = await uploadCoverImage({ name: file.name, type: file.type, bytes });
    return NextResponse.json({ ok: true, url });
  } catch { return NextResponse.json({ error: "No se pudo subir la imagen." }, { status: 500 }); }
}
