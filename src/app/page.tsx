import { getPublicView } from "@/lib/data/public";
import { SiteShell } from "@/components/site-shell";
import { Hero, CategoryGrid, FavoritesSection } from "@/components/home-sections";

// Los datos pueden cambiar desde el panel admin; renderizamos en cada request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories, resources, countByCategory } = await getPublicView();

  return (
    <SiteShell data={{ categories, resources }}>
      <Hero resourceCount={resources.length} categoryCount={categories.length} />
      <CategoryGrid categories={categories} counts={countByCategory} />
      <FavoritesSection resources={resources} />
    </SiteShell>
  );
}
