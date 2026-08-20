import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  CategoryInput,
  IntranetData,
  Resource,
  ResourceInput,
  ResourceType,
  Subcategory,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import type { Repository } from "./repository";

// ---- mapeo fila (snake_case) <-> dominio (camelCase) ----

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  active: boolean;
}
interface SubcategoryRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  order: number;
}
interface ResourceRow {
  id: string;
  name: string;
  description: string | null;
  url: string;
  category_id: string;
  subcategory_id: string | null;
  type: string;
  icon: string | null;
  image_url: string | null;
  order: number;
  active: boolean;
  featured: boolean;
  open_in_new_tab: boolean;
  created_at: string;
  updated_at: string;
}

function toResource(r: ResourceRow): Resource {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    url: r.url,
    categoryId: r.category_id,
    subcategoryId: r.subcategory_id,
    type: r.type as ResourceType,
    icon: r.icon,
    imageUrl: r.image_url,
    order: r.order,
    active: r.active,
    featured: r.featured,
    openInNewTab: r.open_in_new_tab,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function resourceToRow(input: Partial<ResourceInput>): Partial<ResourceRow> {
  const row: Partial<ResourceRow> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.description !== undefined) row.description = input.description ?? null;
  if (input.url !== undefined) row.url = input.url;
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.subcategoryId !== undefined) row.subcategory_id = input.subcategoryId ?? null;
  if (input.type !== undefined) row.type = input.type;
  if (input.icon !== undefined) row.icon = input.icon ?? null;
  if (input.imageUrl !== undefined) row.image_url = input.imageUrl ?? null;
  if (input.order !== undefined) row.order = input.order;
  if (input.active !== undefined) row.active = input.active;
  if (input.featured !== undefined) row.featured = input.featured;
  if (input.openInNewTab !== undefined) row.open_in_new_tab = input.openInNewTab;
  return row;
}

export class SupabaseRepository implements Repository {
  readonly writable = true;
  readonly name = "supabase";
  private db: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.db = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  async getAll(): Promise<IntranetData> {
    const [cats, subs, res] = await Promise.all([
      this.db.from("categories").select("*").order("order", { ascending: true }),
      this.db.from("subcategories").select("*").order("order", { ascending: true }),
      this.db.from("resources").select("*").order("order", { ascending: true }),
    ]);

    if (cats.error) throw cats.error;
    if (subs.error) throw subs.error;
    if (res.error) throw res.error;

    const subsByCat = new Map<string, Subcategory[]>();
    for (const s of (subs.data as SubcategoryRow[]) ?? []) {
      const list = subsByCat.get(s.category_id) ?? [];
      list.push({ id: s.id, name: s.name, slug: s.slug, order: s.order });
      subsByCat.set(s.category_id, list);
    }

    const categories: Category[] = ((cats.data as CategoryRow[]) ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      order: c.order,
      active: c.active,
      subcategories: subsByCat.get(c.id) ?? [],
    }));

    const resources = ((res.data as ResourceRow[]) ?? []).map(toResource);
    return { categories, resources };
  }

  async createResource(input: ResourceInput): Promise<Resource> {
    const id = uid("res");
    const nowIso = new Date().toISOString();
    const row: ResourceRow = {
      id,
      created_at: nowIso,
      updated_at: nowIso,
      ...(resourceToRow(input) as Omit<ResourceRow, "id" | "created_at" | "updated_at">),
    } as ResourceRow;
    const { data, error } = await this.db.from("resources").insert(row).select().single();
    if (error) throw error;
    return toResource(data as ResourceRow);
  }

  async updateResource(id: string, patch: Partial<ResourceInput>): Promise<Resource> {
    const row = { ...resourceToRow(patch), updated_at: new Date().toISOString() };
    const { data, error } = await this.db
      .from("resources")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toResource(data as ResourceRow);
  }

  async deleteResource(id: string): Promise<void> {
    const { error } = await this.db.from("resources").delete().eq("id", id);
    if (error) throw error;
  }

  async createCategory(input: CategoryInput): Promise<Category> {
    const id = uid("cat");
    const { error: cErr } = await this.db.from("categories").insert({
      id,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      icon: input.icon ?? null,
      order: input.order,
      active: input.active,
    });
    if (cErr) throw cErr;

    const subs = (input.subcategories ?? []).map((s, i) => ({
      id: s.id ?? uid("sub"),
      category_id: id,
      name: s.name,
      slug: s.slug,
      order: s.order ?? i + 1,
    }));
    if (subs.length) {
      const { error: sErr } = await this.db.from("subcategories").insert(subs);
      if (sErr) throw sErr;
    }
    return this.getCategory(id);
  }

  async updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category> {
    const catPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) catPatch.name = patch.name;
    if (patch.slug !== undefined) catPatch.slug = patch.slug;
    if (patch.description !== undefined) catPatch.description = patch.description ?? null;
    if (patch.icon !== undefined) catPatch.icon = patch.icon ?? null;
    if (patch.order !== undefined) catPatch.order = patch.order;
    if (patch.active !== undefined) catPatch.active = patch.active;

    if (Object.keys(catPatch).length) {
      const { error } = await this.db.from("categories").update(catPatch).eq("id", id);
      if (error) throw error;
    }

    // Reemplazo completo de subcategorías cuando se envían.
    if (patch.subcategories !== undefined) {
      const { error: delErr } = await this.db
        .from("subcategories")
        .delete()
        .eq("category_id", id);
      if (delErr) throw delErr;

      const subs = patch.subcategories.map((s, i) => ({
        id: s.id ?? uid("sub"),
        category_id: id,
        name: s.name,
        slug: s.slug,
        order: s.order ?? i + 1,
      }));
      if (subs.length) {
        const { error: insErr } = await this.db.from("subcategories").insert(subs);
        if (insErr) throw insErr;
      }
    }
    return this.getCategory(id);
  }

  async deleteCategory(id: string): Promise<void> {
    // subcategorías y recursos se eliminan en cascada vía FK (ver schema.sql)
    const { error } = await this.db.from("categories").delete().eq("id", id);
    if (error) throw error;
  }

  private async getCategory(id: string): Promise<Category> {
    const { data: c, error } = await this.db
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    const { data: subs, error: sErr } = await this.db
      .from("subcategories")
      .select("*")
      .eq("category_id", id)
      .order("order", { ascending: true });
    if (sErr) throw sErr;
    const cr = c as CategoryRow;
    return {
      id: cr.id,
      name: cr.name,
      slug: cr.slug,
      description: cr.description,
      icon: cr.icon,
      order: cr.order,
      active: cr.active,
      subcategories: ((subs as SubcategoryRow[]) ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        order: s.order,
      })),
    };
  }
}
