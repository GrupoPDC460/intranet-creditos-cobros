import Link from "next/link";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { getSession } from "@/lib/require-admin";
import { ChangePasswordForm } from "@/components/change-password-form";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const session = await getSession();
  const forced = !!session?.mc;
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      {!forced && (
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Inicio
        </Link>
      )}
      <h1 className="font-display text-3xl font-semibold text-white">Mi cuenta</h1>
      <p className="mt-1 text-muted">
        Sesión: <span className="text-white">{session?.sub}</span>
      </p>

      {forced && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-sm text-white">
            Tu contraseña es <strong>temporal</strong>. Por seguridad, defínela por una personal
            para continuar usando la intranet.
          </p>
        </div>
      )}

      <div className="mt-8 glass-strong rounded-2xl p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">
          {forced ? "Define tu contraseña" : "Cambiar contraseña"}
        </h2>
        <ChangePasswordForm forced={forced} />
      </div>
    </div>
  );
}
