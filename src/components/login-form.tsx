"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(next || "/admin");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "No se pudo iniciar sesión.");
      }
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      {/* Fondo en video de marca (solo en el login) */}
      <div className="login-video" aria-hidden="true">
        <video
          className="login-video__el"
          autoPlay
          muted
          loop
          playsInline
          poster="/login-bg.jpg"
        >
          <source src="/login-bg.mp4" type="video/mp4" />
        </video>
        <div className="login-video__overlay" />
      </div>

      {/* Lockup de marca Grupo PDC */}
      <div className="mb-9 flex animate-fade-up flex-col items-center">
        <span className="font-display text-[0.72rem] font-bold uppercase tracking-[0.4em] text-white/70">
          Grupo
        </span>
        <span className="font-display text-6xl font-black lowercase leading-none tracking-tight text-white">
          pdc
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pdc-smile.png"
          alt="Grupo PDC"
          className="mt-1.5 h-auto w-[7.5rem] animate-floaty"
        />
        <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-brand-glow">
          Créditos &amp; Cobros
        </p>
      </div>

      <div className="animate-fade-up glass-strong rounded-2xl p-7 shadow-glass-lg">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-glow">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold text-white">Panel administrativo</h1>
            <p className="text-xs text-muted">Acceso restringido</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pl-9"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verificando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-glow transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </a>
        <p className="text-center text-xs text-muted/70">
          La contraseña se configura en la variable de entorno del servidor.
        </p>
      </div>
    </div>
  );
}
