"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Folder, PackageOpen, Star, LayoutGrid } from "lucide-react";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/lib/types";
import type { Category, Resource, ResourceType } from "@/lib/types";
import { typeIcon, TYPE_TINT } from "@/lib/icons";
import { ResourceCard } from "@/components/resource-card";
import { Reveal, EmptyState } from "@/components/ui";

export function CategoryBrowser({
  category,
  resources,
}: {
  category: Category;
  resources: Resource[];
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
        <button
          onClick={() => { setOpenDept(null); setType("all"); }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {category.name}
        </button>

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
          <>
            <div className="-mx-1 mb-8 flex flex-wrap gap-1.5 px-1">
              <FilterChip active={type === "all"} onClick={() => setType("all")} label="Todos" count={current.items.length} />
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
            <TypeBreakdown items={filtered} />
          </>
        )}
      </div>
    );
  }

  // ── Vista principal de la carpeta ────────────────────────────
  const featured = resources.filter((r) => r.featured);

  return (
    <div>
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
  name, items, onClick,
}: {
  name: string; items: Resource[]; onClick: () => void;
}) {
  const typeCounts = RESOURCE_TYPES.filter((t) => items.some((r) => r.type === t)).map(
    (t) => ({ t, n: items.filter((r) => r.type === t).length }),
  );
  return (
    <button
      onClick={onClick}
      className="glass sheen group flex h-full w-full flex-col rounded-2xl p-5 text-left shadow-glass transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative z-[2] flex items-start justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
          <Folder className="h-6 w-6" />
        </span>
        <span className="chip">{items.length} {items.length === 1 ? "recurso" : "recursos"}</span>
      </div>
      <h3 className="relative z-[2] mt-4 font-display text-lg font-semibold text-white">{name}</h3>
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
