import { createClient } from "@supabase/supabase-js";

const BUCKET = "cultura";

export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
}
export interface Photo {
  id: string;
  album_id: string;
  url: string;
  path: string | null;
  caption: string | null;
  created_at: string;
}

export function culturaConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: { persistSession: false },
      global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) },
    },
  );
}

export async function getAlbums(): Promise<Album[]> {
  const { data } = await db()
    .from("cultura_albums")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Album[]) || [];
}

export async function getAlbum(id: string): Promise<Album | null> {
  const { data } = await db().from("cultura_albums").select("*").eq("id", id).limit(1);
  return (data && (data[0] as Album)) || null;
}

export async function getPhotos(albumId: string): Promise<Photo[]> {
  const { data } = await db()
    .from("cultura_photos")
    .select("*")
    .eq("album_id", albumId)
    .order("created_at", { ascending: true });
  return (data as Photo[]) || [];
}

/** Conteo y portada de cada álbum. */
export async function getAlbumsWithMeta(): Promise<
  (Album & { count: number })[]
> {
  const albums = await getAlbums();
  const client = db();
  const out: (Album & { count: number })[] = [];
  for (const a of albums) {
    const { count } = await client
      .from("cultura_photos")
      .select("id", { count: "exact", head: true })
      .eq("album_id", a.id);
    let cover = a.cover_url;
    if (!cover) {
      const { data } = await client
        .from("cultura_photos")
        .select("url")
        .eq("album_id", a.id)
        .order("created_at", { ascending: true })
        .limit(1);
      cover = (data && data[0]?.url) || null;
    }
    out.push({ ...a, cover_url: cover, count: count || 0 });
  }
  return out;
}

export async function createAlbum(name: string, description?: string): Promise<Album> {
  const { data, error } = await db()
    .from("cultura_albums")
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select("*")
    .limit(1);
  if (error || !data) throw new Error(error?.message || "No se pudo crear el álbum.");
  return data[0] as Album;
}

export async function deleteAlbum(id: string): Promise<void> {
  const client = db();
  // Borrar archivos del storage
  const { data: photos } = await client
    .from("cultura_photos")
    .select("path")
    .eq("album_id", id);
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

/** Sube un archivo al bucket y registra la foto. */
export async function addPhoto(
  albumId: string,
  file: { name: string; type: string; bytes: ArrayBuffer },
  caption?: string,
): Promise<Photo> {
  const client = db();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${albumId}/${Date.now()}_${rand}.${ext}`;
  const { error: upErr } = await client.storage
    .from(BUCKET)
    .upload(path, file.bytes, { contentType: file.type || "image/jpeg", upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: pub } = client.storage.from(BUCKET).getPublicUrl(path);
  const { data, error } = await client
    .from("cultura_photos")
    .insert({ album_id: albumId, url: pub.publicUrl, path, caption: caption?.trim() || null })
    .select("*")
    .limit(1);
  if (error || !data) throw new Error(error?.message || "No se pudo registrar la foto.");
  return data[0] as Photo;
}
