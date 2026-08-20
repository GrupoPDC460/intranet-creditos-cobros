"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const reduce = useReducedMotion();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="fixed inset-0 bg-[#05081c]/75 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "glass-strong relative my-4 w-full rounded-2xl shadow-glass-lg",
              wide ? "max-w-2xl" : "max-w-lg",
            )}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Eliminar",
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="pt-1.5 text-sm text-[color:var(--text)]">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-ghost">
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={loading} className="btn btn-danger">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
        checked
          ? "border-brand/40 bg-brand/70"
          : "border-white/10 bg-white/5",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function ReadOnlyBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
      <div className="text-sm">
        <p className="font-semibold text-white">Almacenamiento en solo lectura</p>
        <p className="text-muted">
          Estás viendo el contenido de ejemplo. Para crear, editar o eliminar de
          forma permanente, configura Supabase (variables{" "}
          <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="rounded bg-white/10 px-1">SUPABASE_SERVICE_ROLE_KEY</code>) y
          ejecuta <code className="rounded bg-white/10 px-1">supabase/schema.sql</code>.
        </p>
      </div>
    </div>
  );
}
