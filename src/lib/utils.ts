import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Genera un slug URL-safe a partir de un texto. */
export function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Valida que una URL sea segura para enlazar.
 * Bloquea esquemas peligrosos (javascript:, data:, vbscript:).
 * Permite http, https, mailto, y rutas relativas internas.
 */
export function isSafeUrl(raw: string): boolean {
  if (!raw) return false;
  const value = raw.trim();
  if (value.startsWith("/")) return true; // ruta interna
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

/** Normaliza una URL agregando https:// si el usuario omitió el esquema. */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return value;
  if (value.startsWith("/") || value.startsWith("mailto:")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/** Dominio legible de una URL, para mostrar en tarjetas. */
export function displayHost(raw: string): string {
  try {
    return new URL(normalizeUrl(raw)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
