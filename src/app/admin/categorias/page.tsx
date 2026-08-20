import { getRepository } from "@/lib/data/repository";
import { CategoriesAdmin } from "@/components/admin/categories-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categorías" };

export default async function AdminCategoriesPage() {
  const repo = getRepository();
  const { categories, resources } = await repo.getAll();
  const counts: Record<string, number> = {};
  for (const r of resources) counts[r.categoryId] = (counts[r.categoryId] ?? 0) + 1;

  return (
    <CategoriesAdmin categories={categories} counts={counts} writable={repo.writable} />
  );
}
