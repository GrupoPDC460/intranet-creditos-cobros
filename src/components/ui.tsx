"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/* --------------------------------- Logo PDC --------------------------------- */

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center">
        <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
          <defs>
            <linearGradient id="pdc-mark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7DBFE6" />
              <stop offset="1" stopColor="#00216F" />
            </linearGradient>
          </defs>
          <rect
            x="2.5"
            y="2.5"
            width="35"
            height="35"
            rx="11"
            fill="url(#pdc-mark)"
            opacity="0.16"
          />
          <rect
            x="2.5"
            y="2.5"
            width="35"
            height="35"
            rx="11"
            fill="none"
            stroke="url(#pdc-mark)"
            strokeWidth="1.3"
            opacity="0.7"
          />
          {/* monograma: tres barras ascendentes = flujo de cartera */}
          <rect x="11" y="22" width="4.5" height="8" rx="2.25" fill="#FF5100" />
          <rect x="17.75" y="16" width="4.5" height="14" rx="2.25" fill="#7CB8FF" />
          <rect x="24.5" y="10" width="4.5" height="20" rx="2.25" fill="#EAF0FF" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-bold tracking-tight text-white">
          Grupo PDC
        </span>
        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-brand-glow">
          Créditos &amp; Cobros
        </span>
      </span>
    </span>
  );
}

/* --------------------------------- Reveal ----------------------------------- */

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      custom={index}
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------- SheenCard ---------------------------------- */

/** Tarjeta de vidrio cuyo brillo especular sigue el cursor. */
export function SheenCard({
  children,
  className,
  interactive = true,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || !interactive) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "glass sheen rounded-2xl shadow-glass",
        interactive &&
          "transition-transform duration-300 will-change-transform hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------- EmptyState --------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-brand-glow">
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ----------------------------- Section heading ------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brand-glow">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
