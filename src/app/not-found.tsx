import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
      <Logo className="mb-10" />
      <div className="glass grid h-14 w-14 place-items-center rounded-2xl text-brand-glow">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-4xl font-semibold text-white">
        Página no encontrada
      </h1>
      <p className="mt-3 max-w-md text-muted">
        El recurso que buscas no existe o fue movido. Vuelve al inicio para
        seguir navegando.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Volver al inicio
      </Link>
    </div>
  );
}
