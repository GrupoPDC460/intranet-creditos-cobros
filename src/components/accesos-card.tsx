"use client";

import Link from "next/link";
import { KeyRound, ArrowUpRight, Lock } from "lucide-react";
import { Reveal, SheenCard } from "@/components/ui";

/** Tarjeta del inicio: solo se renderiza para quien tiene acceso a la bóveda. */
export function AccesosCard() {
  return (
    <section className="mt-16">
      <Reveal>
        <Link href="/accesos" className="block">
          <SheenCard className="group flex items-center gap-4 p-5">
            <span className="relative z-[2] grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
              <KeyRound className="h-6 w-6 text-brand-glow" />
            </span>
            <div className="relative z-[2] min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold text-white">Accesos</h3>
              <p className="text-sm text-muted">Usuarios, contraseñas y enlaces de las aplicaciones del departamento.</p>
            </div>
            <span className="chip relative z-[2] hidden sm:inline-flex"><Lock className="h-3 w-3" /> Privado</span>
            <ArrowUpRight className="relative z-[2] h-5 w-5 text-muted transition-colors group-hover:text-white" />
          </SheenCard>
        </Link>
      </Reveal>
    </section>
  );
}
