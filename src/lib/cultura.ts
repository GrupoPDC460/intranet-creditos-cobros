import { createClient } from "@supabase/supabase-js";

const BUCKET = "cultura";

export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  parent_id: string | null;
  order: number;
  cover_rotation: number;
  created_at: string;
}
export interface AlbumWithMeta extends Album {
  count: number;
  children: AlbumWithMeta[];
}
export interface Photo {
  id: string;
  album_id: string;
  url: string;
  path: string | null;
  caption: string | null;
  rotation: number;
  created_at: string;
}

export function culturaConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false }, global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) } },
  );
}

export async function getAllAlbums(): Promise<Album[]> {
  const { data } = await db().from("cultura_albums").select("*").order("order", { ascending: true });
  return (data as Album[]) || [];
}

export async function getAlbumsWithMeta(): Promise<AlbumWithMeta[]> {
  const all = await getAllAlbums();
  const client = db();
  const withMeta: AlbumWithMeta[] = [];
  for (const a of all) {
    const { count } = await client.from("cultura_photos").select("id", { count: "exact", head: true }).eq("album_id", a.id);
    let cover = a.cover_url;
    if (!cover) {
      const { data } = await client.from("cultura_photos").select("url").eq("album_id", a.id).order("created_at", { ascending: true }).limit(1);
      cover = (data && data[0]?.url) || null;
    }
    withMeta.push({ ...a, cover_url: cover, count: count || 0, children: [] });
  }
  // Árbol: raíces y sus hijos
  const map = new Map(withMeta.map((a) => [a.id, a]));
  const roots: AlbumWithMeta[] = [];
  for (const a of withMeta) {
    if (a.parent_id && map.has(a.parent_id)) {
      map.get(a.parent_id)!.children.push(a);
    } else if (!a.parent_id) {
      roots.push(a);
    }
  }
  return roots;
}

export async function getPhotos(albumId: string): Promise<Photo[]> {
  const { data } = await db().from("cultura_photos").select("*").eq("album_id", albumId).order("created_at", { ascending: true });
  return (data as Photo[]) || [];
}

/** Recuerdos: fotos aleatorias de todos los álbumes. */
export async function getMemories(limit = 12): Promise<Photo[]> {
  const { data } = await db().from("cultura_photos").select("*").order("created_at", { ascending: false }).limit(100);
  if (!data || data.length === 0) return [];
  const shuffled = (data as Photo[]).sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

export async function createAlbum(name: string, description?: string, parentId?: string): Promise<Album> {
  const payload: Record<string, unknown> = { name: name.trim(), description: description?.trim() || null };
  if (parentId) payload.parent_id = parentId;
  const { data, error } = await db().from("cultura_albums").insert(payload).select("*").limit(1);
  if (error || !data) throw new Error(error?.message || "No se pudo crear el álbum.");
  return data[0] as Album;
}

export async function updateAlbum(id: string, patch: { name?: string; description?: string; cover_url?: string; cover_rotation?: number }): Promise<void> {
  const upd: Record<string, unknown> = {};
  if (patch.name !== undefined) upd.name = patch.name.trim();
  if (patch.description !== undefined) upd.description = patch.description.trim() || null;
  if (patch.cover_url !== undefined) upd.cover_url = patch.cover_url;
  if (patch.cover_rotation !== undefined) upd.cover_rotation = patch.cover_rotation;
  if (Object.keys(upd).length === 0) return;
  const { error } = await db().from("cultura_albums").update(upd).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAlbum(id: string): Promise<void> {
  const client = db();
  const { data: photos } = await client.from("cultura_photos").select("path").eq("album_id", id);
  const paths = (photos || []).map((p) => p.path).filter(Boolean) as string[];
  if (paths.length) await client.storage.from(BUCKET).remove(paths);
  await client.from("cultura_albums").delete().eq("id", id);
}

export async function deletePhoto(id: string): Promise<void> {
  const client = db();
  const { data } = await client.from("cultura_photos").select("path").eq("id", id).limit(1);
  const path = data && data[0]?.path;
  if (path) await client.storage.from(BUCKET).remove([path]);
  await client.from("cultura_photos").delete().eq("id", id);
}

export async function addPhoto(albumId: string, file: { name: string; type: string; bytes: ArrayBuffer }, caption?: string): Promise<Photo> {
  const client = db();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${albumId}/${Date.now()}_${rand}.${ext}`;
  const { error: upErr } = await client.storage.from(BUCKET).upload(path, file.bytes, { contentType: file.type || "image/jpeg", upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: pub } = client.storage.from(BUCKET).getPublicUrl(path);
  const { data, error } = await client.from("cultura_photos").insert({ album_id: albumId, url: pub.publicUrl, path, caption: caption?.trim() || null }).select("*").limit(1);
  if (error || !data) throw new Error(error?.message || "No se pudo registrar la foto.");
  return data[0] as Photo;
}

/** Guarda la rotación persistente de una foto (0, 90, 180 o 270). */
export async function savePhotoRotation(id: string, rotation: number): Promise<void> {
  const r = ((rotation % 360) + 360) % 360;
  const valid = [0, 90, 180, 270];
  const final = valid.includes(r) ? r : 0;
  const { error } = await db()
    .from("cultura_photos")
    .update({ rotation: final })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Mueve una foto a otro álbum. */
export async function movePhoto(photoId: string, targetAlbumId: string): Promise<void> {
  const { error } = await db()
    .from("cultura_photos")
    .update({ album_id: targetAlbumId })
    .eq("id", photoId);
  if (error) throw new Error(error.message);
}

/** Actualiza el orden de varios álbumes de una vez. */
export async function reorderAlbums(items: { id: string; order: number }[]): Promise<void> {
  const client = db();
  for (const item of items) {
    await client.from("cultura_albums").update({ order: item.order }).eq("id", item.id);
  }
}

/** Mueve varias fotos a otro álbum de una vez. */
export async function movePhotos(photoIds: string[], targetAlbumId: string): Promise<void> {
  const { error } = await db()
    .from("cultura_photos")
    .update({ album_id: targetAlbumId })
    .in("id", photoIds);
  if (error) throw new Error(error.message);
}

/** Mueve un álbum dentro de otro (lo convierte en sub-carpeta). */
export async function moveAlbumInto(albumId: string, newParentId: string | null): Promise<void> {
  const { error } = await db()
    .from("cultura_albums")
    .update({ parent_id: newParentId })
    .eq("id", albumId);
  if (error) throw new Error(error.message);
}
