"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { Search, ArrowUpRight, Star, Sparkles } from "lucide-react";
import type { Category, Resource } from "@/lib/types";
import { typeIcon, TYPE_TINT } from "@/lib/icons";
import { useFavorites } from "@/components/providers";
import { useOpenSearch } from "@/components/site-shell";
import { Reveal, SheenCard, SectionHeading, EmptyState } from "@/components/ui";
import { ResourceCard } from "@/components/resource-card";

/* ----------------------------------- Hero ----------------------------------- */

export function Hero({
  resourceCount,
  categoryCount,
}: {
  resourceCount: number;
  categoryCount: number;
}) {
  const openSearch = useOpenSearch();
  return (
    <section className="pt-14 sm:pt-20">
      <Reveal>
        <p className="chip mb-5">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          Un solo lugar. Todas nuestras herramientas.
        </p>
      </Reveal>
      <Reveal index={1}>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
          Todo lo que necesitas para{" "}
          <span className="bg-gradient-to-r from-brand-glow to-brand-400 bg-clip-text text-transparent">
            gestionar tu operación.
          </span>
        </h1>
      </Reveal>
      <Reveal index={2}>
        <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
          Accede rápidamente a sistemas, dashboards, reportes y herramientas de
          Créditos &amp; Cobros.
        </p>
      </Reveal>
      <Reveal index={3}>
        <button
          onClick={openSearch}
          className="glass mt-8 flex w-full max-w-xl items-center gap-3 rounded-2xl px-5 py-4 text-left shadow-glass transition-colors hover:bg-white/[0.07]"
        >
          <Search className="h-5 w-5 text-brand-glow" />
          <span className="flex-1 text-muted">Buscar sistemas, dashboards, KACE…</span>
          <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[0.7rem] font-semibold text-muted sm:inline">
            ⌘K
          </kbd>
        </button>
      </Reveal>
      <Reveal index={4}>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <span>
            <strong className="font-semibold text-white">{resourceCount}</strong> recursos
          </span>
          <span className="h-1 w-1 rounded-full bg-muted/40" />
          <span>
            <strong className="font-semibold text-white">{categoryCount}</strong> categorías
          </span>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------- Quick access ------------------------------- */

export function QuickAccess({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;
  return (
    <section className="mt-16">
      <SectionHeading eyebrow="Accesos rápidos" title="Más utilizados" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {resources.map((r, i) => {
          const Icon = typeIcon(r.type);
          const tint = TYPE_TINT[r.type];
          return (
            <Reveal key={r.id} index={i}>
              <a
                href={r.url}
                target={r.openInNewTab ? "_blank" : undefined}
                rel={r.openInNewTab ? "noopener noreferrer" : undefined}
                className="glass sheen group flex h-full flex-col items-start gap-3 rounded-2xl p-4 shadow-glass transition-transform hover:-translate-y-1"
              >
                <span
                  className="relative z-[2] grid h-10 w-10 place-items-center rounded-xl border border-white/10"
                  style={{ background: `${tint}18` }}
                >
                  <Icon className="h-5 w-5" style={{ color: tint }} />
                </span>
                <span className="relative z-[2] text-sm font-semibold leading-tight text-white">
                  {r.name}
                </span>
              </a>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------ Category grid ------------------------------- */

function LucideByName({ name, className }: { name?: string | null; className?: string }) {
  const key = (name ?? "")
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[key] ?? Icons.Folder;
  return <Cmp className={className} />;
}

export function CategoryGrid({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<string, number>;
}) {
  return (
    <section className="mt-20">
      <SectionHeading eyebrow="Explorar" title="Categorías" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal key={c.id} index={i}>
            <Link href={`/categoria/${c.slug}`} className="block h-full">
              <SheenCard className="group h-full p-5">
                <div className="relative z-[2] flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
                    <LucideByName name={c.icon} className="h-6 w-6" />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted transition-colors group-hover:text-white" />
                </div>
                <h3 className="relative z-[2] mt-4 font-display text-lg font-semibold text-white">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="relative z-[2] mt-1 line-clamp-2 text-sm text-muted">
                    {c.description}
                  </p>
                )}
                <div className="relative z-[2] mt-4 flex items-center gap-3 text-xs text-muted">
                  <span className="chip">{counts[c.id] ?? 0} recursos</span>
                  <span>{c.subcategories.length} subcategorías</span>
                </div>
              </SheenCard>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- Featured resources ---------------------------- */

export function FeaturedResources({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;
  return (
    <section className="mt-20">
      <SectionHeading eyebrow="Destacados" title="Recursos destacados" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r, i) => (
          <Reveal key={r.id} index={i}>
            <ResourceCard resource={r} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------- Favorites (home) ----------------------------- */

export function FavoritesSection({ resources }: { resources: Resource[] }) {
  const { favorites, ready } = useFavorites();
  if (!ready) return null;
  const favResources = resources.filter((r) => favorites.has(r.id));

  return (
    <section className="mt-20">
      <SectionHeading eyebrow="Tu espacio" title="Mis favoritos" />
      {favResources.length === 0 ? (
        <EmptyState
          icon={<Star className="h-5 w-5" />}
          title="Aún no tienes favoritos"
          description="Marca con la estrella los recursos que usas a diario y aparecerán aquí para acceso inmediato."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favResources.map((r, i) => (
            <ResourceCard key={r.id} resource={r} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
