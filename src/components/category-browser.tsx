"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Shapes } from "lucide-react";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/lib/types";
import type { Category, Resource, ResourceType } from "@/lib/types";
import { typeIcon, TYPE_TINT } from "@/lib/icons";
import { ResourceCard } from "@/components/resource-card";
import { Reveal } from "@/components/ui";

type TypeFilter = ResourceType | "all";
type GroupMode = "sub" | "type";

export function CategoryBrowser({
  category,
  resources,
}: {
  category: Category;
  resources: Resource[];
}) {
  const [type, setType] = useState<TypeFilter>("all");
  const [groupBy, setGroupBy] = useState<GroupMode>("sub");

  // Tipos presentes en esta categoría (en el orden canónico), con su conteo.
  const presentTypes = useMemo(
    () =>
      RESOURCE_TYPES.filter((t) => resources.some((r) => r.type === t)).map((t) => ({
        type: t,
        count: resources.filter((r) => r.type === t).length,
      })),
    [resources],
  );

  const filtered = useMemo(
    () => (type === "all" ? resources : resources.filter((r) => r.type === type)),
    [resources, type],
  );

  const groups = useMemo(() => {
    if (groupBy === "type") {
      return RESOURCE_TYPES.filter((t) => filtered.some((r) => r.type === t)).map((t) => ({
        key: t,
        name: RESOURCE_TYPE_LABELS[t],
        items: filtered.filter((r) => r.type === t),
      }));
    }
    const subs = category.subcategories
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((sub) => ({
        key: sub.id,
        name: sub.name,
        items: filtered.filter((r) => r.subcategoryId === sub.id),
      }))
      .filter((g) => g.items.length > 0);
    const ungrouped = filtered.filter(
      (r) => !r.subcategoryId || !category.subcategories.some((s) => s.id === r.subcategoryId),
    );
    if (ungrouped.length) subs.push({ key: "general", name: "General", items: ungrouped });
    return subs;
  }, [filtered, groupBy, category.subcategories]);

  return (
    <div>
      {/* Barra de vistas dinámicas */}
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Filtro por tipo */}
        <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
          <FilterChip
            active={type === "all"}
            onClick={() => setType("all")}
            label="Todos"
            count={resources.length}
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

        {/* Modo de agrupación */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <GroupBtn
            active={groupBy === "sub"}
            onClick={() => setGroupBy("sub")}
            icon={<LayoutGrid className="h-3.5 w-3.5" />}
            label="Por departamento"
          />
          <GroupBtn
            active={groupBy === "type"}
            onClick={() => setGroupBy("type")}
            icon={<Shapes className="h-3.5 w-3.5" />}
            label="Por tipo"
          />
        </div>
      </div>

      {/* Grupos */}
      <div className="space-y-12 pb-4">
        {groups.map((group) => (
          <section key={group.key}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-display text-lg font-semibold text-white">{group.name}</h2>
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
        ))}
      </div>
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
          "rounded-md px-1.5 text-xs " +
          (active ? "bg-white/15 text-white" : "bg-white/5 text-muted")
        }
      >
        {count}
      </span>
    </button>
  );
}

function GroupBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors " +
        (active ? "bg-brand-500/25 text-white" : "text-muted hover:text-white")
      }
    >
      {icon}
      {label}
    </button>
  );
}
