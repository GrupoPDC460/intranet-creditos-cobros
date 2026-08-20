import { getRepository } from "./repository";
import type { Category, Resource } from "@/lib/types";

export interface PublicView {
  categories: Category[];
  resources: Resource[];
  countByCategory: Record<string, number>;
}

/** Datos visibles al público: categorías y recursos activos, ya ordenados. */
export async function getPublicView(): Promise<PublicView> {
  const { categories, resources } = await getRepository().getAll();

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
