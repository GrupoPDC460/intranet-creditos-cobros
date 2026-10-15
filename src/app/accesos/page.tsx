import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, KeyRound } from "lucide-react";
import { getPublicView } from "@/lib/data/public";
import { SiteShell } from "@/components/site-shell";
import { AccesosVault } from "@/components/accesos-vault";
import { vaultUser } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default async function AccesosPage() {
  // Verificación en el servidor: sin permiso, la página "no existe".
  if (!(await vaultUser())) notFound();
  const { categories, resources } = await getPublicView();

  return (
    <SiteShell data={{ categories, resources }}>
      <section className="pt-10 sm:pt-14">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Inicio
        </Link>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5">
            <KeyRound className="h-6 w-6 text-brand-glow" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">Accesos</h1>
            <p className="text-muted">Usuarios, contraseñas y enlaces de las aplicaciones del departamento.</p>
          </div>
        </div>
        <AccesosVault />
      </section>
    </SiteShell>
  );
}
