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
// Asigna (o quita) la categoría de recurso a uno o varios recursos
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { resourceIds?: string[]; resourceCategoryId?: string | null };
  const ids = b.resourceIds ?? [];
  if (!ids.length) return NextResponse.json({ error: "Faltan recursos." }, { status: 400 });
  const { error } = await db()
    .from("resources")
    .update({ resource_category_id: b.resourceCategoryId ?? null })
    .in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
