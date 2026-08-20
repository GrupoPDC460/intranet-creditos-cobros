import type {
  Category,
  CategoryInput,
  IntranetData,
  Resource,
  ResourceInput,
} from "@/lib/types";
import { seedData } from "./seed";
import { ReadOnlyError, type Repository } from "./repository";

/**
 * Respaldo de solo lectura. Sirve el contenido semilla para que la intranet
 * renderice de inmediato tras el deploy, aun antes de conectar Supabase.
 * Cualquier escritura lanza ReadOnlyError con instrucciones claras.
 */
export class SeedRepository implements Repository {
  readonly writable = false;
  readonly name = "seed";

  async getAll(): Promise<IntranetData> {
    // Copia profunda para evitar mutaciones accidentales del módulo.
    return structuredClone(seedData);
  }

  async createResource(_input: ResourceInput): Promise<Resource> {
    throw new ReadOnlyError();
  }
  async updateResource(_id: string, _patch: Partial<ResourceInput>): Promise<Resource> {
    throw new ReadOnlyError();
  }
  async deleteResource(_id: string): Promise<void> {
    throw new ReadOnlyError();
  }
  async createCategory(_input: CategoryInput): Promise<Category> {
    throw new ReadOnlyError();
  }
  async updateCategory(_id: string, _patch: Partial<CategoryInput>): Promise<Category> {
    throw new ReadOnlyError();
  }
  async deleteCategory(_id: string): Promise<void> {
    throw new ReadOnlyError();
  }
}
