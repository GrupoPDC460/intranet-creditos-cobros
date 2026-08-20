"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  Download,
  Loader2,
  Star,
  ExternalLink,
} from "lucide-react";
import type { Category, Resource, ResourceInput } from "@/lib/types";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/lib/types";
import { typeIcon, TYPE_TINT } from "@/lib/icons";
import { useToast } from "@/components/providers";
import { Modal, ConfirmDialog, Toggle, ReadOnlyBanner } from "@/components/admin/ui";

interface Props {
  categories: Category[];
  resources: Resource[];
  writable: boolean;
  openNew?: boolean;
  openImport?: boolean;
}

const EMPTY = (categoryId: string): ResourceInput => ({
  name: "",
  description: "",
  url: "",
  categoryId,
  subcategoryId: null,
  type: "sistema",
  icon: null,
  imageUrl: null,
  order: 0,
  active: true,
  featured: false,
  openInNewTab: true,
});

export function ResourcesAdmin({
  categories,
  resources,
  writable,
  openNew,
  openImport,
}: Props) {
  const { toast } = useToast();

  // Recarga garantizada desde el servidor. router.refresh() no siempre repinta
  // la lista en producción, así que tras agregar/editar/eliminar recargamos la
  // ruta limpia para que el cambio se vea siempre al instante.
  function reloadFresh() {
    setTimeout(() => window.location.assign("/admin/recursos"), 450);
  }

  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");

  const [formOpen, setFormOpen] = useState(Boolean(openNew));
  const [editing, setEditing] = useState<Resource | null>(null);
  const [importOpen, setImportOpen] = useState(Boolean(openImport));
  const [toDelete, setToDelete] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Cambios optimistas de los toggles (activo/destacado): se ven al instante en
  // pantalla y se confirman contra la base; si la API falla, se revierten.
  const [overrides, setOverrides] = useState<Record<string, Partial<Resource>>>({});

  const catName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return resources
      .map((r) => (overrides[r.id] ? { ...r, ...overrides[r.id] } : r))
      .filter((r) => {
      if (catFilter !== "all" && r.categoryId !== catFilter) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        (r.description ?? "").toLowerCase().includes(term) ||
        (catName.get(r.categoryId) ?? "").toLowerCase().includes(term)
      );
    });
  }, [resources, query, catFilter, catName, overrides]);

  async function patchResource(id: string, patch: Record<string, unknown>) {
    // Optimista: refleja el cambio de inmediato en pantalla.
    setOverrides((o) => ({ ...o, [id]: { ...o[id], ...(patch as Partial<Resource>) } }));
    const res = await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      // Revertir el cambio optimista si el servidor lo rechaza.
      setOverrides((o) => {
        const next = { ...o };
        delete next[id];
        return next;
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "No se pudo actualizar.", "error");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await fetch(`/api/resources/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast("Recurso eliminado", "success");
      setToDelete(null);
      reloadFresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "No se pudo eliminar.", "error");
    }
  }

  function exportCsv() {
    const rows = resources.map((r) => ({
      nombre: r.name,
      url: r.url,
      categoria: catName.get(r.categoryId) ?? "",
      subcategoria:
        categories
          .find((c) => c.id === r.categoryId)
          ?.subcategories.find((s) => s.id === r.subcategoryId)?.name ?? "",
      tipo: RESOURCE_TYPE_LABELS[r.type],
      descripcion: r.description ?? "",
      destacado: r.featured ? "Sí" : "No",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recursos-pdc.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Recursos</h1>
          <p className="text-sm text-muted">
            {resources.length} recursos en total.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="btn btn-ghost">
            <Download className="h-4 w-4" /> Exportar
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="btn btn-ghost"
            disabled={!writable}
          >
            <Upload className="h-4 w-4" /> Importar
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="btn btn-primary"
            disabled={!writable}
          >
            <Plus className="h-4 w-4" /> Nuevo recurso
          </button>
        </div>
      </div>

      {!writable && <ReadOnlyBanner />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar recursos…"
            className="field pl-9"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="field max-w-[14rem]"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            No hay recursos que coincidan con el filtro.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {filtered.map((r) => {
              const Icon = typeIcon(r.type);
              const tint = TYPE_TINT[r.type];
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
                >
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
                        aria-label="Abrir URL"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {catName.get(r.categoryId)} · {RESOURCE_TYPE_LABELS[r.type]}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <Star
                        className="h-3.5 w-3.5"
                        style={{
                          color: r.featured ? "#F5A623" : "#9AA6C7",
                          fill: r.featured ? "#F5A623" : "transparent",
                        }}
                      />
                      <Toggle
                        checked={r.featured}
                        onChange={(v) => writable && patchResource(r.id, { featured: v })}
                        label="Destacado"
                      />
                    </label>
                    <label className="hidden items-center gap-2 text-xs text-muted sm:flex">
                      Activo
                      <Toggle
                        checked={r.active}
                        onChange={(v) => writable && patchResource(r.id, { active: v })}
                        label="Activo"
                      />
                    </label>
                    <button
                      onClick={() => {
                        setEditing(r);
                        setFormOpen(true);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted hover:text-white"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setToDelete(r)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted hover:text-rose-300"
                      aria-label="Eliminar"
                      disabled={!writable}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ResourceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories}
        editing={editing}
        onSaved={() => {
          setFormOpen(false);
          reloadFresh();
        }}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={() => {
          setImportOpen(false);
          reloadFresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar recurso"
        message={`¿Seguro que deseas eliminar “${toDelete?.name}”? Esta acción no se puede deshacer.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

/* --------------------------------- Formulario -------------------------------- */

function ResourceForm({
  open,
  onClose,
  categories,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  editing: Resource | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const firstCat = categories[0]?.id ?? "";
  const [form, setForm] = useState<ResourceInput>(EMPTY(firstCat));
  const [saving, setSaving] = useState(false);
  const [initedFor, setInitedFor] = useState<string | null>(null);

  // Inicializa el formulario cuando cambia el recurso en edición o se abre nuevo.
  const editKey = editing?.id ?? "new";
  if (open && initedFor !== editKey) {
    setInitedFor(editKey);
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description ?? "",
        url: editing.url,
        categoryId: editing.categoryId,
        subcategoryId: editing.subcategoryId ?? null,
        type: editing.type,
        icon: editing.icon ?? null,
        imageUrl: editing.imageUrl ?? null,
        order: editing.order,
        active: editing.active,
        featured: editing.featured,
        openInNewTab: editing.openInNewTab,
      });
    } else {
      setForm(EMPTY(firstCat));
    }
  }
  if (!open && initedFor !== null) setInitedFor(null);

  const subcategories =
    categories.find((c) => c.id === form.categoryId)?.subcategories ?? [];

  function set<K extends keyof ResourceInput>(key: K, value: ResourceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name.trim() || !form.url.trim() || !form.categoryId) {
      toast("Nombre, URL y categoría son obligatorios.", "error");
      return;
    }
    setSaving(true);
    const url = editing ? `/api/resources/${editing.id}` : "/api/resources";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast(editing ? "Recurso actualizado" : "Recurso creado", "success");
      onSaved();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "No se pudo guardar.", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar recurso" : "Nuevo recurso"} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nombre</label>
          <input
            className="field"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Dashboard de Cartera"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Descripción</label>
          <input
            className="field"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Consulta de cartera vigente y vencida"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">URL</label>
          <input
            className="field"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="label">Categoría</label>
          <select
            className="field"
            value={form.categoryId}
            onChange={(e) => {
              set("categoryId", e.target.value);
              set("subcategoryId", null);
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Subcategoría</label>
          <select
            className="field"
            value={form.subcategoryId ?? ""}
            onChange={(e) => set("subcategoryId", e.target.value || null)}
          >
            <option value="">— Ninguna —</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select
            className="field"
            value={form.type}
            onChange={(e) => set("type", e.target.value as ResourceInput["type"])}
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Orden</label>
          <input
            type="number"
            className="field"
            value={form.order}
            onChange={(e) => set("order", Number(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Icono Lucide (opcional)</label>
          <input
            className="field"
            value={form.icon ?? ""}
            onChange={(e) => set("icon", e.target.value || null)}
            placeholder="ej. bar-chart-3 (deja vacío para usar el del tipo)"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-white">Activo</span>
          <Toggle checked={form.active} onChange={(v) => set("active", v)} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-white">Destacado</span>
          <Toggle checked={form.featured} onChange={(v) => set("featured", v)} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2">
          <span className="text-sm text-white">Abrir en nueva pestaña</span>
          <Toggle checked={form.openInNewTab} onChange={(v) => set("openInNewTab", v)} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-ghost">
          Cancelar
        </button>
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------ Importación CSV ------------------------------ */

function ImportDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function run() {
    const parsed = Papa.parse(text.trim(), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) =>
        h
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
    });
    const rows = parsed.data as Record<string, string>[];
    if (!rows.length) {
      toast("No se detectaron filas válidas.", "error");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    setBusy(false);
    if (res.ok) {
      const data = (await res.json()) as { created: number; errors: string[] };
      toast(
        `Importados ${data.created} recursos${
          data.errors.length ? `, ${data.errors.length} con error` : ""
        }.`,
        data.errors.length ? "info" : "success",
      );
      setText("");
      onDone();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "No se pudo importar.", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Importar recursos (CSV)" wide>
      <p className="mb-3 text-sm text-muted">
        Encabezados: <code className="rounded bg-white/10 px-1">nombre, url, categoria, subcategoria, tipo, descripcion, destacado</code>.
        Las categorías inexistentes se crean automáticamente.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        className="mb-3 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        className="field font-mono text-xs"
        placeholder={"nombre,url,categoria,subcategoria,tipo,descripcion,destacado\nKACE,https://...,Operaciones,Sistemas,Sistema,Mesa de servicio,Sí"}
      />
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-ghost">
          Cancelar
        </button>
        <button onClick={run} disabled={busy || !text.trim()} className="btn btn-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
        </button>
      </div>
    </Modal>
  );
}
