import { getRepository } from "./repository";
import type { Category, Resource } from "@/lib/types";

export interface PublicView {
  categories: Category[];
  resources: Resource[];
  countByCategory: Record<string, number>;
}

/** Datos visibles al público: categorías y recursos activos, ya ordenados. */
export async function getPublicView(): Promise<PublicView> {
  // Reintento ante errores transitorios de Supabase (p.ej. PGRST303 por desfase
  // de reloj), para que el portal no caiga a la pantalla de error.
  let data: { categories: Category[]; resources: Resource[] } | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      data = await getRepository().getAll();
      break;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  if (!data) throw lastErr;
  const { categories, resources } = data;

  const activeResources = resources
    .filter((r) => r.active)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  const activeCategories = categories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order);

  const countByCategory: Record<string, number> = {};
  for (const r of activeResources) {
    countByCategory[r.categoryId] = (countByCategory[r.categoryId] ?? 0) + 1;
  }

  return { categories: activeCategories, resources: activeResources, countByCategory };
}
