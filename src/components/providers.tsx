"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

/* ---------------------------------- Favoritos --------------------------------- */

const FAV_KEY = "pdc:favorites:v1";

interface FavoritesContext {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  ready: boolean;
}

const FavCtx = createContext<FavoritesContext | null>(null);

/* ----------------------------------- Toasts ----------------------------------- */

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}
interface ToastContext {
  toast: (message: string, kind?: ToastKind) => void;
}
const ToastCtx = createContext<ToastContext | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  // --- favoritos ---
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavorites(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* almacenamiento no disponible */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Set<string>) => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
    } catch {
      /* ignora cuota/privado */
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const favValue = useMemo<FavoritesContext>(
    () => ({ favorites, isFavorite, toggle, ready }),
    [favorites, isFavorite, toggle, ready],
  );

  // --- toasts ---
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3600);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const toastValue = useMemo<ToastContext>(() => ({ toast }), [toast]);

  return (
    <FavCtx.Provider value={favValue}>
      <ToastCtx.Provider value={toastValue}>
        {children}
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-glass-lg"
              >
                {t.kind === "success" && (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                )}
                {t.kind === "error" && (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                )}
                {t.kind === "info" && (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-glow" />
                )}
                <p className="flex-1 text-sm leading-snug text-[color:var(--text)]">
                  {t.message}
                </p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-muted transition-colors hover:text-white"
                  aria-label="Cerrar notificación"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ToastCtx.Provider>
    </FavCtx.Provider>
  );
}

export function useFavorites(): FavoritesContext {
  const ctx = useContext(FavCtx);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de <Providers>");
  return ctx;
}

export function useToast(): ToastContext {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <Providers>");
  return ctx;
}
