import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, PackageOpen } from "lucide-react";
import { getPublicView } from "@/lib/data/public";
import { SiteShell } from "@/components/site-shell";
import { ResourceCard } from "@/components/resource-card";
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
  const category = view.categories.find((c) => c.slug === params.slug);
  if (!category) notFound();

  const resources = view.resources.filter((r) => r.categoryId === category.id);

  // Agrupar por subcategoría (respetando orden), con un grupo "General" al final.
  const groups = category.subcategories
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((sub) => ({
      key: sub.id,
      name: sub.name,
      items: resources.filter((r) => r.subcategoryId === sub.id),
    }))
    .filter((g) => g.items.length > 0);

  const ungrouped = resources.filter(
    (r) => !r.subcategoryId || !category.subcategories.some((s) => s.id === r.subcategoryId),
  );
  if (ungrouped.length) groups.push({ key: "general", name: "General", items: ungrouped });

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

      <div className="mt-10 space-y-12 pb-4">
        {resources.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-5 w-5" />}
            title="Esta categoría aún no tiene recursos"
            description="El administrador puede agregar recursos desde el panel."
          />
        ) : (
          groups.map((group) => (
            <section key={group.key}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-display text-lg font-semibold text-white">
                  {group.name}
                </h2>
                <span className="chip">{group.items.length}</span>
                <span className="hairline flex-1" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((r, i) => (
                  <Reveal key={r.id} index={i}>
                    <ResourceCard resource={r} index={i} />
                  </Reveal>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </SiteShell>
  );
}
