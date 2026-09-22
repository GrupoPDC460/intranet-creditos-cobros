import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, PackageOpen } from "lucide-react";
import { getPublicView } from "@/lib/data/public";
import { SiteShell } from "@/components/site-shell";
import { CategoryBrowser } from "@/components/category-browser";
import { CulturaGallery } from "@/components/cultura-gallery";
import { getAlbumsWithMeta } from "@/lib/cultura";
import { isAdmin } from "@/lib/require-admin";
import { Reveal, EmptyState } from "@/components/ui";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { categories } = await getPublicView();
  const cat = categories.find((c) => c.slug === params.slug);
  return { title: cat ? cat.name : "Categoría" };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const view = await getPublicView();
  let category = view.categories.find((c) => c.slug === params.slug);

  // Si no existe como categoría activa, redirigir a la carpeta padre
  if (!category) {
    const { redirect } = await import("next/navigation");
    // Mapa de slugs viejos/departamentos a su carpeta padre activa
    const SLUG_MAP: Record<string, string> = {
      "cobros-venta-directa":  "cobros",
      "cobros-moderno":        "cobros",
      "cobros-kam":            "cobros",
      "cobros-glt-servicios":  "cobros",
      "cobros-distribuidores": "cobros",
      "operaciones-cartera":   "creditos",
      "operatoria-cartera":    "creditos",
      "creditos-dept":         "creditos",
      "politicas-y-procedimientos": "politicas-procedimientos",
    };
    const target = SLUG_MAP[params.slug];
    if (target) redirect(`/categoria/${target}`);
    // Buscar si es slug de subcategoría → redirigir al padre
    const allCats = view.categories;
    for (const cat of allCats) {
      const sub = cat.subcategories.find((s) => s.slug === params.slug);
      if (sub) redirect(`/categoria/${cat.slug}`);
    }
    // Último recurso: nunca mostrar "Página no encontrada" → ir al inicio
    redirect("/");
  }
  if (!category) redirect("/");

  const resources = view.resources.filter((r) => r.categoryId === category.id);
  const isCultura = category.slug === "cultura";
  const albums = isCultura ? await getAlbumsWithMeta() : [];
  const admin = isCultura ? await isAdmin() : false;

  return (
    <SiteShell data={{ categories: view.categories, resources: view.resources }}>
      <div className="pt-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Inicio
        </Link>

        <Reveal>
          <p className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brand-glow">
            Categoría
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 max-w-2xl text-muted">{category.description}</p>
          )}
        </Reveal>
      </div>

      <div className="mt-10">
        {category.slug === "cultura" ? (
          <CulturaGallery albums={albums} isAdmin={admin} />
        ) : resources.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-5 w-5" />}
            title="Esta categoría aún no tiene recursos"
            description="El administrador puede agregar recursos desde el panel."
          />
        ) : (
          <CategoryBrowser category={category} resources={resources} resourceCategories={view.resourceCategories} />
        )}
      </div>
    </SiteShell>
  );
}
