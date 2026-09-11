"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Camera, Plus, Upload, X, ChevronLeft, ChevronRight, Trash2, Loader2,
  Images, Play, Pencil, FolderPlus, Sparkles, Pause, RotateCw,
  FolderInput, ArrowUp, ArrowDown, ImagePlus, CheckSquare, Square,
  MoveRight, Star,
} from "lucide-react";

interface Album {
  id: string; name: string; description: string | null;
  cover_url: string | null; parent_id: string | null;
  order: number; cover_rotation: number; count: number; children: Album[];
}
interface Photo {
  id: string; album_id: string; url: string;
  caption: string | null; rotation: number;
}
type View = "root" | "album" | "memories" | "slideshow-all";

export function CulturaGallery({ albums: initial, isAdmin }: { albums: Album[]; isAdmin: boolean }) {
  const [albums, setAlbums]               = useState<Album[]>(initial);
  const [view, setView]                   = useState<View>("root");
  const [openAlbum, setOpenAlbum]         = useState<Album | null>(null);
  const [albumStack, setAlbumStack]       = useState<Album[]>([]);
  const [photos, setPhotos]               = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos]         = useState<Photo[]>([]);
  const [loading, setLoading]             = useState(false);
  const [lightbox, setLightbox]           = useState<number | null>(null);
  const [rotations, setRotations]         = useState<Record<string, number>>({});
  const [playing, setPlaying]             = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [memories, setMemories]           = useState<Photo[]>([]);
  const [memLoading, setMemLoading]       = useState(false);
  // ── Selección tipo Windows ──────────────────────────────────────────
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode]       = useState(false);
  const [lastSelected, setLastSelected]   = useState<number | null>(null);
  const [showMovePanel, setShowMovePanel] = useState(false);
  const [allAlbumsList, setAllAlbumsList] = useState<{id:string;name:string;parent_id:string|null}[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Teclado ────────────────────────────────────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    const cur = view === "slideshow-all" ? allPhotos : (view === "memories" ? memories : photos);
    if (lightbox !== null) {
      if (e.key === "Escape")      { setLightbox(null); setPlaying(false); }
      if (e.key === "ArrowRight")  setLightbox(i => (i !== null && i < cur.length-1) ? i+1 : i);
      if (e.key === "ArrowLeft")   setLightbox(i => (i !== null && i > 0) ? i-1 : i);
      if (e.key === "r" || e.key === "R") {
        if (lightbox !== null && cur[lightbox]) rotatePhoto(cur[lightbox].id);
      }
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
      return;
    }
    // Fuera del lightbox
    if (e.key === "Escape")  { setSelected(new Set()); setSelectMode(false); setShowMovePanel(false); }
    if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); setSelected(new Set(photos.map(p => p.id)));
    }
  }, [lightbox, photos, allPhotos, memories, view]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Slideshow automático ───────────────────────────────────────────
  useEffect(() => {
    const cur = view === "slideshow-all" ? allPhotos : photos;
    if (playing && lightbox !== null && cur.length > 0) {
      timerRef.current = setInterval(() => {
        setLightbox(i => (i !== null && i < cur.length-1) ? i+1 : i);
      }, 3000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, lightbox, photos, allPhotos, view]);

  // ── Navegación ────────────────────────────────────────────────────
  async function openAlbumView(a: Album, fromStack = false) {
    if (!fromStack && openAlbum) setAlbumStack(prev => [...prev, openAlbum]);
    setOpenAlbum(a); setView("album"); setLoading(true);
    setSelected(new Set()); setSelectMode(false);
    try {
      const res  = await fetch(`/api/cultura/photos?albumId=${a.id}`);
      const data = (await res.json()) as { photos?: Photo[] };
      const loaded = data.photos || [];
      setPhotos(loaded);
      const rots: Record<string, number> = {};
      for (const p of loaded) if (p.rotation) rots[p.id] = p.rotation;
      setRotations(prev => ({ ...prev, ...rots }));
    } finally { setLoading(false); }
  }

  async function goBack() {
    setSelected(new Set()); setSelectMode(false); setShowMovePanel(false);
    if (albumStack.length > 0) {
      const prev = albumStack[albumStack.length - 1];
      setAlbumStack(s => s.slice(0, -1));
      await openAlbumView(prev, true);
    } else {
      setView("root"); setOpenAlbum(null); setPhotos([]); setAlbumStack([]);
    }
  }

  // ── Selección tipo Windows ─────────────────────────────────────────
  function handlePhotoClick(ph: Photo, idx: number, e: React.MouseEvent) {
    if (!selectMode && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // Clic normal sin modo selección → abrir lightbox
      setLightbox(idx);
      return;
    }
    e.preventDefault();
    if (!selectMode) setSelectMode(true);

    if (e.shiftKey && lastSelected !== null) {
      // Shift+clic → seleccionar rango
      const lo = Math.min(lastSelected, idx);
      const hi = Math.max(lastSelected, idx);
      setSelected(prev => {
        const next = new Set(prev);
        for (let i = lo; i <= hi; i++) next.add(photos[i].id);
        return next;
      });
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl+clic → toggle individual
      setSelected(prev => {
        const next = new Set(prev);
        next.has(ph.id) ? next.delete(ph.id) : next.add(ph.id);
        return next;
      });
      setLastSelected(idx);
    } else {
      // Clic simple en modo selección → toggle
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(ph.id) && next.size === 1) {
          next.delete(ph.id);
          if (next.size < 1) setSelectMode(false);
        } else {
          next.has(ph.id) ? next.delete(ph.id) : next.add(ph.id);
        }
        return next;
      });
      setLastSelected(idx);
    }
  }

  function toggleSelectMode() {
    if (selectMode) { setSelected(new Set()); setSelectMode(false); setShowMovePanel(false); }
    else setSelectMode(true);
  }

  function selectAll() { setSelected(new Set(photos.map(p => p.id))); }

  // ── Mover fotos en lote ───────────────────────────────────────────
  function loadAllAlbumsFlat() {
    const flatten = (list: Album[], acc: {id:string;name:string;parent_id:string|null}[] = []) => {
      for (const a of list) { acc.push({id:a.id,name:a.name,parent_id:a.parent_id}); flatten(a.children,acc); }
      return acc;
    };
    setAllAlbumsList(flatten(albums));
  }

  async function doMove(targetAlbumId: string) {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const res = await fetch("/api/cultura/move", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds: ids, targetAlbumId }),
    });
    if (res.ok) {
      setPhotos(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set()); setSelectMode(false); setShowMovePanel(false);
    } else { alert("No se pudo mover."); }
  }

  // ── Acciones de álbum ─────────────────────────────────────────────
  async function rotatePhoto(photoId: string) {
    const cur  = rotations[photoId] ?? 0;
    const next = (cur + 90) % 360;
    setRotations(prev => ({ ...prev, [photoId]: next }));
    fetch("/api/cultura/rotate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photoId, rotation: next }),
    }).catch(console.error);
  }

  async function setCover(url: string, albumId?: string, photoId?: string) {
    const id = albumId ?? openAlbum?.id;
    if (!id) return;
    const rot = photoId ? (rotations[photoId] ?? 0) : 0;
    await fetch("/api/cultura/albums", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, coverUrl: url, coverRotation: rot }),
    });
  }

  // Busca el álbum raíz del stack actual (el que no tiene parent_id)
  function getRootAlbum(): Album | null {
    if (albumStack.length > 0) return albumStack[0];
    if (openAlbum && !openAlbum.parent_id) return openAlbum;
    return null;
  }

  async function upload(files: FileList | null) {
    if (!openAlbum || !files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData(); fd.append("albumId", openAlbum.id); fd.append("file", file);
        const res = await fetch("/api/cultura/upload", { method: "POST", body: fd });
        if (res.ok) {
          const { photo } = (await res.json()) as { photo: Photo };
          setPhotos(p => [...p, photo]);
        }
      }
    } finally { setUploading(false); }
  }

  async function delPhoto(id: string) {
    if (!window.confirm("¿Eliminar esta foto?")) return;
    const res = await fetch("/api/cultura/delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId: id }),
    });
    if (res.ok) setPhotos(p => p.filter(x => x.id !== id));
  }

  async function delSelected() {
    if (!window.confirm(`¿Eliminar ${selected.size} foto(s)? Esta acción no se puede deshacer.`)) return;
    for (const id of Array.from(selected)) {
      await fetch("/api/cultura/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: id }),
      });
    }
    setPhotos(prev => prev.filter(p => !selected.has(p.id)));
    setSelected(new Set()); setSelectMode(false);
  }

  async function newAlbum(parentId?: string) {
    const name = window.prompt(parentId ? "Nombre del sub-álbum:" : "Nombre del álbum:");
    if (!name?.trim()) return;
    const res = await fetch("/api/cultura/albums", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });
    if (res.ok) reload(); else alert("No se pudo crear.");
  }

  async function renameAlbum() {
    if (!openAlbum) return;
    const name = window.prompt("Nuevo nombre:", openAlbum.name);
    if (!name?.trim() || name.trim() === openAlbum.name) return;
    const res = await fetch("/api/cultura/albums", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: openAlbum.id, name }),
    });
    if (res.ok) reload(); else alert("No se pudo renombrar.");
  }

  async function delAlbum(id: string) {
    if (!window.confirm("¿Eliminar el álbum y todas sus fotos?")) return;
    const res = await fetch("/api/cultura/delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId: id }),
    });
    if (res.ok) reload();
  }

  async function moveAlbum(idx: number, dir: -1 | 1) {
    const arr = [...albums];
    const sw  = idx + dir;
    if (sw < 0 || sw >= arr.length) return;
    [arr[idx], arr[sw]] = [arr[sw], arr[idx]];
    const updated = arr.map((a, i) => ({ ...a, order: i + 1 }));
    setAlbums(updated);
    await fetch("/api/cultura/reorder", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated.map(a => ({ id: a.id, order: a.order }))),
    });
  }

  async function loadMemories() {
    setView("memories"); setMemLoading(true);
    try {
      const res  = await fetch("/api/cultura/memories");
      const data = (await res.json()) as { photos?: Photo[] };
      setMemories(data.photos || []);
    } finally { setMemLoading(false); }
  }

  async function startGlobalSlideshow() {
    setView("slideshow-all"); setLoading(true);
    try {
      const ids: string[] = [];
      const collect = (list: Album[]) => list.forEach(a => { ids.push(a.id); collect(a.children); });
      collect(albums);
      const all: Photo[] = [];
      for (const id of ids) {
        const res  = await fetch(`/api/cultura/photos?albumId=${id}`);
        const data = (await res.json()) as { photos?: Photo[] };
        all.push(...(data.photos || []));
      }
      setAllPhotos(all);
      if (all.length > 0) { setLightbox(0); setPlaying(true); }
    } finally { setLoading(false); }
  }

  function reload() { setTimeout(() => window.location.assign("/categoria/cultura"), 400); }

  // ── Lightbox ──────────────────────────────────────────────────────
  const curPhotos = view === "slideshow-all" ? allPhotos : (view === "memories" ? memories : photos);

  function Lightbox() {
    if (lightbox === null || !curPhotos[lightbox]) return null;
    const ph = curPhotos[lightbox];
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
        onClick={() => { setLightbox(null); setPlaying(false); }}>
        <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={() => { setLightbox(null); setPlaying(false); }}>
          <X className="h-5 w-5" />
        </button>
        <button className="absolute top-4 right-16 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={e => { e.stopPropagation(); setPlaying(p => !p); }}>
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        {lightbox > 0 && (
          <button className="absolute left-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1); }}>
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
        {lightbox < curPhotos.length - 1 && (
          <button className="absolute right-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1); }}>
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
        <button className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          title="Girar (R)" onClick={e => { e.stopPropagation(); rotatePhoto(ph.id); }}>
          <RotateCw className="h-5 w-5" />
        </button>
        <img src={ph.url} alt=""
          className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain transition-transform duration-300"
          style={{ transform: `rotate(${rotations[ph.id] ?? 0}deg)` }}
          onClick={e => e.stopPropagation()} />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/70">
          {lightbox + 1} / {curPhotos.length}
        </div>
      </div>
    );
  }

  // ── Panel de mover selección ──────────────────────────────────────
  function MovePanel() {
    if (!showMovePanel || !selected.size) return null;
    const options = allAlbumsList.filter(a => a.id !== openAlbum?.id);
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4">
        <div className="glass-strong w-full max-w-sm rounded-2xl p-6 shadow-glass-lg">
          <h3 className="mb-1 font-display text-lg font-semibold text-white">
            Mover {selected.size} foto{selected.size !== 1 ? "s" : ""} a…
          </h3>
          <p className="mb-4 text-sm text-muted">Selecciona la carpeta de destino</p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {options.map(a => (
              <button key={a.id} onClick={() => doMove(a.id)}
                className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-brand-500/20 hover:border-brand-400">
                <FolderInput className="h-4 w-4 shrink-0 text-brand-glow" />
                {a.parent_id ? <span className="text-muted/70 text-xs">↳&nbsp;</span> : null}
                {a.name}
              </button>
            ))}
          </div>
          <button onClick={() => setShowMovePanel(false)} className="btn btn-ghost mt-4 w-full">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Barra de selección (tipo Windows) ─────────────────────────────
  function SelectionBar() {
    if (!selectMode) return null;
    return (
      <div className="sticky top-16 z-40 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-400/40 bg-[#00216f]/80 px-4 py-2.5 backdrop-blur">
        <span className="text-sm font-semibold text-white">
          {selected.size === 0 ? "Selección activa" : `${selected.size} seleccionada${selected.size !== 1 ? "s" : ""}`}
        </span>
        <button onClick={selectAll} className="btn btn-ghost py-1 text-xs">
          <CheckSquare className="h-3.5 w-3.5" /> Seleccionar todo
        </button>
        {selected.size > 0 && (
          <>
            <button onClick={() => { loadAllAlbumsFlat(); setShowMovePanel(true); }}
              className="btn btn-primary py-1 text-xs">
              <MoveRight className="h-3.5 w-3.5" /> Mover ({selected.size})
            </button>
            <button onClick={delSelected} className="btn btn-danger py-1 text-xs">
              <Trash2 className="h-3.5 w-3.5" /> Eliminar ({selected.size})
            </button>
          </>
        )}
        <button onClick={toggleSelectMode} className="ml-auto btn btn-ghost py-1 text-xs">
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
      </div>
    );
  }

  // ── Vista: slideshow cargando ─────────────────────────────────────
  if (view === "slideshow-all" && loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Cargando todas las fotos…</p>
      </div>
    );
  }

  // ── Vista: recuerdos ──────────────────────────────────────────────
  if (view === "memories") {
    return (
      <div>
        <Lightbox />
        <button onClick={() => setView("root")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Álbumes
        </button>
        <div className="mb-6 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="font-display text-2xl font-semibold text-white">Recuerdos</h2>
        </div>
        {memLoading ? (
          <div className="flex items-center gap-2 text-muted"><Loader2 className="h-5 w-5 animate-spin" /> Cargando…</div>
        ) : memories.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted">
            <Images className="mx-auto mb-2 h-7 w-7 opacity-60" />
            Aún no hay fotos.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {memories.map((ph, i) => (
              <button key={ph.id} onClick={() => setLightbox(i)}
                className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={ph.url} alt="" loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Vista: dentro de un álbum ─────────────────────────────────────
  if (view === "album" && openAlbum) {
    return (
      <div>
        <Lightbox />
        <MovePanel />

        <button onClick={goBack}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
          <ChevronLeft className="h-4 w-4" />
          {albumStack.length > 0 ? albumStack[albumStack.length - 1].name : "Álbumes"}
        </button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{openAlbum.name}</h2>
            {openAlbum.description && <p className="text-sm text-muted">{openAlbum.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setLightbox(0); setPlaying(true); }} disabled={photos.length === 0} className="btn btn-ghost">
              <Play className="h-4 w-4" /> Play
            </button>
            {/* Botón de selección tipo Windows */}
            <button onClick={toggleSelectMode}
              className={`btn ${selectMode ? "btn-primary" : "btn-ghost"}`}
              title="Modo selección (como Windows Explorer)">
              <Square className="h-4 w-4" /> Seleccionar
            </button>
            <label className="btn btn-primary cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir fotos
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => upload(e.target.files)} />
            </label>
            {isAdmin && (
              <>
                <button onClick={() => newAlbum(openAlbum.id)} className="btn btn-ghost" title="Sub-álbum">
                  <FolderPlus className="h-4 w-4" />
                </button>
                <button onClick={renameAlbum} className="btn btn-ghost">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => delAlbum(openAlbum.id)} className="btn btn-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Barra de selección */}
        <SelectionBar />

        {/* Sub-álbumes — mismo grid y tamaño que carpetas principales */}
        {openAlbum.children && openAlbum.children.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Carpetas</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openAlbum.children.map(child => (
                <AlbumCard key={child.id} album={child} onClick={() => openAlbumView(child)} />
              ))}
            </div>
          </div>
        )}

        {/* Fotos */}
        {loading ? (
          <p className="text-muted">Cargando fotos…</p>
        ) : photos.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted">
            <Images className="mx-auto mb-2 h-7 w-7 opacity-60" />
            Aún no hay fotos.
          </div>
        ) : (
          <>
            {selectMode && (
              <p className="mb-3 text-xs text-muted">
                Clic para seleccionar · Shift+clic para rango · Ctrl+clic individual · Ctrl+A todo
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((ph, i) => {
                const isSel = selected.has(ph.id);
                return (
                  <div key={ph.id}
                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl transition-all duration-150 ${
                      isSel ? "ring-2 ring-brand-400 ring-offset-1 ring-offset-ink" : "hover:ring-1 hover:ring-white/30"
                    }`}
                    onClick={e => handlePhotoClick(ph, i, e)}>
                    <img src={ph.url} alt={ph.caption || ""} loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      style={rotations[ph.id] ? { transform: `rotate(${rotations[ph.id]}deg)` } : undefined} />
                    {/* Checkbox de selección */}
                    {(selectMode || isSel) && (
                      <div className={`absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-md border-2 transition-all ${
                        isSel
                          ? "border-brand-400 bg-brand-500 text-white"
                          : "border-white/60 bg-black/40 text-transparent group-hover:text-white/60"
                      }`}>
                        {isSel && <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>}
                      </div>
                    )}
                    {/* Acciones hover (solo si no está en modo selección) */}
                    {!selectMode && isAdmin && (
                      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {/* 🖼 Portada de la carpeta RAÍZ (siempre visible) */}
                        {getRootAlbum() && (
                          <button
                            onClick={e => { e.stopPropagation(); setCover(ph.url, getRootAlbum()!.id, ph.id); }}
                            className="grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-brand-glow hover:bg-brand-glow hover:text-ink"
                            title={`Portada de carpeta raíz: "${getRootAlbum()!.name}"`}
                          >
                            <ImagePlus className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* ⭐ Portada de la sub-carpeta actual (solo si estamos dentro de una sub-carpeta) */}
                        {openAlbum?.parent_id && (
                          <button
                            onClick={e => { e.stopPropagation(); setCover(ph.url, openAlbum.id, ph.id); }}
                            className="grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-gold hover:bg-gold hover:text-ink"
                            title={`Portada de sub-carpeta: "${openAlbum.name}"`}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); delPhoto(ph.id); }}
                          className="grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white hover:bg-rose-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Vista raíz ────────────────────────────────────────────────────
  return (
    <div>
      <Lightbox />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">Álbumes de fotos de nuestras actividades.</p>
        <div className="flex gap-2">
          <button onClick={loadMemories} className="btn btn-ghost">
            <Sparkles className="h-4 w-4 text-gold" /> Recuerdos
          </button>
          <button onClick={startGlobalSlideshow} className="btn btn-ghost">
            <Play className="h-4 w-4" /> Reproducir todo
          </button>
          {isAdmin && (
            <button onClick={() => newAlbum()} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Nuevo álbum
            </button>
          )}
        </div>
      </div>

      {albums.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted">
          <Camera className="mx-auto mb-3 h-8 w-8 opacity-60" />
          Aún no hay álbumes.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a, i) => (
            <div key={a.id} className="relative group/card">
              <AlbumCard album={a} onClick={() => openAlbumView(a)} />
              {isAdmin && (
                <div className="absolute left-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
                  <button onClick={e => { e.stopPropagation(); moveAlbum(i, -1); }}
                    disabled={i === 0}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-white hover:bg-brand-500 disabled:opacity-30"
                    title="Subir">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); moveAlbum(i, 1); }}
                    disabled={i === albums.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-white hover:bg-brand-500 disabled:opacity-30"
                    title="Bajar">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumCard({ album, onClick }: { album: Album; onClick: () => void }) {
  const isRoot = !album.parent_id;
  return (
    <button
      onClick={onClick}
      className="glass sheen group w-full overflow-hidden rounded-2xl text-left shadow-glass transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Portada — aspect-ratio idéntico en ambos niveles para tamaño uniforme */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt=""
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            style={album.cover_rotation ? { transform: `rotate(${album.cover_rotation}deg)` } : undefined}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted">
            <Camera className="h-8 w-8 opacity-50" />
          </div>
        )}

        {/* Badge de nivel — ícono diferente para raíz vs sub-carpeta */}
        <span
          className={`absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-lg shadow ${
            isRoot
              ? "bg-brand-glow/25 text-brand-glow ring-1 ring-brand-glow/40"
              : "bg-gold/25 text-gold ring-1 ring-gold/40"
          }`}
          title={isRoot ? "Carpeta principal — icono de portada: 🖼" : "Sub-carpeta — icono de portada: ⭐"}
        >
          {isRoot
            ? <ImagePlus className="h-4 w-4" />
            : <Star className="h-4 w-4" />
          }
        </span>

        {/* Contador de sub-carpetas si las tiene */}
        {album.children && album.children.length > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[0.7rem] text-white">
            {album.children.length} carpeta{album.children.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="relative z-[2] p-4">
        <h3 className="font-display text-lg font-semibold text-white">{album.name}</h3>
        <p className="text-sm text-muted">
          {album.count} {album.count === 1 ? "foto" : "fotos"}
        </p>
      </div>
    </button>
  );
}
