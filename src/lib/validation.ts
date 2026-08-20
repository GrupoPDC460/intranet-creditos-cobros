import { RESOURCE_TYPES, type ResourceInput, type ResourceType } from "@/lib/types";
import { isSafeUrl, normalizeUrl } from "@/lib/utils";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: ResourceInput;
}

/** Valida y normaliza el payload de un recurso proveniente del cliente. */
export function validateResourceInput(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const data = (raw ?? {}) as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) errors.push("El nombre es obligatorio.");
  if (name.length > 120) errors.push("El nombre no puede superar 120 caracteres.");

  let url = typeof data.url === "string" ? normalizeUrl(data.url) : "";
  if (!url) errors.push("La URL es obligatoria.");
  else if (!isSafeUrl(url)) errors.push("La URL no es válida o usa un esquema no permitido.");

  const categoryId = typeof data.categoryId === "string" ? data.categoryId : "";
  if (!categoryId) errors.push("La categoría es obligatoria.");

  const type = (typeof data.type === "string" ? data.type : "otro") as ResourceType;
  if (!RESOURCE_TYPES.includes(type)) errors.push("El tipo de recurso no es válido.");

  if (errors.length) return { ok: false, errors };

  const value: ResourceInput = {
    name,
    description:
      typeof data.description === "string" && data.description.trim()
        ? data.description.trim()
        : null,
    url,
    categoryId,
    subcategoryId:
      typeof data.subcategoryId === "string" && data.subcategoryId ? data.subcategoryId : null,
    type,
    icon: typeof data.icon === "string" && data.icon.trim() ? data.icon.trim() : null,
    imageUrl:
      typeof data.imageUrl === "string" && data.imageUrl.trim() ? data.imageUrl.trim() : null,
    order: typeof data.order === "number" ? data.order : Number(data.order) || 0,
    active: data.active === undefined ? true : Boolean(data.active),
    featured: Boolean(data.featured),
    openInNewTab: data.openInNewTab === undefined ? true : Boolean(data.openInNewTab),
  };

  return { ok: true, errors: [], value };
}
