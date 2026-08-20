"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { HeaderBar, SearchCommand, type PublicData } from "@/components/header";
import { Logo } from "@/components/ui";

const SearchOpenCtx = createContext<() => void>(() => {});
export function useOpenSearch() {
  return useContext(SearchOpenCtx);
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.08]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <Logo />
        <p className="text-sm text-muted">
          Un solo lugar. Todas nuestras herramientas.
        </p>
        <p className="text-xs text-muted/70">
          © {new Date().getFullYear()} Grupo PDC · Créditos &amp; Cobros
        </p>
      </div>
    </footer>
  );
}

export function SiteShell({
  data,
  children,
}: {
  data: PublicData;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SearchOpenCtx.Provider value={() => setOpen(true)}>
      <HeaderBar onOpenSearch={() => setOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6">{children}</main>
      <Footer />
      <SearchCommand data={data} open={open} onClose={() => setOpen(false)} />
    </SearchOpenCtx.Provider>
  );
}
