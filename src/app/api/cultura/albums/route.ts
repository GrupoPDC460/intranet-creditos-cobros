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

import { updateAlbum } from "@/lib/cultura";
export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let id = "", name: string | undefined, description: string | undefined, coverUrl: string | undefined;
  try {
    const b = (await req.json()) as { id?: string; name?: string; description?: string; coverUrl?: string };
    id = b.id ?? ""; name = b.name; description = b.description; coverUrl = b.coverUrl;
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  try {
    await updateAlbum(id, { name, description, cover_url: coverUrl });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 }); }
}
