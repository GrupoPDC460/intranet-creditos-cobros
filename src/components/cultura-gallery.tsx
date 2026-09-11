"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Camera, Plus, Upload, X, ChevronLeft, ChevronRight, Trash2, Loader2,
  Images, Play, Pencil, Star, FolderPlus, Sparkles, Pause, RotateCw,
} from "lucide-react";

interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  parent_id: string | null;
  count: number;
  children: Album[];
}
interface Photo { id: string; album_id: string; url: string; caption: string | null; rotation: number; }

type View = "root" | "album" | "memories" | "slideshow-all";

export function CulturaGallery({ albums: initial, isAdmin }: { albums: Album[]; isAdmin: boolean }) {
  const [albums, setAlbums] = useState<Album[]>(initial);
  const [view, setView] = useState<View>("root");
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  // Stack de navegación: permite regresar al álbum padre, no al inicio
  const [albumStack, setAlbumStack] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  // Rotaciones por foto {[photoId]: grados} — sincronizadas con la base de datos
  const [rotations, setRotations] = useState<Record<string, number>>(() => {
    // Inicializar con los valores de la base que vienen en cada foto
    const init: Record<string, number> = {};
    return init;
  });
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [memories, setMemories] = useState<Photo[]>([]);
  const [memLoading, setMemLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function reload() { setTimeout(() => window.location.assign("/categoria/cultura"), 400); }

  // ── Teclado ────────────────────────────────────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    const cur = view === "slideshow-all" ? allPhotos : (view === "memories" ? memories : photos);
    if (lightbox === null) return;
    if (e.key === "Escape") { setLightbox(null); setPlaying(false); }
    // Tope: no pasa del último ni del primero
    if (e.key === "ArrowRight") {
      setLightbox((i) => (i === null || i >= cur.length - 1) ? i : i + 1);
    }
    if (e.key === "ArrowLeft") {
      setLightbox((i) => (i === null || i <= 0) ? i : i - 1);
    }
    if ((e.key === "r" || e.key === "R") && lightbox !== null && curPhotos[lightbox]) {
      rotatePhoto(curPhotos[lightbox].id);
    }
    if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
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
        setLightbox((i) => i === null ? 0 : (i + 1) % cur.length);
      }, 3000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, lightbox, photos, allPhotos, view]);

  // ── Cargar álbum ──────────────────────────────────────────────────
  async function openAlbumView(a: Album, fromStack = false) {
    if (!fromStack && openAlbum) {
      // Guardamos el álbum actual en el stack antes de entrar al sub-álbum
      setAlbumStack((prev) => [...prev, openAlbum]);
    }
    setOpenAlbum(a); setView("album"); setLoading(true);
    try {
      const res = await fetch(`/api/cultura/photos?albumId=${a.id}`);
      const data = (await res.json()) as { photos?: Photo[] };
      const loaded = data.photos || [];
      setPhotos(loaded);
      // Cargar rotaciones persistidas desde la base
      const rots: Record<string, number> = {};
      for (const p of loaded) if (p.rotation) rots[p.id] = p.rotation;
      setRotations((prev) => ({ ...prev, ...rots }));
    } finally { setLoading(false); }
  }

  // Regresar al álbum padre (o al inicio si no hay padre en el stack)
  async function goBack() {
    if (albumStack.length > 0) {
      const prev = albumStack[albumStack.length - 1];
      setAlbumStack((s) => s.slice(0, -1));
      await openAlbumView(prev, true);
    } else {
      setView("root"); setOpenAlbum(null); setPhotos([]); setAlbumStack([]);
    }
  }

  // ── Recuerdos ─────────────────────────────────────────────────────
  // Girar foto: actualiza estado local Y guarda en la base
  async function rotatePhoto(photoId: string) {
    const current = rotations[photoId] ?? 0;
    const next = (current + 90) % 360;
    setRotations((prev) => ({ ...prev, [photoId]: next }));
    // Guardar en la base (fire-and-forget, no bloqueamos la UI)
    fetch("/api/cultura/rotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photoId, rotation: next }),
    }).catch(console.error);
  }

  async function loadMemories() {
    setView("memories"); setMemLoading(true);
    try {
      const res = await fetch("/api/cultura/memories");
      const data = (await res.json()) as { photos?: Photo[] };
      setMemories(data.photos || []);
    } finally { setMemLoading(false); }
  }

  // ── Reproducir todos los álbumes ──────────────────────────────────
  async function startGlobalSlideshow() {
    setView("slideshow-all"); setLoading(true);
    try {
      // Cargar fotos de todos los álbumes raíz e hijos
      const ids: string[] = [];
      const collect = (list: Album[]) => list.forEach((a) => { ids.push(a.id); collect(a.children); });
      collect(albums);
      const all: Photo[] = [];
      for (const id of ids) {
        const res = await fetch(`/api/cultura/photos?albumId=${id}`);
        const data = (await res.json()) as { photos?: Photo[] };
        all.push(...(data.photos || []));
      }
      setAllPhotos(all);
      if (all.length > 0) { setLightbox(0); setPlaying(true); }
    } finally { setLoading(false); }
  }

  // ── Acciones admin ────────────────────────────────────────────────
  async function newAlbum(parentId?: string) {
    const name = window.prompt(parentId ? "Nombre del sub-álbum (ej. Enero):" : "Nombre del álbum (ej. Cumpleañeros 2026):");
    if (!name?.trim()) return;
    const res = await fetch("/api/cultura/albums", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });
    if (res.ok) reload(); else alert("No se pudo crear el álbum.");
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

  async function setCover(url: string) {
    if (!openAlbum) return;
    await fetch("/api/cultura/albums", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: openAlbum.id, coverUrl: url }),
    });
    alert("Portada actualizada.");
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
          setPhotos((p) => [...p, photo]);
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
    if (res.ok) setPhotos((p) => p.filter((x) => x.id !== id));
  }

  async function delAlbum(id: string) {
    if (!window.confirm("¿Eliminar el álbum y todas sus fotos?")) return;
    const res = await fetch("/api/cultura/delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId: id }),
    });
    if (res.ok) reload();
  }

  // ── Lightbox compartido ────────────────────────────────────────────
  const curPhotos = view === "slideshow-all" ? allPhotos : (view === "memories" ? memories : photos);

  function Lightbox() {
    if (lightbox === null || curPhotos.length === 0) return null;
    const ph = curPhotos[lightbox];
    if (!ph) return null;
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
        onClick={() => { setLightbox(null); setPlaying(false); }}
      >
        {/* Controles */}
        <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => { setLightbox(null); setPlaying(false); }}>
          <X className="h-5 w-5" />
        </button>
        <button className="absolute top-4 right-16 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); }}>
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        {/* Flechas */}
        {lightbox > 0 && (
          <button className="absolute left-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}>
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
        {lightbox < curPhotos.length - 1 && (
          <button className="absolute right-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}>
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
        {/* Botón rotar */}
        <button
          className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          title="Girar foto (R)"
          onClick={(e) => { e.stopPropagation(); if (lightbox !== null && curPhotos[lightbox]) rotatePhoto(curPhotos[lightbox].id); }}
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <img
          src={ph.url}
          alt=""
          className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain transition-transform duration-300"
          style={{ transform: `rotate(${rotations[ph.id] ?? 0}deg)` }}
          onClick={(e) => e.stopPropagation()}
        />
        {/* Contador */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/70">
          {lightbox + 1} / {curPhotos.length}
        </div>
      </div>
    );
  }

  // ── Vista: Slideshow global (pantalla completa cargando) ───────────
  if (view === "slideshow-all" && loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Cargando todas las fotos…</p>
      </div>
    );
  }

  // ── Vista: Recuerdos ──────────────────────────────────────────────
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
          <div className="flex items-center gap-2 text-muted"><Loader2 className="h-5 w-5 animate-spin" /> Cargando recuerdos…</div>
        ) : memories.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted">
            <Images className="mx-auto mb-2 h-7 w-7 opacity-60" />
            Aún no hay fotos para mostrar recuerdos.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {memories.map((ph, i) => (
              <button key={ph.id} onClick={() => setLightbox(i)} className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={ph.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Vista: Dentro de un álbum ────────────────────────────────────
  if (view === "album" && openAlbum) {
    return (
      <div>
        <Lightbox />
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
            <label className="btn btn-primary cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir fotos
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            </label>
            {isAdmin && (
              <>
                <button onClick={() => newAlbum(openAlbum.id)} className="btn btn-ghost" title="Crear sub-álbum">
                  <FolderPlus className="h-4 w-4" /> Sub-álbum
                </button>
                <button onClick={renameAlbum} className="btn btn-ghost">
                  <Pencil className="h-4 w-4" /> Renombrar
                </button>
                <button onClick={() => delAlbum(openAlbum.id)} className="btn btn-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub-álbumes */}
        {openAlbum.children && openAlbum.children.length > 0 && (
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">Carpetas</p>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {openAlbum.children.map((child) => (
                <AlbumCard key={child.id} album={child} onClick={() => openAlbumView(child)} />
              ))}
            </div>
          </div>
        )}

        {/* Fotos */}
        {loading ? <p className="text-muted">Cargando fotos…</p> :
          photos.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-muted">
              <Images className="mx-auto mb-2 h-7 w-7 opacity-60" />
              Aún no hay fotos. Usa <strong className="text-white">Subir fotos</strong> para agregarlas.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((ph, i) => (
                <div key={ph.id} className="group relative aspect-square overflow-hidden rounded-xl">
                  <button onClick={() => setLightbox(i)} className="h-full w-full">
                    <img src={ph.url} alt={ph.caption || ""} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={rotations[ph.id] ? { transform: `rotate(${rotations[ph.id]}deg)`, objectFit: "cover" } : undefined} />
                  </button>
                  {isAdmin && (
                    <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => setCover(ph.url)} className="grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white hover:bg-gold hover:text-ink" title="Hacer portada">
                        <Star className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => delPhoto(ph.id)} className="grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white hover:bg-rose-600" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
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

  // ── Vista raíz: listado de álbumes ─────────────────────────────────
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
          Aún no hay álbumes. {isAdmin ? 'Crea el primero con "Nuevo álbum".' : ""}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} onClick={() => openAlbumView(a)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumCard({ album, onClick }: { album: Album; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass sheen group overflow-hidden rounded-2xl text-left shadow-glass transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
        {album.cover_url ? (
          <img src={album.cover_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted">
            <Camera className="h-8 w-8 opacity-50" />
          </div>
        )}
        {album.children && album.children.length > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[0.7rem] text-white">
            {album.children.length} carpeta{album.children.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="relative z-[2] p-4">
        <h3 className="font-display text-lg font-semibold text-white">{album.name}</h3>
        <p className="text-sm text-muted">{album.count} {album.count === 1 ? "foto" : "fotos"}</p>
      </div>
    </button>
  );
}
