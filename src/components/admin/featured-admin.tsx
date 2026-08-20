"use client";

import { useRouter } from "next/navigation";
import { Star, ExternalLink } from "lucide-react";
import type { Category, Resource } from "@/lib/types";
import { RESOURCE_TYPE_LABELS } from "@/lib/types";
import { typeIcon, TYPE_TINT } from "@/lib/icons";
import { useToast } from "@/components/providers";
import { Toggle, ReadOnlyBanner } from "@/components/admin/ui";
import { EmptyState } from "@/components/ui";

export function FeaturedAdmin({
  resources,
  categories,
  writable,
}: {
  resources: Resource[];
  categories: Category[];
  writable: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  async function setFeatured(id: string, featured: boolean) {
    const res = await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured }),
    });
    if (res.ok) {
      toast(featured ? "Marcado como destacado" : "Quitado de destacados", "success");
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "No se pudo actualizar.", "error");
    }
  }

  const featured = resources.filter((r) => r.featured);
  const rest = resources.filter((r) => !r.featured);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white">Destacados</h1>
        <p className="text-sm text-muted">
          Los recursos destacados aparecen en “Accesos rápidos” y “Recursos destacados”.
        </p>
      </div>

      {!writable && <ReadOnlyBanner />}

      <h2 className="mb-3 font-display text-lg font-semibold text-white">
        Destacados actuales ({featured.length})
      </h2>
      {featured.length === 0 ? (
        <EmptyState
          icon={<Star className="h-5 w-5" />}
          title="Sin recursos destacados"
          description="Activa el interruptor en cualquier recurso para destacarlo en la portada."
        />
      ) : (
        <div className="glass mb-8 overflow-hidden rounded-2xl">
          <ul className="divide-y divide-white/[0.06]">
            {featured.map((r) => (
              <Row
                key={r.id}
                r={r}
                catName={catName.get(r.categoryId) ?? ""}
                writable={writable}
                onToggle={setFeatured}
              />
            ))}
          </ul>
        </div>
      )}

      <h2 className="mb-3 font-display text-lg font-semibold text-white">
        Otros recursos
      </h2>
      <div className="glass overflow-hidden rounded-2xl">
        {rest.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            No hay más recursos.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {rest.map((r) => (
              <Row
                key={r.id}
                r={r}
                catName={catName.get(r.categoryId) ?? ""}
                writable={writable}
                onToggle={setFeatured}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({
  r,
  catName,
  writable,
  onToggle,
}: {
  r: Resource;
  catName: string;
  writable: boolean;
  onToggle: (id: string, featured: boolean) => void;
}) {
  const Icon = typeIcon(r.type);
  const tint = TYPE_TINT[r.type];
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10"
        style={{ background: `${tint}18` }}
      >
        <Icon className="h-4 w-4" style={{ color: tint }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{r.name}</p>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-brand-glow"
            aria-label="Abrir"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="truncate text-xs text-muted">
          {catName} · {RESOURCE_TYPE_LABELS[r.type]}
        </p>
      </div>
      <Toggle
        checked={r.featured}
        onChange={(v) => writable && onToggle(r.id, v)}
        label="Destacado"
      />
    </li>
  );
}
