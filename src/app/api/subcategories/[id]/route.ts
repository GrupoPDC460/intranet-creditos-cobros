import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/require-admin";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false }, global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) } },
  );
}

// Actualiza campos de un departamento (cover_image, icon, description, responsible)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const upd: Record<string, unknown> = {};
  if ("cover_image" in b) upd.cover_image = (b.cover_image as string | null) ?? null;
  if ("icon" in b) upd.icon = (b.icon as string | null) ?? null;
  if ("description" in b) upd.description = (b.description as string | null) ?? null;
  if ("responsible" in b) upd.responsible = (b.responsible as string | null) ?? null;
  if (!Object.keys(upd).length) return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  const { error } = await db().from("subcategories").update(upd).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
