import { NextResponse } from "next/server";
import { getRepository, ReadOnlyError } from "@/lib/data/repository";
import { isAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/utils";
import type { CategoryInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  const patch: Partial<CategoryInput> = {};
  if (typeof raw.name === "string") patch.name = raw.name.trim();
  if (typeof raw.slug === "string") patch.slug = slugify(raw.slug);
  if ("description" in raw) patch.description = (raw.description as string | null) ?? null;
  if ("icon" in raw) patch.icon = (raw.icon as string | null) ?? null;
  if (typeof raw.order === "number") patch.order = raw.order;
  if (typeof raw.active === "boolean") patch.active = raw.active;
  if (Array.isArray(raw.subcategories)) {
    patch.subcategories = raw.subcategories
      .map((s, i) => {
        const sub = s as Record<string, unknown>;
        const subName = typeof sub.name === "string" ? sub.name.trim() : "";
        if (!subName) return null;
        return {
          id: typeof sub.id === "string" ? sub.id : undefined,
          name: subName,
          slug:
            typeof sub.slug === "string" && sub.slug ? slugify(sub.slug) : slugify(subName),
          order: typeof sub.order === "number" ? sub.order : i + 1,
        };
      })
      .filter(Boolean) as CategoryInput["subcategories"];
  }

  try {
    const updated = await getRepository().updateCategory(params.id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ReadOnlyError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json({ error: "No se pudo actualizar la categoría." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    await getRepository().deleteCategory(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ReadOnlyError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json({ error: "No se pudo eliminar la categoría." }, { status: 500 });
  }
}
