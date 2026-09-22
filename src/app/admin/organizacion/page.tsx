import { getRepository } from "@/lib/data/repository";
import { OrganizacionAdmin } from "@/components/admin/organizacion-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organización" };

export default async function OrganizacionPage() {
  const repo = getRepository();
  const data = await repo.getAll();
  const resourceCategories = data.resourceCategories ?? [];

  // Conteos por departamento y por categoría de recurso
  const countBySub: Record<string, number> = {};
  const countByRC: Record<string, number> = {};
  for (const r of data.resources) {
    if (r.subcategoryId) countBySub[r.subcategoryId] = (countBySub[r.subcategoryId] ?? 0) + 1;
    if (r.resourceCategoryId) countByRC[r.resourceCategoryId] = (countByRC[r.resourceCategoryId] ?? 0) + 1;
  }

  return (
    <OrganizacionAdmin
      categories={data.categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon ?? null,
        subcategories: c.subcategories.map((s) => ({
          id: s.id,
          name: s.name,
          icon: s.icon ?? null,
          responsible: s.responsible ?? null,
          cover_image: s.cover_image ?? null,
          count: countBySub[s.id] ?? 0,
        })),
      }))}
      resourceCategories={resourceCategories.map((rc) => ({
        id: rc.id,
        name: rc.name,
        icon: rc.icon ?? null,
        subcategoryId: rc.subcategoryId ?? null,
        categoryId: rc.categoryId ?? null,
        order: rc.order,
        count: countByRC[rc.id] ?? 0,
      }))}
      resources={data.resources.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        subcategoryId: r.subcategoryId ?? null,
        resourceCategoryId: r.resourceCategoryId ?? null,
      }))}
    />
  );
}
