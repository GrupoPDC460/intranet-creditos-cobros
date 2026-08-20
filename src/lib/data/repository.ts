import type {
  Category,
  CategoryInput,
  IntranetData,
  Resource,
  ResourceInput,
} from "@/lib/types";
import { SeedRepository } from "./seed-repo";
import { SupabaseRepository } from "./supabase-repo";

/**
 * Contrato único de acceso a datos. Toda la app (UI y API) habla con esta
 * interfaz, nunca con la fuente concreta. Esto permite cambiar de semilla a
 * Supabase (o a otra base en el futuro) sin tocar componentes ni endpoints.
 */
export interface Repository {
  /** true si el repositorio persiste cambios (Supabase). false = solo lectura. */
  readonly writable: boolean;
  readonly name: string;

  getAll(): Promise<IntranetData>;

  createResource(input: ResourceInput): Promise<Resource>;
  updateResource(id: string, patch: Partial<ResourceInput>): Promise<Resource>;
  deleteResource(id: string): Promise<void>;

  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
}

let cached: Repository | null = null;

/** Devuelve el repositorio activo. Supabase si está configurado; si no, semilla. */
export function getRepository(): Repository {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    cached = new SupabaseRepository(url, serviceKey);
  } else {
    cached = new SeedRepository();
  }
  return cached;
}

/** Error de escritura cuando el repositorio es de solo lectura. */
export class ReadOnlyError extends Error {
  constructor() {
    super(
      "El almacenamiento está en modo solo lectura. Configura Supabase para habilitar la edición.",
    );
    this.name = "ReadOnlyError";
  }
}
