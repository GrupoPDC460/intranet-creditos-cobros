"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User } from "lucide-react";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [signUpMode, setSignUpMode] = useState(false);
  const [user, setUser] = useState("");
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
        body: JSON.stringify({ username: user, password }),
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
    <div className="neu-page">
      <div className={"neu-main" + (signUpMode ? " is-signup" : "")}>
        {/* ---- Panel: Crear cuenta (registro gestionado por el admin) ---- */}
        <div className="neu-container neu-a">
          <div className="neu-form">
            <h2 className="neu-title">Crear cuenta</h2>
            <p className="neu-lead">
              El registro de usuarios lo gestiona el administrador del departamento.
            </p>
            <div className="neu-field">
              <User className="neu-ic" />
              <input className="neu-input" type="text" placeholder="Nombre" disabled />
            </div>
            <div className="neu-field">
              <Mail className="neu-ic" />
              <input className="neu-input" type="email" placeholder="Correo" disabled />
            </div>
            <button type="button" className="neu-btn" onClick={() => setSignUpMode(false)}>
              Ya tengo acceso
            </button>
          </div>
        </div>

        {/* ---- Panel: Iniciar sesión (real) ---- */}
        <div className="neu-container neu-b">
          <form className="neu-form" onSubmit={submit}>
            <h2 className="neu-title">Iniciar sesión</h2>
            <p className="neu-lead">Ingresa con tus credenciales del departamento.</p>

            <div className="neu-field">
              <User className="neu-ic" />
              <input
                className="neu-input"
                type="text"
                autoFocus
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Usuario o correo"
                autoComplete="username"
              />
            </div>
            <div className="neu-field">
              <Lock className="neu-ic" />
              <input
                className="neu-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="neu-error">{error}</p>}

            <button
              type="submit"
              className="neu-btn neu-btn--solid"
              disabled={loading || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verificando…
                </>
              ) : (
                "Ingresar"
              )}
            </button>
            <a href="/" className="neu-link">
              Volver al inicio
            </a>
          </form>
        </div>

        {/* ---- Overlay deslizante (marca PDC) ---- */}
        <div className="neu-switch">
          <div className="neu-switch__circle" />
          <div className="neu-switch__circle neu-switch__circle--t" />

          <div className="neu-switch__panel is-a">
            <div className="neu-brand">
              <span className="neu-brand__grupo">Grupo</span>
              <span className="neu-brand__pdc">pdc</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pdc-smile.png" alt="Grupo PDC" className="neu-brand__smile" />
            </div>
            <h3 className="neu-switch__title">¡Bienvenido!</h3>
            <p className="neu-switch__text">
              Ingresa con tus credenciales para acceder a la intranet de Créditos &amp; Cobros.
            </p>
            <button type="button" className="neu-btn neu-btn--ghost" onClick={() => setSignUpMode(false)}>
              Iniciar sesión
            </button>
          </div>

          <div className="neu-switch__panel is-b">
            <div className="neu-brand">
              <span className="neu-brand__grupo">Grupo</span>
              <span className="neu-brand__pdc">pdc</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pdc-smile.png" alt="Grupo PDC" className="neu-brand__smile" />
            </div>
            <h3 className="neu-switch__title">Créditos &amp; Cobros</h3>
            <p className="neu-switch__text">
              Un solo lugar para todos los sistemas, dashboards y herramientas del equipo.
            </p>
            <button type="button" className="neu-btn neu-btn--ghost" onClick={() => setSignUpMode(true)}>
              Crear cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
