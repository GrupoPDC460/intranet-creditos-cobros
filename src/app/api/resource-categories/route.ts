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
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const uid = () => "rc_" + Math.random().toString(36).slice(2, 11);

// Crear categoría de recurso
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as {
    name?: string; icon?: string; description?: string;
    categoryId?: string | null; subcategoryId?: string | null; order?: number;
  };
  if (!b.name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 422 });
  const row = {
    id: uid(), name: b.name.trim(), slug: slugify(b.name),
    icon: b.icon ?? null, description: b.description ?? null,
    category_id: b.categoryId ?? null, subcategory_id: b.subcategoryId ?? null,
    order: b.order ?? 0, active: true,
  };
  const { error } = await db().from("resource_categories").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: row.id });
}
