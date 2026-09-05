"use client";

import { useState } from "react";
import {
  Camera, Plus, Upload, X, ChevronLeft, ChevronRight, Trash2, Loader2, Images,
} from "lucide-react";

interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  count: number;
}
interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

export function CulturaGallery({ albums, isAdmin }: { albums: Album[]; isAdmin: boolean }) {
  const [open, setOpen] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  function reload() {
    setTimeout(() => window.location.assign("/categoria/cultura"), 400);
  }

  async function openAlbum(a: Album) {
    setOpen(a);
    setLoading(true);
    try {
      const res = await fetch(`/api/cultura/photos?albumId=${a.id}`);
      const data = (await res.json()) as { photos?: Photo[] };
      setPhotos(data.photos || []);
    } finally {
      setLoading(false);
    }
  }

  async function newAlbum() {
    const name = window.prompt("Nombre del álbum (ej. Convivio 2026):");
    if (!name?.trim()) return;
    const res = await fetch("/api/cultura/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) reload();
    else alert("No se pudo crear el álbum.");
  }

  async function upload(files: FileList | null) {
    if (!open || !files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("albumId", open.id);
        fd.append("file", file);
        const res = await fetch("/api/cultura/upload", { method: "POST", body: fd });
        if (res.ok) {
          const { photo } = (await res.json()) as { photo: Photo };
          setPhotos((p) => [...p, photo]);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  async function delPhoto(id: string) {
    if (!window.confirm("¿Eliminar esta foto?")) return;
    const res = await fetch("/api/cultura/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId: id }),
    });
    if (res.ok) setPhotos((p) => p.filter((x) => x.id !== id));
  }

  async function delAlbum(id: string) {
    if (!window.confirm("¿Eliminar el álbum y todas sus fotos?")) return;
    const res = await fetch("/api/cultura/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId: id }),
    });
    if (res.ok) reload();
  }

  // ---- Vista de un álbum ----
  if (open) {
    return (
      <div>
        <button
          onClick={() => { setOpen(null); setPhotos([]); }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> Álbumes
        </button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{open.name}</h2>
            {open.description && <p className="text-sm text-muted">{open.description}</p>}
          </div>
          <div className="flex gap-2">
            <label className="btn btn-primary cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir fotos
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => upload(e.target.files)}
              />
            </label>
            {isAdmin && (
              <button onClick={() => delAlbum(open.id)} className="btn btn-danger" title="Eliminar álbum">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-muted">Cargando fotos…</p>
        ) : photos.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted">
            <Images className="mx-auto mb-2 h-7 w-7 opacity-60" />
            Aún no hay fotos. Usa <strong className="text-white">Subir fotos</strong> para agregarlas.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((ph, i) => (
              <div key={ph.id} className="group relative aspect-square overflow-hidden rounded-xl">
                <button onClick={() => setLightbox(i)} className="h-full w-full">
                  <img
                    src={ph.url}
                    alt={ph.caption || ""}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => delPhoto(ph.id)}
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100"
                    title="Eliminar foto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightbox !== null && photos[lightbox] && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute right-4 top-4 text-white/80 hover:text-white" onClick={() => setLightbox(null)}>
              <X className="h-7 w-7" />
            </button>
            {lightbox > 0 && (
              <button
                className="absolute left-4 text-white/80 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              >
                <ChevronLeft className="h-9 w-9" />
              </button>
            )}
            <img
              src={photos[lightbox].url}
              alt=""
              className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {lightbox < photos.length - 1 && (
              <button
                className="absolute right-4 text-white/80 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              >
                <ChevronRight className="h-9 w-9" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- Vista de álbumes ----
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">Álbumes de fotos de nuestras actividades.</p>
        {isAdmin && (
          <button onClick={newAlbum} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Nuevo álbum
          </button>
        )}
      </div>

      {albums.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-muted">
          <Camera className="mx-auto mb-3 h-8 w-8 opacity-60" />
          Aún no hay álbumes.{isAdmin ? " Crea el primero con “Nuevo álbum”." : ""}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <button
              key={a.id}
              onClick={() => openAlbum(a)}
              className="glass sheen group overflow-hidden rounded-2xl text-left shadow-glass transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                {a.cover_url ? (
                  <img src={a.cover_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted">
                    <Camera className="h-8 w-8 opacity-50" />
                  </div>
                )}
              </div>
              <div className="relative z-[2] p-4">
                <h3 className="font-display text-lg font-semibold text-white">{a.name}</h3>
                <p className="text-sm text-muted">
                  {a.count} {a.count === 1 ? "foto" : "fotos"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
