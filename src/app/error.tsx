"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      <button onClick={reset} className="btn btn-primary mt-8">
        Reintentar
      </button>
    </div>
  );
}
