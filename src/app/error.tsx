"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // reset() solo vuelve a pintar en el navegador; si el fallo vino del servidor
  // hay que pedir los datos de nuevo con router.refresh(), si no el botón no hace nada.
  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  useEffect(() => {
    // En producción esto podría enviarse a un servicio de monitoreo.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
      <div className="glass grid h-14 w-14 place-items-center rounded-2xl text-rose-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-white">
        Algo no cargó como esperábamos
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Ocurrió un problema al mostrar esta sección. Puedes reintentar; si
        persiste, avisa al administrador.
      </p>
      <button onClick={retry} disabled={pending} className="btn btn-primary mt-8">
        {pending ? "Reintentando…" : "Reintentar"}
      </button>
    </div>
  );
}
