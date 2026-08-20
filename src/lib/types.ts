// Modelo de dominio central de la intranet.
// Una sola fuente de verdad para toda la aplicación.

export const RESOURCE_TYPES = [
  "dashboard",
  "sistema",
  "powerbi",
  "onedrive",
  "sharepoint",
  "excel",
  "teams",
  "formulario",
  "documento",
  "aplicacion",
  "web",
  "otro",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  dashboard: "Dashboard",
  sistema: "Sistema",
  powerbi: "Power BI",
  onedrive: "OneDrive",
  sharepoint: "SharePoint",
  excel: "Excel",
  teams: "Teams",
  formulario: "Formulario",
  documento: "Documento",
  aplicacion: "Aplicación",
  web: "Página web",
  otro: "Otro",
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  /** icono Lucide por nombre, ej. "wallet" */
  icon?: string | null;
  order: number;
  active: boolean;
  /** subcategorías ordenadas */
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export interface Resource {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  categoryId: string;
  subcategoryId?: string | null;
  type: ResourceType;
  /** icono Lucide opcional que sobreescribe el icono por tipo */
  icon?: string | null;
  imageUrl?: string | null;
  order: number;
  active: boolean;
  featured: boolean;
  openInNewTab: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payloads para crear/editar (sin campos autogestionados)
export type ResourceInput = Omit<Resource, "id" | "createdAt" | "updatedAt">;
export type CategoryInput = Omit<Category, "id" | "subcategories"> & {
  subcategories?: Array<Omit<Subcategory, "id"> & { id?: string }>;
};

export interface IntranetData {
  categories: Category[];
  resources: Resource[];
}
