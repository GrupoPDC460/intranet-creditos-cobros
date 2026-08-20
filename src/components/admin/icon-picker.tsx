"use client";

import { useState } from "react";
import { Folder } from "lucide-react";
import { iconByName } from "@/lib/icons";

/** Iconos curados (nombres Lucide en kebab-case) relevantes para el negocio. */
export const ICON_CHOICES: string[] = [
  "wallet", "banknote", "credit-card", "coins", "receipt", "hand-coins",
  "landmark", "building-2", "briefcase", "handshake", "scale", "gavel",
  "shopping-bag", "shopping-cart", "store", "package", "truck", "tag",
  "chart-pie", "chart-column", "chart-line", "chart-no-axes-combined", "trending-up", "target",
  "users", "user-check", "user-round", "contact", "phone", "headset",
  "mail", "message-square", "megaphone", "bell", "calendar", "clock",
  "folder", "folder-kanban", "folder-open", "file-text", "clipboard-list", "book-open",
  "settings-2", "sliders-horizontal", "database", "server", "cloud", "globe",
  "shield", "shield-check", "lock", "key-round", "map-pin", "flag",
  "graduation-cap", "award", "star", "sparkles", "layers", "grid-2x2",
  "monitor-cog", "app-window", "link", "external-link", "search", "wrench",
];

/** Dibuja un icono Lucide por nombre; usa Folder si no existe. */
export function NamedIcon({
  name,
  className = "h-5 w-5",
}: {
  name?: string | null;
  className?: string;
}) {
  const Cmp = iconByName(name) ?? Folder;
  return <Cmp className={className} />;
}

/**
 * Selector visual de iconos con búsqueda.
 * Si `allowAuto` es true, ofrece un botón para volver al icono automático
 * (valor vacío "").
 */
export function IconPicker({
  value,
  onChange,
  allowAuto = false,
  autoHint,
}: {
  value: string;
  onChange: (icon: string) => void;
  allowAuto?: boolean;
  autoHint?: string;
}) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = term ? ICON_CHOICES.filter((n) => n.includes(term)) : ICON_CHOICES;
  const isAuto = !value;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-brand-glow">
          <NamedIcon name={value || "folder"} />
        </span>
        <input
          className="field"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar icono… (ej. billetera → wallet)"
        />
        {allowAuto && (
          <button
            type="button"
            onClick={() => onChange("")}
            className={
              "shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-colors " +
              (isAuto
                ? "border-brand-400 bg-brand-500/20 text-white"
                : "border-white/10 bg-white/5 text-muted hover:bg-white/10 hover:text-white")
            }
            title={autoHint ?? "Usar el icono automático"}
          >
            Automático
          </button>
        )}
      </div>
      <div className="grid max-h-44 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-2 sm:grid-cols-8">
        {list.map((name) => {
          const active = name === value;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              title={name}
              aria-pressed={active}
              className={
                "grid aspect-square place-items-center rounded-lg border transition-colors " +
                (active
                  ? "border-brand-400 bg-brand-500/20 text-white"
                  : "border-white/10 bg-white/5 text-muted hover:bg-white/10 hover:text-white")
              }
            >
              <NamedIcon name={name} />
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs text-muted">
            Sin resultados. Prueba otro término en inglés (wallet, chart, users…).
          </p>
        )}
      </div>
      {allowAuto && isAuto && autoHint && (
        <p className="mt-1.5 text-xs text-muted/80">{autoHint}</p>
      )}
    </div>
  );
}
