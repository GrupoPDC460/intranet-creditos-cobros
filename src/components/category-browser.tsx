"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Folder, PackageOpen } from "lucide-react";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/lib/types";
import type { Category, Resource, ResourceType } from "@/lib/types";
import { typeIcon, TYPE_TINT } from "@/lib/icons";
import { ResourceCard } from "@/components/resource-card";
import { Reveal, EmptyState } from "@/components/ui";

const GENERAL = "__general__";

export function CategoryBrowser({
  category,
  resources,
}: {
  category: Category;
  resources: Resource[];
}) {
  const [openDept, setOpenDept] = useState<string | null>(null);
  const [type, setType] = useState<ResourceType | "all">("all");

  const depts = useMemo(() => {
    // Mostrar TODOS los departamentos, aunque estén vacíos (visibilidad de estructura).
    const list = category.subcategories
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((sub) => ({
        id: sub.id,
        name: sub.name,
        items: resources.filter((r) => r.subcategoryId === sub.id),
      }));

    const general = resources.filter(
      (r) => !r.subcategoryId || !category.subcategories.some((s) => s.id === r.subcategoryId),
    );
    if (general.length) list.push({ id: GENERAL, name: "General", items: general });
    return list;
  }, [category.subcategories, resources]);

  const current = depts.find((d) => d.id === openDept) ?? null;

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={<PackageOpen className="h-5 w-5" />}
        title="Esta categoría aún no tiene recursos"
        description="El administrador puede agregar recursos desde el panel."
      />
    );
  }

  // ---- Detalle: un departamento abierto, desglosado por tipo ----
  if (current) {
    const filtered =
      type === "all" ? current.items : current.items.filter((r) => r.type === type);
    const presentTypes = RESOURCE_TYPES.filter((t) => current.items.some((r) => r.type === t)).map(
      (t) => ({ type: t, count: current.items.filter((r) => r.type === t).length }),
    );
    const empty = current.items.length === 0;

    return (
      <div>
        <button
          onClick={() => {
            setOpenDept(null);
            setType("all");
          }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Departamentos
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

        {empty ? (
          <EmptyState
            icon={<PackageOpen className="h-5 w-5" />}
            title="Este departamento aún no tiene recursos"
            description="Agrega recursos a este departamento desde el panel de administración."
          />
        ) : (
          <>
            <div className="-mx-1 mb-8 flex flex-wrap gap-1.5 px-1">
              <FilterChip
                active={type === "all"}
                onClick={() => setType("all")}
                label="Todos"
                count={current.items.length}
              />
              {presentTypes.map(({ type: t, count }) => {
                const Icon = typeIcon(t);
                return (
                  <FilterChip
                    key={t}
                    active={type === t}
                    onClick={() => setType(t)}
                    label={RESOURCE_TYPE_LABELS[t]}
                    count={count}
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

  // ---- Carpetas: los departamentos de la categoría ----
  return (
    <div>
      <p className="mb-5 text-sm text-muted">Elige un departamento para ver sus recursos.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {depts.map((d, i) => (
          <Reveal key={d.id} index={i}>
            <DeptFolder name={d.name} items={d.items} onClick={() => setOpenDept(d.id)} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function DeptFolder({
  name,
  items,
  onClick,
}: {
  name: string;
  items: Resource[];
  onClick: () => void;
}) {
  const present = RESOURCE_TYPES.filter((t) => items.some((r) => r.type === t));
  return (
    <button
      onClick={onClick}
      className="glass sheen group h-full w-full rounded-2xl p-5 text-left shadow-glass transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative z-[2] flex h-full flex-col">
        <div className="flex items-start justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
            <Folder className="h-6 w-6" />
          </span>
          <span className="chip">{items.length}</span>
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold leading-tight text-white">{name}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {present.length === 0 ? (
            <span className="text-[0.78rem] text-muted/70">Sin recursos aún</span>
          ) : (
            present.map((t) => {
              const Icon = typeIcon(t);
              const n = items.filter((r) => r.type === t).length;
              return (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.72rem] text-muted"
                >
                  <Icon className="h-3 w-3" style={{ color: TYPE_TINT[t] }} />
                  {n} {RESOURCE_TYPE_LABELS[t]}
                </span>
              );
            })
          )}
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-[0.8rem] font-medium text-brand-glow opacity-0 transition-opacity group-hover:opacity-100">
          Abrir departamento →
        </span>
      </div>
    </button>
  );
}

function TypeBreakdown({ items }: { items: Resource[] }) {
  const present = RESOURCE_TYPES.filter((t) => items.some((r) => r.type === t));
  if (present.length === 0) {
    return (
      <EmptyState
        icon={<PackageOpen className="h-5 w-5" />}
        title="Nada con este filtro"
        description="Prueba con otro tipo."
      />
    );
  }
  if (present.length === 1) return <CardGrid items={items} />;

  return (
    <div className="space-y-8">
      {present.map((t) => {
        const Icon = typeIcon(t);
        const sub = items.filter((r) => r.type === t);
        return (
          <div key={t}>
            <div className="mb-3 flex items-center gap-2">
              <Icon className="h-4 w-4" style={{ color: TYPE_TINT[t] }} />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {RESOURCE_TYPE_LABELS[t]}
              </h3>
              <span className="text-xs text-muted/70">{sub.length}</span>
            </div>
            <CardGrid items={sub} />
          </div>
        );
      })}
    </div>
  );
}

function CardGrid({ items }: { items: Resource[] }) {
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

function FilterChip({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "border-brand-400 bg-brand-500/20 text-white"
          : "border-white/10 bg-white/5 text-muted hover:bg-white/10 hover:text-white")
      }
    >
      {icon}
      {label}
      <span
        className={
          "rounded-md px-1.5 text-xs " + (active ? "bg-white/15 text-white" : "bg-white/5 text-muted")
        }
      >
        {count}
      </span>
    </button>
  );
}
