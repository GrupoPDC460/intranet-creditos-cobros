import Link from "next/link";
import {
  Link2,
  CircleCheck,
  FolderTree,
  Star,
  Plus,
  Upload,
  ArrowUpRight,
} from "lucide-react";
import { getRepository } from "@/lib/data/repository";
import { RESOURCE_TYPE_LABELS } from "@/lib/types";
import { resourceIcon, TYPE_TINT } from "@/lib/icons";
import { ReadOnlyBanner } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

function StatCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 shadow-glass">
      <div className="flex items-center justify-between">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10"
          style={{ background: `${tint}18`, color: tint }}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold text-white">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const repo = getRepository();
  const { categories, resources } = await repo.getAll();

  const activos = resources.filter((r) => r.active).length;
  const destacados = resources.filter((r) => r.featured).length;
  const recientes = resources
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-muted">Resumen del contenido de la intranet.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/recursos?nuevo=1" className="btn btn-primary">
            <Plus className="h-4 w-4" /> Nuevo recurso
          </Link>
          <Link href="/admin/recursos?importar=1" className="btn btn-ghost">
            <Upload className="h-4 w-4" /> Importar
          </Link>
        </div>
      </div>

      {!repo.writable && <ReadOnlyBanner />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Link2 className="h-5 w-5" />} label="Recursos totales" value={resources.length} tint="#7DBFE6" />
        <StatCard icon={<CircleCheck className="h-5 w-5" />} label="Recursos activos" value={activos} tint="#21A366" />
        <StatCard icon={<FolderTree className="h-5 w-5" />} label="Categorías" value={categories.length} tint="#8B9DF5" />
        <StatCard icon={<Star className="h-5 w-5" />} label="Destacados" value={destacados} tint="#F3B24E" />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">
            Últimos recursos agregados
          </h2>
          <Link
            href="/admin/recursos"
            className="inline-flex items-center gap-1 text-sm text-brand-glow hover:underline"
          >
            Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="glass overflow-hidden rounded-2xl">
          {recientes.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              Aún no hay recursos. Crea el primero.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {recientes.map((r) => {
                const Icon = resourceIcon(r);
                const tint = TYPE_TINT[r.type];
                return (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10"
                      style={{ background: `${tint}18` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: tint }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{r.name}</p>
                      <p className="truncate text-xs text-muted">
                        {catName.get(r.categoryId)} · {RESOURCE_TYPE_LABELS[r.type]}
                      </p>
                    </div>
                    {r.featured && (
                      <Star className="h-4 w-4 shrink-0" style={{ color: "#F3B24E", fill: "#F3B24E" }} />
                    )}
                    {!r.active && <span className="chip">Inactivo</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
