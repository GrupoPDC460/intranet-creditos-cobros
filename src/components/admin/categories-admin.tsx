"use client";

import { useMemo, useState } from "react";
import { IconPicker, NamedIcon } from "@/components/admin/icon-picker";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { useToast } from "@/components/providers";
import { Modal, ConfirmDialog, Toggle, ReadOnlyBanner } from "@/components/admin/ui";

interface SubDraft {
  id?: string;
  name: string;
}
interface Draft {
  name: string;
  description: string;
  icon: string;
  order: number;
  active: boolean;
  subcategories: SubDraft[];
}

const EMPTY: Draft = {
  name: "",
  description: "",
  icon: "folder",
  order: 0,
  active: true,
  subcategories: [],
};

function CatIcon({ name }: { name?: string | null }) {
  return <NamedIcon name={name ?? "folder"} />;
}

export function CategoriesAdmin({
  categories,
  counts,
  writable,
}: {
  categories: Category[];
  counts: Record<string, number>;
  writable: boolean;
}) {
  const { toast } = useToast();

  // Recarga garantizada desde el servidor tras crear/editar/eliminar, porque
  // router.refresh() no siempre repinta la lista en producción.
  function reloadFresh() {
    setTimeout(() => window.location.assign("/admin/categorias"), 450);
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ordered = useMemo(
    () => categories.slice().sort((a, b) => a.order - b.order),
    [categories],
  );

  function openNew() {
    setEditing(null);
    setDraft({ ...EMPTY, order: categories.length + 1 });
    setFormOpen(true);
  }
  function openEdit(c: Category) {
    setEditing(c);
    setDraft({
      name: c.name,
      description: c.description ?? "",
      icon: c.icon ?? "folder",
      order: c.order,
      active: c.active,
      subcategories: c.subcategories
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => ({ id: s.id, name: s.name })),
    });
    setFormOpen(true);
  }

  async function save() {
    if (!draft.name.trim()) {
      toast("El nombre es obligatorio.", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      slug: slugify(draft.name),
      description: draft.description.trim() || null,
      icon: draft.icon.trim() || null,
      order: draft.order,
      active: draft.active,
      subcategories: draft.subcategories
        .filter((s) => s.name.trim())
        .map((s, i) => ({
          id: s.id,
          name: s.name.trim(),
          slug: slugify(s.name),
          order: i + 1,
        })),
    };
    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      toast(editing ? "Categoría actualizada" : "Categoría creada", "success");
      setFormOpen(false);
      reloadFresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "No se pudo guardar.", "error");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await fetch(`/api/categories/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast("Categoría eliminada", "success");
      setToDelete(null);
      reloadFresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "No se pudo eliminar.", "error");
    }
  }

  async function move(cat: Category, dir: -1 | 1) {
    await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: cat.order + dir }),
    });
    reloadFresh();
  }

  function setSub(i: number, name: string) {
    setDraft((d) => {
      const subs = d.subcategories.slice();
      subs[i] = { ...subs[i], name };
      return { ...d, subcategories: subs };
    });
  }
  function addSub() {
    setDraft((d) => ({ ...d, subcategories: [...d.subcategories, { name: "" }] }));
  }
  function removeSub(i: number) {
    setDraft((d) => ({
      ...d,
      subcategories: d.subcategories.filter((_, idx) => idx !== i),
    }));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Categorías</h1>
          <p className="text-sm text-muted">
            Organiza la estructura de la intranet.
          </p>
        </div>
        <button onClick={openNew} className="btn btn-primary" disabled={!writable}>
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      {!writable && <ReadOnlyBanner />}

      <div className="grid gap-3">
        {ordered.map((c, i) => (
          <div key={c.id} className="glass rounded-2xl p-4 shadow-glass">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
                <CatIcon name={c.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display text-base font-semibold text-white">
                    {c.name}
                  </h3>
                  {!c.active && <span className="chip">Inactiva</span>}
                </div>
                {c.description && (
                  <p className="truncate text-sm text-muted">{c.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="chip">{counts[c.id] ?? 0} recursos</span>
                  {c.subcategories
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((s) => (
                      <span
                        key={s.id}
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[0.72rem] text-muted"
                      >
                        {s.name}
                      </span>
                    ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div className="mr-1 hidden flex-col sm:flex">
                  <button
                    onClick={() => writable && i > 0 && move(c, -1)}
                    className="grid h-5 w-6 place-items-center text-muted hover:text-white disabled:opacity-30"
                    disabled={!writable || i === 0}
                    aria-label="Subir"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => writable && i < ordered.length - 1 && move(c, 1)}
                    className="grid h-5 w-6 place-items-center text-muted hover:text-white disabled:opacity-30"
                    disabled={!writable || i === ordered.length - 1}
                    aria-label="Bajar"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => openEdit(c)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted hover:text-white"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setToDelete(c)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted hover:text-rose-300"
                  aria-label="Eliminar"
                  disabled={!writable}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        wide
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre</label>
            <input
              className="field"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Cobros"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Icono</label>
            <IconPicker
              value={draft.icon || "folder"}
              onChange={(icon) => setDraft((d) => ({ ...d, icon }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción</label>
            <input
              className="field"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Cartera vigente y vencida"
            />
          </div>
          <div>
            <label className="label">Orden</label>
            <input
              type="number"
              className="field"
              value={draft.order}
              onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-white">Activa</span>
            <Toggle
              checked={draft.active}
              onChange={(v) => setDraft((d) => ({ ...d, active: v }))}
            />
          </div>

          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Subcategorías</label>
              <button
                onClick={addSub}
                className="inline-flex items-center gap-1 text-sm text-brand-glow hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>
            <div className="space-y-2">
              {draft.subcategories.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-sm text-muted">
                  Sin subcategorías. Agrega las que necesites (Sistemas, Dashboards…).
                </p>
              )}
              {draft.subcategories.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted/50" />
                  <input
                    className="field"
                    value={s.name}
                    onChange={(e) => setSub(i, e.target.value)}
                    placeholder="Sistemas"
                  />
                  <button
                    onClick={() => removeSub(i)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted hover:text-rose-300"
                    aria-label="Quitar subcategoría"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setFormOpen(false)} className="btn btn-ghost">
            Cancelar
          </button>
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar categoría"
        message={`¿Eliminar “${toDelete?.name}”? Se eliminarán también sus subcategorías y los recursos que contenga. Esta acción no se puede deshacer.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
