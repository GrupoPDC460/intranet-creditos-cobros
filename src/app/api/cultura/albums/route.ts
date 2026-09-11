import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { getSession } from "@/lib/require-admin";
import { createAlbum, updateAlbum, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ error: "No disponible." }, { status: 503 });
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let name = "", description = "", parentId = "";
  try {
    const b = (await req.json()) as { name?: string; description?: string; parentId?: string };
    name = b.name ?? ""; description = b.description ?? ""; parentId = b.parentId ?? "";
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!name.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 422 });
  try {
    const album = await createAlbum(name, description, parentId || undefined);
    return NextResponse.json({ ok: true, album });
  } catch { return NextResponse.json({ error: "No se pudo crear el álbum." }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let id = "", name: string | undefined, description: string | undefined, coverUrl: string | undefined, coverRotation: number | undefined;
  try {
    const b = (await req.json()) as { id?: string; name?: string; description?: string; coverUrl?: string; coverRotation?: number };
    id = b.id ?? ""; name = b.name; description = b.description; coverUrl = b.coverUrl; coverRotation = b.coverRotation;
  } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  try {
    await updateAlbum(id, { name, description, cover_url: coverUrl, cover_rotation: coverRotation });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 }); }
}
