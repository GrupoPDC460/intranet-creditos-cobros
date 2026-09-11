"use client";
import { useEffect, useRef } from "react";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  divider?: boolean;
  onClick: () => void;
}

export function ContextMenu({
  x, y, items, onClose,
}: {
  x: number; y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [onClose]);

  // Ajustar posición para no salirse de pantalla
  const menuW = 200, menuH = items.length * 36 + 8;
  const left = x + menuW > window.innerWidth ? x - menuW : x;
  const top  = y + menuH > window.innerHeight ? y - menuH : y;

  return (
    <div
      ref={ref}
      className="fixed z-[500] min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#0d1a3a]/95 py-1 shadow-2xl backdrop-blur"
      style={{ left, top }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1 h-px bg-white/10" />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
              item.danger
                ? "text-rose-300 hover:bg-rose-500/20"
                : "text-white hover:bg-white/10"
            }`}
          >
            {item.icon && <span className="h-4 w-4 shrink-0 opacity-70">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
