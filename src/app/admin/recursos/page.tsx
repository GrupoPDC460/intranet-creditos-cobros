import { getRepository } from "@/lib/data/repository";
import { ResourcesAdmin } from "@/components/admin/resources-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recursos" };

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: { nuevo?: string; importar?: string };
}) {
  const repo = getRepository();
  const data = await repo.getAll();
  const { categories, resources } = data;
  const resourceCategories = data.resourceCategories ?? [];
  const sorted = resources
    .slice()
    .sort((a, b) => a.categoryId.localeCompare(b.categoryId) || a.order - b.order);

  return (
    <ResourcesAdmin
      categories={categories.sort((a, b) => a.order - b.order)}
      resources={sorted}
      writable={repo.writable}
      resourceCategories={resourceCategories}
      openNew={searchParams.nuevo === "1"}
      openImport={searchParams.importar === "1"}
    />
  );
}
