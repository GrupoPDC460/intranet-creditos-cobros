"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Star } from "lucide-react";
import type { Resource } from "@/lib/types";
import { RESOURCE_TYPE_LABELS } from "@/lib/types";
import { resourceIcon, TYPE_TINT } from "@/lib/icons";
import { displayHost } from "@/lib/utils";
import { useFavorites, useToast } from "@/components/providers";
import { SheenCard } from "@/components/ui";

export function FavoriteButton({
  resource,
  className,
}: {
  resource: Resource;
  className?: string;
}) {
  const { isFavorite, toggle, ready } = useFavorites();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const active = isFavorite(resource.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(resource.id);
        toast(
          active ? "Quitado de favoritos" : "Agregado a favoritos",
          active ? "info" : "success",
        );
      }}
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10 ${
        className ?? ""
      }`}
      style={{ opacity: ready ? 1 : 0.5 }}
    >
      <motion.span
        key={active ? "on" : "off"}
        initial={reduce ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
      >
        <Star
          className="h-4 w-4"
          strokeWidth={2}
          style={{
            color: active ? "#F5A623" : "#9AA6C7",
            fill: active ? "#F5A623" : "transparent",
          }}
        />
      </motion.span>
    </button>
  );
}

export function ResourceCard({
  resource,
  index = 0,
}: {
  resource: Resource;
  index?: number;
}) {
  const Icon = resourceIcon(resource);
  const tint = TYPE_TINT[resource.type];
  const host = displayHost(resource.url);

  return (
    <SheenCard className="group h-full">
      <a
        href={resource.url}
        target={resource.openInNewTab ? "_blank" : undefined}
        rel={resource.openInNewTab ? "noopener noreferrer" : undefined}
        className="relative z-[2] flex h-full flex-col p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10"
            style={{
              background: `radial-gradient(120% 120% at 30% 20%, ${tint}22, transparent 70%)`,
              boxShadow: `inset 0 0 0 1px ${tint}22`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: tint }} strokeWidth={2} />
          </span>
          <div className="flex items-center gap-2">
            {resource.featured && (
              <span
                className="grid h-8 w-8 place-items-center rounded-lg"
                title="Recurso destacado"
                style={{ background: "rgba(245,166,35,0.12)" }}
              >
                <Star className="h-4 w-4" style={{ color: "#F5A623", fill: "#F5A623" }} />
              </span>
            )}
            <FavoriteButton resource={resource} />
          </div>
        </div>

        <div className="mt-3.5 flex-1">
          <h3 className="font-display text-[0.98rem] font-semibold leading-tight text-white">
            {resource.name}
          </h3>
          {resource.description && (
            <p className="mt-1 line-clamp-2 text-[0.83rem] leading-snug text-muted">
              {resource.description}
            </p>
          )}
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <span className="chip">{RESOURCE_TYPE_LABELS[resource.type]}</span>
          <span className="inline-flex items-center gap-1 text-[0.78rem] font-medium text-brand-glow opacity-0 transition-opacity group-hover:opacity-100">
            Abrir
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
        {host && (
          <p className="mt-2 truncate text-[0.72rem] text-muted/70">{host}</p>
        )}
      </a>
    </SheenCard>
  );
}
