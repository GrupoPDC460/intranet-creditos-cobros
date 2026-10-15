import { getPublicView } from "@/lib/data/public";
import { SiteShell } from "@/components/site-shell";
import { Hero, CategoryGrid, FavoritesSection } from "@/components/home-sections";
import { AccesosCard } from "@/components/accesos-card";
import { vaultUser } from "@/lib/vault";

// Los datos pueden cambiar desde el panel admin; renderizamos en cada request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ categories, resources, countByCategory }, puedeAccesos] = await Promise.all([
    getPublicView(),
    vaultUser().then(Boolean).catch(() => false),
  ]);

  return (
    <SiteShell data={{ categories, resources }}>
      <Hero resourceCount={resources.length} categoryCount={categories.length} />
      {puedeAccesos && <AccesosCard />}
      <CategoryGrid categories={categories} counts={countByCategory} />
      <FavoritesSection resources={resources} />
    </SiteShell>
  );
}
