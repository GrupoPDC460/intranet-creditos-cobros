import { NextResponse } from "next/server";
import { getRepository, ReadOnlyError } from "@/lib/data/repository";
import { isAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/utils";
import type { CategoryInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getRepository().getAll();
  return NextResponse.json({ categories: data.categories });
}

function parseCategory(raw: Record<string, unknown>): {
  ok: boolean;
  error?: string;
  value?: CategoryInput;
} {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) return { ok: false, error: "El nombre de la categoría es obligatorio." };

  const subsRaw = Array.isArray(raw.subcategories) ? raw.subcategories : [];
  const subcategories = subsRaw
    .map((s, i) => {
      const sub = s as Record<string, unknown>;
      const subName = typeof sub.name === "string" ? sub.name.trim() : "";
      if (!subName) return null;
      return {
        id: typeof sub.id === "string" ? sub.id : undefined,
        name: subName,
        slug: typeof sub.slug === "string" && sub.slug ? slugify(sub.slug) : slugify(subName),
        order: typeof sub.order === "number" ? sub.order : i + 1,
      };
    })
    .filter(Boolean) as CategoryInput["subcategories"];

  return {
    ok: true,
    value: {
      name,
      slug: typeof raw.slug === "string" && raw.slug ? slugify(raw.slug) : slugify(name),
      description:
        typeof raw.description === "string" && raw.description.trim()
          ? raw.description.trim()
          : null,
      icon: typeof raw.icon === "string" && raw.icon.trim() ? raw.icon.trim() : null,
      order: typeof raw.order === "number" ? raw.order : 0,
      active: raw.active === undefined ? true : Boolean(raw.active),
      subcategories,
    },
  };
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  const parsed = parseCategory(raw);
  if (!parsed.ok || !parsed.value) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }
  try {
    const created = await getRepository().createCategory(parsed.value);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof ReadOnlyError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json({ error: "No se pudo crear la categoría." }, { status: 500 });
  }
}
