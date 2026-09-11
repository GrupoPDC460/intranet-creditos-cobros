import { NextResponse } from "next/server";
import { getSession } from "@/lib/require-admin";
import { savePhotoRotation, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let id = "", rotation = 0;
  try {
    const b = (await req.json()) as { id?: string; rotation?: number };
    id = b.id ?? ""; rotation = b.rotation ?? 0;
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  try {
    await savePhotoRotation(id, rotation);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No se pudo guardar la rotación." }, { status: 500 }); }
}
