"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, Star, Shield, X, CornerDownLeft, ArrowUpRight } from "lucide-react";
import type { Category, Resource } from "@/lib/types";
import { RESOURCE_TYPE_LABELS } from "@/lib/types";
import { resourceIcon, TYPE_TINT } from "@/lib/icons";
import { Logo } from "@/components/ui";

export interface PublicData {
  categories: Category[];
  resources: Resource[];
}

function useSearch(resources: Resource[], categories: Category[]) {
  const [q, setQ] = useState("");
  const catName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const subName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) for (const s of c.subcategories) m.set(s.id, s.name);
    return m;
  }, [categories]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return resources
      .filter((r) => {
        const haystack = [
          r.name,
          r.description ?? "",
          catName.get(r.categoryId) ?? "",
          r.subcategoryId ? subName.get(r.subcategoryId) ?? "" : "",
          RESOURCE_TYPE_LABELS[r.type],
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .slice(0, 24);
  }, [q, resources, catName, subName]);

  return { q, setQ, results, catName };
}

export function SearchCommand({
  data,
  open,
  onClose,
}: {
  data: PublicData;
  open: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const { q, setQ, results, catName } = useSearch(data.resources, data.categories);
  const [active, setActive] = useState(0);

  useEffect(() => setActive(0), [q]);

  const openResult = useCallback(
    (r: Resource) => {
      if (r.openInNewTab) window.open(r.url, "_blank", "noopener,noreferrer");
      else window.location.href = r.url;
      onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === "Enter" && results[active]) {
        e.preventDefault();
        openResult(results[active]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active, onClose, openResult]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-[#05081c]/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar recursos"
            className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-glass-lg"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-5 w-5 shrink-0 text-brand-glow" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar sistemas, dashboards, reportes, KACE…"
                className="w-full bg-transparent py-4 text-[0.98rem] text-white outline-none placeholder:text-muted/70"
              />
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {q.trim() === "" ? (
                <p className="px-3 py-8 text-center text-sm text-muted">
                  Escribe para buscar en toda la intranet.
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted">
                  Sin resultados para <span className="text-white">“{q}”</span>. Prueba con otro término.
                </p>
              ) : (
                <ul className="flex flex-col">
                  {results.map((r, i) => {
                    const Icon = resourceIcon(r);
                    const tint = TYPE_TINT[r.type];
                    return (
                      <li key={r.id}>
                        <button
                          onMouseEnter={() => setActive(i)}
                          onClick={() => openResult(r)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            i === active ? "bg-white/[0.08]" : "hover:bg-white/5"
                          }`}
                        >
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10"
                            style={{ background: `${tint}18` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: tint }} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-white">
                              {r.name}
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {catName.get(r.categoryId)} · {RESOURCE_TYPE_LABELS[r.type]}
                            </span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2.5 text-[0.72rem] text-muted">
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="h-3.5 w-3.5" /> abrir
              </span>
              <span>↑ ↓ navegar</span>
              <span>Esc cerrar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function HeaderBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08]">
      <div className="glass-strong">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0" aria-label="Inicio">
            <Logo />
          </Link>

          <button
            onClick={onOpenSearch}
            className="ml-auto hidden min-w-[16rem] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.08] sm:flex"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Buscar recursos…</span>
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[0.68rem] font-semibold">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={onOpenSearch}
            className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted hover:text-white sm:hidden"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            href="/favoritos"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-muted transition-colors hover:text-gold"
            aria-label="Mis favoritos"
            title="Mis favoritos"
          >
            <Star className="h-4 w-4" />
          </Link>

          <Link
            href="/admin"
            className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-white sm:inline-flex"
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
