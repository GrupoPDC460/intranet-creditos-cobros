import { NextResponse } from "next/server";
import { getRepository, ReadOnlyError } from "@/lib/data/repository";
import { isAdmin } from "@/lib/require-admin";
import { validateResourceInput } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import type { ResourceType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ImportRow {
  nombre?: string;
  url?: string;
  categoria?: string;
  subcategoria?: string;
  departamento?: string;
  tipo?: string;
  descripcion?: string;
  destacado?: string | boolean;
}

const TYPE_ALIASES: Record<string, ResourceType> = {
  dashboard: "dashboard",
  sistema: "sistema",
  "power bi": "powerbi",
  powerbi: "powerbi",
  onedrive: "onedrive",
  sharepoint: "sharepoint",
  excel: "excel",
  teams: "teams",
  formulario: "formulario",
  documento: "documento",
  aplicacion: "aplicacion",
  aplicación: "aplicacion",
  web: "web",
  "pagina web": "web",
  otro: "otro",
};

/**
 * Importa filas de recursos. El cuerpo debe ser { rows: ImportRow[] }.
 * Empareja categoría/subcategoría por nombre; crea la categoría si no existe.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const repo = getRepository();
  if (!repo.writable) {
    return NextResponse.json(
      { error: "El almacenamiento es de solo lectura. Configura Supabase para importar." },
      { status: 501 },
    );
  }

  const body = (await req.json().catch(() => null)) as { rows?: ImportRow[] } | null;
  const rows = body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No se recibieron filas." }, { status: 400 });
  }
  if (rows.length > 1000) {
    return NextResponse.json({ error: "Máximo 1000 filas por importación." }, { status: 413 });
  }

  const data = await repo.getAll();
  const catByName = new Map(data.categories.map((c) => [c.name.toLowerCase(), c]));

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2; // +1 header, +1 base-1
    const catName = (row.categoria ?? "").trim();
    if (!catName) {
      errors.push(`Fila ${line}: categoría vacía.`);
      continue;
    }

    let category = catByName.get(catName.toLowerCase());
    try {
      if (!category) {
        category = await repo.createCategory({
          name: catName,
          slug: slugify(catName),
          description: null,
          icon: null,
          order: data.categories.length + 1,
          active: true,
          subcategories: [],
        });
        catByName.set(catName.toLowerCase(), category);
      }

      // Resolver subcategoría por nombre (si se indicó y existe).
      let subcategoryId: string | null = null;
      const subName = (row.departamento ?? row.subcategoria ?? "").trim();
      if (subName) {
        const sub = category.subcategories.find(
          (s) => s.name.toLowerCase() === subName.toLowerCase(),
        );
        if (sub) subcategoryId = sub.id;
      }

      const typeKey = (row.tipo ?? "otro").trim().toLowerCase();
      const type = TYPE_ALIASES[typeKey] ?? "otro";

      const result = validateResourceInput({
        name: row.nombre,
        url: row.url,
        categoryId: category.id,
        subcategoryId,
        type,
        description: row.descripcion,
        featured:
          row.destacado === true ||
          String(row.destacado ?? "").toLowerCase().trim() === "si" ||
          String(row.destacado ?? "").toLowerCase().trim() === "sí" ||
          String(row.destacado ?? "").toLowerCase().trim() === "true",
        order: i + 1,
      });

      if (!result.ok || !result.value) {
        errors.push(`Fila ${line}: ${result.errors.join(" ")}`);
        continue;
      }
      await repo.createResource(result.value);
      created++;
    } catch (err) {
      if (err instanceof ReadOnlyError) {
        return NextResponse.json({ error: err.message }, { status: 501 });
      }
      errors.push(`Fila ${line}: error al guardar.`);
    }
  }

  return NextResponse.json({ created, errors, total: rows.length });
}
