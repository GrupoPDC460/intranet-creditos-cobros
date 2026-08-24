import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/require-admin";
import { ChangePasswordForm } from "@/components/change-password-form";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const session = await getSession();
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Inicio
      </Link>
      <h1 className="font-display text-3xl font-semibold text-white">Mi cuenta</h1>
      <p className="mt-1 text-muted">
        Sesión: <span className="text-white">{session?.sub}</span>
      </p>
      <div className="mt-8 glass-strong rounded-2xl p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
