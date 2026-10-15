"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

/** Botón de Accesos: solo se muestra si el servidor confirma el permiso. */
export function AccesosLink({ variant = "icon" }: { variant?: "icon" | "nav" }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let vivo = true;
    fetch("/api/accesos/check", { cache: "no-store" })
      .then((r) => { if (vivo) setOk(r.ok); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);
  if (!ok) return null;

  if (variant === "nav") {
    return (
      <Link
        href="/accesos"
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-white"
      >
        <KeyRound className="h-4 w-4" />
        Accesos
      </Link>
    );
  }
  return (
    <Link
      href="/accesos"
      className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
      aria-label="Accesos"
      title="Accesos"
    >
      <KeyRound className="h-4 w-4" />
    </Link>
  );
}
