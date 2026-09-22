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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const upd: Record<string, unknown> = {};
  if (typeof b.name === "string") { upd.name = b.name.trim(); upd.slug = slugify(b.name); }
  if ("icon" in b) upd.icon = b.icon ?? null;
  if ("description" in b) upd.description = b.description ?? null;
  if (typeof b.order === "number") upd.order = b.order;
  if (typeof b.active === "boolean") upd.active = b.active;
  upd.updated_at = new Date().toISOString();
  const { error } = await db().from("resource_categories").update(upd).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { error } = await db().from("resource_categories").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
