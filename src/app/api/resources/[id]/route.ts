import { NextResponse } from "next/server";
import { getRepository, ReadOnlyError } from "@/lib/data/repository";
import { isAdmin } from "@/lib/require-admin";
import { validateResourceInput } from "@/lib/validation";
import { isSafeUrl, normalizeUrl } from "@/lib/utils";
import type { ResourceInput } from "@/lib/types";

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
  if (!raw) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  // Actualización parcial: validación completa solo si viene el recurso entero;
  // si es un toggle (featured/active/order) validamos únicamente lo presente.
  const isFullUpdate = "name" in raw && "url" in raw && "categoryId" in raw;
  let patch: Partial<ResourceInput>;

  if (isFullUpdate) {
    const result = validateResourceInput(raw);
    if (!result.ok || !result.value) {
      return NextResponse.json({ error: result.errors.join(" ") }, { status: 422 });
    }
    patch = result.value;
  } else {
    patch = {};
    if (typeof raw.url === "string") {
      const url = normalizeUrl(raw.url);
      if (!isSafeUrl(url)) {
        return NextResponse.json({ error: "URL no válida." }, { status: 422 });
      }
      patch.url = url;
    }
    if (typeof raw.active === "boolean") patch.active = raw.active;
    if (typeof raw.featured === "boolean") patch.featured = raw.featured;
    if (typeof raw.order === "number") patch.order = raw.order;
    if (typeof raw.categoryId === "string") patch.categoryId = raw.categoryId;
    if ("subcategoryId" in raw)
      patch.subcategoryId = (raw.subcategoryId as string | null) ?? null;
  }

  try {
    const updated = await getRepository().updateResource(params.id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ReadOnlyError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json({ error: "No se pudo actualizar el recurso." }, { status: 500 });
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
    await getRepository().deleteResource(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ReadOnlyError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json({ error: "No se pudo eliminar el recurso." }, { status: 500 });
  }
}
