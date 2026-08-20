import {
  BarChart3,
  MonitorCog,
  PieChart,
  Cloud,
  FolderKanban,
  Sheet,
  MessagesSquare,
  ClipboardList,
  FileText,
  AppWindow,
  Globe,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { ResourceType } from "@/lib/types";

/** Icono Lucide por defecto para cada tipo de recurso. */
export const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  dashboard: BarChart3,
  sistema: MonitorCog,
  powerbi: PieChart,
  onedrive: Cloud,
  sharepoint: FolderKanban,
  excel: Sheet,
  teams: MessagesSquare,
  formulario: ClipboardList,
  documento: FileText,
  aplicacion: AppWindow,
  web: Globe,
  otro: Boxes,
};

/** Color de acento tenue por tipo, para el chip/halo del icono. */
export const TYPE_TINT: Record<ResourceType, string> = {
  dashboard: "#4CC9F0",
  sistema: "#8B9DF5",
  powerbi: "#F2C811",
  onedrive: "#3AA0FF",
  sharepoint: "#1FA8A0",
  excel: "#21A366",
  teams: "#6E63C6",
  formulario: "#9AA6C7",
  documento: "#C7D0EA",
  aplicacion: "#7CE0C3",
  web: "#5B84F0",
  otro: "#9AA6C7",
};

export function typeIcon(type: ResourceType): LucideIcon {
  return TYPE_ICON[type] ?? Boxes;
}

/** Resuelve un nombre Lucide en kebab-case (ej. "wallet", "chart-pie") a su componente. */
export function iconByName(name?: string | null): LucideIcon | null {
  if (!name) return null;
  const key = name
    .trim()
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (LucideIcons as unknown as Record<string, LucideIcon>)[key] ?? null;
}

/** Icono de un recurso: usa el manual si existe; si no, el de su tipo. */
export function resourceIcon(resource: {
  icon?: string | null;
  type: ResourceType;
}): LucideIcon {
  return iconByName(resource.icon) ?? typeIcon(resource.type);
}
