import { getRepository } from "@/lib/data/repository";
import { FeaturedAdmin } from "@/components/admin/featured-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Destacados" };

export default async function AdminFeaturedPage() {
  const repo = getRepository();
  const { categories, resources } = await repo.getAll();
  return (
    <FeaturedAdmin
      resources={resources.sort((a, b) => a.name.localeCompare(b.name))}
      categories={categories}
      writable={repo.writable}
    />
  );
}
