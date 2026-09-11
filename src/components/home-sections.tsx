"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { Search, ArrowUpRight, Star } from "lucide-react";
import type { Category, Resource } from "@/lib/types";
import { resourceIcon, TYPE_TINT } from "@/lib/icons";
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
    <section className="pt-10 sm:pt-14">
      {/* Banner de marca */}
      <Reveal>
        <div className="mb-8 overflow-hidden rounded-2xl shadow-glass-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-banner.webp"
            alt="Una venta es venta, hasta que está cobrada"
            className="w-full object-cover"
            style={{ maxHeight: "260px", objectPosition: "center" }}
          />
        </div>
      </Reveal>
      <Reveal index={1}>
        <button
          onClick={openSearch}
          className="glass flex w-full max-w-xl items-center gap-3 rounded-2xl px-5 py-4 text-left shadow-glass transition-colors hover:bg-white/[0.07]"
        >
          <Search className="h-5 w-5 text-brand-glow" />
          <span className="flex-1 text-muted">Buscar sistemas, dashboards, KACE…</span>
          <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[0.7rem] font-semibold text-muted sm:inline">
            ⌘K
          </kbd>
        </button>
      </Reveal>
      <Reveal index={2}>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
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
          const Icon = resourceIcon(r);
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
        {categories.map((c, i) => {
          const isCultura = c.slug === "cultura";
          return (
            <Reveal key={c.id} index={i}>
              <Link href={`/categoria/${c.slug}`} className="block h-full">
                <SheenCard className="group h-full overflow-hidden p-0">
                  {/* Portada especial para Cultura */}
                  {isCultura && (
                    <div className="relative flex h-28 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#00216f] to-[#1a5fa8]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/pdc-logo-3d.png"
                        alt="Grupo PDC"
                        className="h-20 w-auto object-contain opacity-90 drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
                      />
                      <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-white/50 transition-colors group-hover:text-white" />
                    </div>
                  )}
                  <div className={isCultura ? "relative z-[2] p-5" : "relative z-[2] p-5"}>
                    {!isCultura && (
                      <div className="flex items-start justify-between">
                        <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
                          <LucideByName name={c.icon} className="h-6 w-6" />
                        </span>
                        <ArrowUpRight className="h-5 w-5 text-muted transition-colors group-hover:text-white" />
                      </div>
                    )}
                    <h3 className={`font-display text-lg font-semibold text-white ${!isCultura ? "mt-4" : ""}`}>
                      {c.name}
                    </h3>
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>
                    )}
                    <div className="mt-4 flex items-center gap-3 text-xs text-muted">
                      {isCultura ? (
                        <span className="chip">📸 Galería de fotos</span>
                      ) : (
                        <>
                          <span className="chip">{counts[c.id] ?? 0} recursos</span>
                          <span>
                            {c.subcategories.length}{" "}
                            {c.subcategories.length === 1 ? "departamento" : "departamentos"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </SheenCard>
              </Link>
            </Reveal>
          );
        })}
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
