import { getRepository } from "./repository";
import type { Category, Resource, ResourceCategory } from "@/lib/types";

export interface PublicView {
  categories: Category[];
  resources: Resource[];
  resourceCategories: ResourceCategory[];
  countByCategory: Record<string, number>;
}

/** Última lectura exitosa (por instancia del servidor), respaldo ante fallas. */
let lastGood: { categories: Category[]; resources: Resource[]; resourceCategories?: ResourceCategory[] } | null = null;

/** Datos visibles al público: categorías y recursos activos, ya ordenados. */
export async function getPublicView(): Promise<PublicView> {
  // Los reintentos ante fallas transitorias de Supabase (PGRST303, 5xx, red)
  // viven en supabaseFetch. Si aun así falla, servimos la última lectura buena
  // de esta instancia en vez de mandar al usuario a la pantalla de error.
  let data: { categories: Category[]; resources: Resource[]; resourceCategories?: ResourceCategory[] };
  try {
    data = await getRepository().getAll();
    lastGood = data;
  } catch (e) {
    if (!lastGood) throw e;
    console.warn("[public] Supabase no respondió; usando la última lectura buena", e);
    data = lastGood;
  }
  const { categories, resources, resourceCategories = [] } = data;

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

  const activeRC = resourceCategories.filter((rc) => rc.active).sort((a, b) => a.order - b.order);
  return { categories: activeCategories, resources: activeResources, resourceCategories: activeRC, countByCategory };
}
