"use client";

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { ChevronLeft, ChevronRight, Folder, PackageOpen, Star, LayoutGrid } from "lucide-react";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/lib/types";
import type { Category, Resource, ResourceType, ResourceCategory } from "@/lib/types";
import { typeIcon, TYPE_TINT } from "@/lib/icons";
import { ResourceCard } from "@/components/resource-card";
import { Reveal, EmptyState } from "@/components/ui";

function LucideByName({ name, className }: { name?: string | null; className?: string }) {
  const key = name ? name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()).replace(/^./, (c: string) => c.toUpperCase()) : "Folder";
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[key] ?? Icons.Folder;
  return <Cmp className={className} />;
}

export function CategoryBrowser({
  category,
  resources,
  resourceCategories = [],
}: {
  category: Category;
  resources: Resource[];
  resourceCategories?: ResourceCategory[];
}) {
  const [openDept, setOpenDept] = useState<string | null>(null);
  const [type, setType] = useState<ResourceType | "all">("all");

  // Recursos que pertenecen directamente a la carpeta (sin departamento)
  const directResources = useMemo(
    () =>
      resources.filter(
        (r) =>
          !r.subcategoryId ||
          !category.subcategories.some((s) => s.id === r.subcategoryId),
      ),
    [resources, category.subcategories],
  );

  // Departamentos con sus recursos
  const depts = useMemo(
    () =>
      category.subcategories
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          description: sub.description ?? null,
          responsible: sub.responsible ?? null,
          icon: sub.icon ?? null,
          cover_image: sub.cover_image ?? null,
          items: resources.filter((r) => r.subcategoryId === sub.id),
        })),
    [category.subcategories, resources],
  );

  const hasDepts = depts.length > 0;
  const hasDirect = directResources.length > 0;
  const current = depts.find((d) => d.id === openDept) ?? null;

  // ── Vista vacía ──────────────────────────────────────────────
  if (!hasDepts && !hasDirect) {
    return (
      <EmptyState
        icon={<PackageOpen className="h-5 w-5" />}
        title="Esta carpeta aún no tiene contenido"
        description="El administrador puede agregar departamentos o recursos desde el panel."
      />
    );
  }

  // ── Detalle: departamento abierto ────────────────────────────
  if (current) {
    const filtered =
      type === "all" ? current.items : current.items.filter((r) => r.type === type);
    const presentTypes = RESOURCE_TYPES.filter((t) =>
      current.items.some((r) => r.type === t),
    ).map((t) => ({
      type: t,
      count: current.items.filter((r) => r.type === t).length,
    }));

    return (
      <div>
        {/* Breadcrumbs */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
          <a href="/" className="text-muted transition-colors hover:text-white">Inicio</a>
          <ChevronRight className="h-3.5 w-3.5 text-muted/50" />
          <button onClick={() => { setOpenDept(null); setType("all"); }} className="text-muted transition-colors hover:text-white">
            {category.name}
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted/50" />
          <span className="font-medium text-white">{current.name}</span>
        </nav>

        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
            <Folder className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{current.name}</h2>
            <p className="text-sm text-muted">
              {current.items.length} {current.items.length === 1 ? "recurso" : "recursos"}
            </p>
          </div>
        </div>

        {current.items.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-5 w-5" />}
            title="Este departamento aún no tiene recursos"
            description="Agrega recursos desde el panel de administración."
          />
        ) : (
          <CategoryGroupedView
            items={current.items}
            resourceCategories={resourceCategories.filter((rc) => rc.subcategoryId === current!.id)}
          />
        )}
      </div>
    );
  }

  // ── Vista principal de la carpeta ────────────────────────────
  const featured = resources.filter((r) => r.featured);

  return (
    <div>
      {/* Breadcrumbs */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm">
        <a href="/" className="text-muted transition-colors hover:text-white">Inicio</a>
        <ChevronRight className="h-3.5 w-3.5 text-muted/50" />
        <span className="font-medium text-white">{category.name}</span>
      </nav>

      {/* Accesos rápidos */}
      {featured.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-gold" />
            <h2 className="font-display text-lg font-semibold text-white">Accesos rápidos</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r, i) => (
              <Reveal key={r.id} index={i}>
                <ResourceCard resource={r} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ESCENARIO A y C: Departamentos */}
      {hasDepts && (
        <section className={hasDirect ? "mb-10" : ""}>
          <div className="mb-4 flex items-center gap-2">
            <Folder className="h-4 w-4 text-brand-glow" />
            <h2 className="font-display text-lg font-semibold text-white">Departamentos</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {depts.map((d, i) => (
              <Reveal key={d.id} index={i}>
                <DeptFolder
                  name={d.name}
                  description={d.description}
                  responsible={d.responsible}
                  icon={d.icon}
                  cover={d.cover_image}
                  items={d.items}
                  onClick={() => setOpenDept(d.id)}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ESCENARIO B y C: Recursos directos (sin departamento) */}
      {hasDirect && (
        <section>
          {hasDepts && (
            <div className="mb-4 mt-2 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-brand-glow" />
              <h2 className="font-display text-lg font-semibold text-white">
                Recursos de {category.name}
              </h2>
            </div>
          )}
          <DirectResourcesView resources={directResources} />
        </section>
      )}
    </div>
  );
}

// ── Recursos directos agrupados por tipo (sin departamento ficticio) ──
function DirectResourcesView({ resources }: { resources: Resource[] }) {
  const [type, setType] = useState<ResourceType | "all">("all");

  const presentTypes = RESOURCE_TYPES.filter((t) =>
    resources.some((r) => r.type === t),
  ).map((t) => ({ type: t, count: resources.filter((r) => r.type === t).length }));

  const filtered = type === "all" ? resources : resources.filter((r) => r.type === type);

  return (
    <>
      {presentTypes.length > 1 && (
        <div className="-mx-1 mb-8 flex flex-wrap gap-1.5 px-1">
          <FilterChip active={type === "all"} onClick={() => setType("all")} label="Todos" count={resources.length} />
          {presentTypes.map(({ type: t, count }) => {
            const Icon = typeIcon(t);
            return (
              <FilterChip
                key={t} active={type === t} onClick={() => setType(t)}
                label={RESOURCE_TYPE_LABELS[t]} count={count}
                icon={<Icon className="h-3.5 w-3.5" style={{ color: TYPE_TINT[t] }} />}
              />
            );
          })}
        </div>
      )}
      <TypeBreakdown items={filtered} />
    </>
  );
}

// ── Tarjeta de departamento ───────────────────────────────────
function DeptFolder({
  name, description, responsible, icon, cover, items, onClick,
}: {
  name: string;
  description?: string | null;
  responsible?: string | null;
  icon?: string | null;
  cover?: string | null;
  items: Resource[];
  onClick: () => void;
}) {
  const typeCounts = RESOURCE_TYPES.filter((t) => items.some((r) => r.type === t)).map(
    (t) => ({ t, n: items.filter((r) => r.type === t).length }),
  );
  return (
    <button
      onClick={onClick}
      className="glass sheen group flex h-full w-full flex-col overflow-hidden rounded-2xl text-left shadow-glass transition-transform duration-300 hover:-translate-y-1"
    >
      {cover && (
        <div className="relative h-28 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <span className="absolute bottom-2 left-2 grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-black/30 text-white backdrop-blur">
            <LucideByName name={icon} className="h-5 w-5" />
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
      <div className="relative z-[2] flex items-start justify-between">
        {!cover && (
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
            <LucideByName name={icon} className="h-6 w-6" />
          </span>
        )}
        <span className="chip ml-auto">{items.length} {items.length === 1 ? "recurso" : "recursos"}</span>
      </div>
      <h3 className={`relative z-[2] font-display text-lg font-semibold text-white ${cover ? "mt-3" : "mt-4"}`}>
        {name}
      </h3>
      {responsible && (
        <p className="relative z-[2] mt-0.5 text-xs font-medium text-brand-glow">
          {responsible}
        </p>
      )}
      {description && (
        <p className="relative z-[2] mt-1 line-clamp-2 text-sm text-muted">{description}</p>
      )}
      {typeCounts.length > 0 && (
        <div className="relative z-[2] mt-3 flex flex-wrap gap-1.5">
          {typeCounts.slice(0, 4).map(({ t, n }) => {
            const Icon = typeIcon(t);
            return (
              <span key={t} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[0.7rem] text-muted">
                <Icon className="h-3 w-3" style={{ color: TYPE_TINT[t] }} />
                {n} {RESOURCE_TYPE_LABELS[t]}
              </span>
            );
          })}
        </div>
      )}
      </div>
    </button>
  );
}

// ── Grilla de recursos agrupada por tipo ─────────────────────
function TypeBreakdown({ items }: { items: Resource[] }) {
  const presentTypes = RESOURCE_TYPES.filter((t) => items.some((r) => r.type === t));
  if (items.length === 0) return null;

  // Si solo hay un tipo, mostrar plano
  if (presentTypes.length === 1) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r, i) => (
          <Reveal key={r.id} index={i}>
            <ResourceCard resource={r} index={i} />
          </Reveal>
        ))}
      </div>
    );
  }

  // Varios tipos → agrupar con encabezado
  return (
    <div className="space-y-8">
      {presentTypes.map((t) => {
        const Icon = typeIcon(t);
        const group = items.filter((r) => r.type === t);
        return (
          <section key={t}>
            <div className="mb-3 flex items-center gap-2">
              <Icon className="h-4 w-4" style={{ color: TYPE_TINT[t] }} />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {RESOURCE_TYPE_LABELS[t]}
              </h3>
              <span className="chip">{group.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((r, i) => (
                <Reveal key={r.id} index={i}>
                  <ResourceCard resource={r} index={i} />
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── FilterChip ────────────────────────────────────────────────
function FilterChip({
  active, onClick, label, count, icon,
}: {
  active: boolean; onClick: () => void;
  label: string; count: number; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-brand-glow/50 bg-brand-glow/10 text-white"
          : "border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-white"
      }`}
    >
      {icon}
      {label}
      <span className={`text-xs ${active ? "text-brand-glow" : "text-muted/60"}`}>
        {count}
      </span>
    </button>
  );
}

// ── Vista agrupada por categorías reales (híbrido: tarjetas + secciones) ──
function CategoryGroupedView({
  items,
  resourceCategories,
}: {
  items: Resource[];
  resourceCategories: ResourceCategory[];
}) {
  const [jump, setJump] = useState<string | null>(null);

  // Ordenar categorías presentes por su orden definido
  const cats = resourceCategories
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((rc) => ({ rc, items: items.filter((r) => r.resourceCategoryId === rc.id) }))
    .filter((g) => g.items.length > 0);

  // Recursos sin categoría (directos del departamento) → como "Cobro Jabón"
  const uncategorized = items.filter(
    (r) => !r.resourceCategoryId || !resourceCategories.some((rc) => rc.id === r.resourceCategoryId),
  );

  const showCards = cats.length >= 3;

  const visibleCats = jump ? cats.filter((g) => g.rc.id === jump) : cats;

  return (
    <div>
      {/* Tarjetas de acceso rápido a categorías (solo si hay 3+) */}
      {showCards && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setJump(null)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              !jump ? "border-brand-glow/50 bg-brand-glow/10 text-white" : "border-white/10 bg-white/5 text-muted hover:text-white"
            }`}
          >
            Todas <span className="text-xs opacity-60">{items.length}</span>
          </button>
          {cats.map(({ rc, items: gi }) => (
            <button
              key={rc.id}
              onClick={() => setJump(jump === rc.id ? null : rc.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                jump === rc.id ? "border-brand-glow/50 bg-brand-glow/10 text-white" : "border-white/10 bg-white/5 text-muted hover:text-white"
              }`}
            >
              <LucideByName name={rc.icon} className="h-3.5 w-3.5 text-brand-glow" />
              {rc.name} <span className="text-xs opacity-60">{gi.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recursos directos (sin categoría) primero */}
      {uncategorized.length > 0 && !jump && (
        <section className="mb-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorized.map((r, i) => (
              <Reveal key={r.id} index={i}>
                <ResourceCard resource={r} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Secciones por categoría */}
      <div className="space-y-9">
        {visibleCats.map(({ rc, items: gi }) => (
          <section key={rc.id}>
            <div className="mb-3 flex items-center gap-2">
              <LucideByName name={rc.icon} className="h-4 w-4 text-brand-glow" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{rc.name}</h3>
              <span className="chip">{gi.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gi.map((r, i) => (
                <Reveal key={r.id} index={i}>
                  <ResourceCard resource={r} index={i} />
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
