import { getPublicView } from "@/lib/data/public";
import { SiteShell } from "@/components/site-shell";
import {
  Hero,
  QuickAccess,
  CategoryGrid,
  FeaturedResources,
  FavoritesSection,
} from "@/components/home-sections";

// Los datos pueden cambiar desde el panel admin; renderizamos en cada request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories, resources, countByCategory } = await getPublicView();
  const featured = resources.filter((r) => r.featured);

  return (
    <SiteShell data={{ categories, resources }}>
      <Hero resourceCount={resources.length} categoryCount={categories.length} />
      <QuickAccess resources={featured.slice(0, 6)} />
      <CategoryGrid categories={categories} counts={countByCategory} />
      <FeaturedResources resources={featured} />
      <FavoritesSection resources={resources} />
    </SiteShell>
  );
}
