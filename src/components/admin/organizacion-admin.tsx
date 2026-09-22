"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import {
  ChevronLeft, ChevronRight, Folder, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, ImagePlus, X,
} from "lucide-react";
import { useToast } from "@/components/providers";

function Ico({ name, className }: { name?: string | null; className?: string }) {
  const key = name ? name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()).replace(/^./, (c: string) => c.toUpperCase()) : "Folder";
  const C = (Icons as unknown as Record<string, Icons.LucideIcon>)[key] ?? Icons.Folder;
  return <C className={className} />;
}

interface Dept { id: string; name: string; icon: string | null; responsible: string | null; cover_image: string | null; count: number; }
interface Cat { id: string; name: string; icon: string | null; subcategories: Dept[]; }
interface RC { id: string; name: string; icon: string | null; subcategoryId: string | null; categoryId: string | null; order: number; count: number; }
interface Res { id: string; name: string; type: string; subcategoryId: string | null; resourceCategoryId: string | null; }

export function OrganizacionAdmin({
  categories, resourceCategories, resources,
}: {
  categories: Cat[];
  resourceCategories: RC[];
  resources: Res[];
}) {
  const { toast } = useToast();
  const [folder, setFolder] = useState<Cat | null>(null);
  const [dept, setDept] = useState<Dept | null>(null);
  const [rcs, setRcs] = useState<RC[]>(resourceCategories);
  const [busy, setBusy] = useState(false);
  const [uploadingCover, setUploadingCover] = useState<string | null>(null);
  const [assignCat, setAssignCat] = useState<RC | null>(null);

  function reload() { setTimeout(() => window.location.assign("/admin/organizacion"), 400); }

  async function uploadDeptCover(subId: string, file: File) {
    setUploadingCover(subId);
    try {
      const fd = new FormData(); fd.append("file", file);
      const up = await fetch("/api/upload-cover", { method: "POST", body: fd });
      const data = (await up.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!up.ok || !data.url) { toast(data.error ?? "No se pudo subir.", "error"); return; }
      const res = await fetch(`/api/subcategories/${subId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_image: data.url }),
      });
      if (res.ok) { toast("Portada actualizada", "success"); reload(); }
      else toast("No se pudo guardar.", "error");
    } finally { setUploadingCover(null); }
  }

  async function removeDeptCover(subId: string) {
    if (!window.confirm("¿Quitar la portada de este departamento?")) return;
    const res = await fetch(`/api/subcategories/${subId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cover_image: null }),
    });
    if (res.ok) reload();
  }

  // Categorías de recursos del departamento actual
  const deptRCs = dept
    ? rcs.filter((r) => r.subcategoryId === dept.id).sort((a, b) => a.order - b.order)
    : [];

  async function addRC() {
    if (!dept) return;
    const name = window.prompt("Nombre de la categoría (ej. Sistemas, Dashboard):");
    if (!name?.trim()) return;
    const icon = window.prompt("Ícono (opcional, ej. monitor, cloud, bar-chart-3):", "folder") || null;
    setBusy(true);
    try {
      const res = await fetch("/api/resource-categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon, subcategoryId: dept.id, order: deptRCs.length + 1 }),
      });
      if (res.ok) { toast("Categoría creada", "success"); reload(); }
      else toast("No se pudo crear.", "error");
    } finally { setBusy(false); }
  }

  async function renameRC(rc: RC) {
    const name = window.prompt("Nuevo nombre:", rc.name);
    if (!name?.trim() || name === rc.name) return;
    const res = await fetch(`/api/resource-categories/${rc.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) reload(); else toast("No se pudo renombrar.", "error");
  }

  async function changeIconRC(rc: RC) {
    const icon = window.prompt("Ícono (ej. monitor, cloud, bar-chart-3, file-text):", rc.icon || "folder");
    if (icon === null) return;
    const res = await fetch(`/api/resource-categories/${rc.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon: icon || null }),
    });
    if (res.ok) reload(); else toast("No se pudo cambiar.", "error");
  }

  async function delRC(rc: RC) {
    if (!window.confirm(`¿Eliminar la categoría "${rc.name}"? Los ${rc.count} recursos quedarán sin categoría (no se borran).`)) return;
    const res = await fetch(`/api/resource-categories/${rc.id}`, { method: "DELETE" });
    if (res.ok) { toast("Categoría eliminada", "success"); reload(); }
    else toast("No se pudo eliminar.", "error");
  }

  async function toggleResourceInCat(res: Res, rc: RC) {
    const isIn = res.resourceCategoryId === rc.id;
    const newVal = isIn ? null : rc.id;
    const r = await fetch(`/api/resources/assign-category`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceIds: [res.id], resourceCategoryId: newVal }),
    });
    if (r.ok) {
      // Actualizar en memoria
      res.resourceCategoryId = newVal;
      setAssignCat({ ...rc });
    } else {
      toast("No se pudo asignar.", "error");
    }
  }

  async function moveRC(idx: number, dir: -1 | 1) {
    const arr = [...deptRCs];
    const sw = idx + dir;
    if (sw < 0 || sw >= arr.length) return;
    const a = arr[idx], b = arr[sw];
    await Promise.all([
      fetch(`/api/resource-categories/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/resource-categories/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ]);
    reload();
  }

  // ── Vista: categorías de un departamento ──
  if (dept && folder) {
    return (
      <div>
        <button onClick={() => setDept(null)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
          <ChevronLeft className="h-4 w-4" /> {folder.name}
        </button>
        <div className="mb-2 text-xs uppercase tracking-widest text-muted">{folder.name} › Departamento</div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-white">{dept.name}</h1>
          <button onClick={addRC} disabled={busy} className="btn btn-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Nueva categoría
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">Ordena las categorías con las flechas. Así se muestran en el portal.</p>

        {deptRCs.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted">
            Este departamento no tiene categorías. Sus recursos se muestran directos. Crea una con “Nueva categoría”.
          </div>
        ) : (
          <ul className="space-y-2">
            {deptRCs.map((rc, i) => (
              <li key={rc.id} className="glass flex items-center gap-3 rounded-xl px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-brand-glow">
                  <Ico name={rc.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{rc.name}</p>
                  <p className="text-xs text-muted">{rc.count} {rc.count === 1 ? "recurso" : "recursos"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="mr-1 flex flex-col">
                    <button onClick={() => moveRC(i, -1)} disabled={i === 0} className="text-muted hover:text-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => moveRC(i, 1)} disabled={i === deptRCs.length - 1} className="text-muted hover:text-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                  <button onClick={() => changeIconRC(rc)} className="btn btn-ghost px-2 py-1.5" title="Ícono"><Ico name={rc.icon} className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setAssignCat(rc)} className="btn btn-ghost px-2 py-1.5" title="Asignar recursos"><Icons.ListPlus className="h-3.5 w-3.5" /></button>
                  <button onClick={() => renameRC(rc)} className="btn btn-ghost px-2 py-1.5" title="Renombrar"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => delRC(rc)} className="btn btn-danger px-2 py-1.5" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Modal: asignar recursos a la categoría */}
        {assignCat && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4">
            <div className="glass-strong flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-glass-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">Recursos en “{assignCat.name}”</h3>
                  <p className="text-xs text-muted">Marca los recursos que pertenecen a esta categoría</p>
                </div>
                <button onClick={() => { setAssignCat(null); reload(); }} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-muted hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto p-4">
                {resources.filter((r) => r.subcategoryId === dept.id).length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">Este departamento no tiene recursos aún.</p>
                ) : (
                  resources.filter((r) => r.subcategoryId === dept.id).map((res) => {
                    const isIn = res.resourceCategoryId === assignCat.id;
                    const inOther = res.resourceCategoryId && res.resourceCategoryId !== assignCat.id;
                    return (
                      <button
                        key={res.id}
                        onClick={() => toggleResourceInCat(res, assignCat)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                          isIn ? "border-brand-400 bg-brand-500/15 text-white" : "border-white/10 bg-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border-2 ${isIn ? "border-brand-400 bg-brand-500 text-white" : "border-white/30"}`}>
                          {isIn && <svg className="h-3 w-3" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </span>
                        <span className="flex-1 truncate">{res.name}</span>
                        {inOther && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[0.65rem] text-muted">en otra categoría</span>}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-t border-white/10 p-4">
                <button onClick={() => { setAssignCat(null); reload(); }} className="btn btn-primary w-full">Listo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (folder) {
    return (
      <div>
        <button onClick={() => setFolder(null)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Carpetas
        </button>
        <h1 className="mb-1 font-display text-2xl font-semibold text-white">{folder.name}</h1>
        <p className="mb-6 text-muted">Elige un departamento para gestionar sus categorías de recursos.</p>
        {folder.subcategories.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted">
            Esta carpeta no tiene departamentos. Puedes crear departamentos desde <strong className="text-white">Categorías</strong>.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {folder.subcategories.map((s) => (
              <div key={s.id} className="glass sheen group relative overflow-hidden rounded-2xl transition-transform hover:-translate-y-1">
                {/* Portada del departamento */}
                {s.cover_image && (
                  <div className="relative h-24 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.cover_image} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}
                {/* Ícono para subir/cambiar portada — esquina superior derecha */}
                <label
                  className="absolute right-2 top-2 z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-lg bg-black/50 text-white transition-colors hover:bg-brand-glow hover:text-ink"
                  title={s.cover_image ? "Cambiar portada" : "Subir portada"}
                  onClick={(e) => e.stopPropagation()}
                >
                  {uploadingCover === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDeptCover(s.id, f); }} />
                </label>
                {s.cover_image && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeDeptCover(s.id); }}
                    className="absolute right-11 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg bg-black/50 text-white hover:bg-rose-600"
                    title="Quitar portada"
                  ><X className="h-4 w-4" /></button>
                )}
                {/* Cuerpo clickeable para entrar al departamento */}
                <button onClick={() => setDept(s)} className="flex w-full items-center gap-3 p-4 text-left">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
                    <Ico name={s.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{s.name}</p>
                    {s.responsible && <p className="text-xs text-brand-glow">{s.responsible}</p>}
                    <p className="text-xs text-muted">{s.count} recursos · {rcs.filter(r => r.subcategoryId === s.id).length} categorías</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted transition-colors group-hover:text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Vista raíz: carpetas ──
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white">Organización</h1>
        <p className="text-muted">Gestiona la estructura: Carpeta → Departamento → Categorías de recursos.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <button key={c.id} onClick={() => setFolder(c)} className="glass sheen group flex items-center gap-3 rounded-2xl p-4 text-left transition-transform hover:-translate-y-1">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
              <Ico name={c.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{c.name}</p>
              <p className="text-xs text-muted">{c.subcategories.length} departamentos</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted transition-colors group-hover:text-white" />
          </button>
        ))}
      </div>
    </div>
  );
}
