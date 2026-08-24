"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, Copy, Check } from "lucide-react";

const LOGO = (
  <div className="neu-logo">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/pdc-logo.png" alt="Grupo PDC" />
  </div>
);

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [signUpMode, setSignUpMode] = useState(false);

  // Iniciar sesión
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Crear cuenta
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function signIn(e: React.FormEvent) {
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

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);
    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        username?: string;
        password?: string;
      };
      if (res.ok && data.username && data.password) {
        setCreated({ username: data.username, password: data.password });
      } else {
        setRegError(data.error ?? "No se pudo crear la cuenta.");
      }
    } catch {
      setRegError("Error de red. Intenta de nuevo.");
    } finally {
      setRegLoading(false);
    }
  }

  function copyCreds() {
    if (!created) return;
    navigator.clipboard
      ?.writeText(`Usuario: ${created.username}\nContraseña: ${created.password}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  function goSignIn() {
    if (created) setUser(created.username);
    setSignUpMode(false);
  }

  return (
    <div className="neu-page">
      <div className={"neu-main" + (signUpMode ? " is-signup" : "")}>
        {/* ---- Crear cuenta ---- */}
        <div className="neu-container neu-a">
          {created ? (
            <div className="neu-form">
              <h2 className="neu-title">¡Cuenta creada!</h2>
              <p className="neu-lead">Guarda estas credenciales, las necesitarás para entrar.</p>
              <div className="neu-creds">
                <div className="neu-creds__row">
                  <span className="neu-creds__k">Usuario</span>
                  <span className="neu-creds__v">{created.username}</span>
                </div>
                <div className="neu-creds__row">
                  <span className="neu-creds__k">Contraseña</span>
                  <span className="neu-creds__v">{created.password}</span>
                </div>
              </div>
              <button type="button" className="neu-btn" onClick={copyCreds}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
              <button type="button" className="neu-btn neu-btn--solid" onClick={goSignIn}>
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <form className="neu-form" onSubmit={register}>
              <h2 className="neu-title">Crear cuenta</h2>
              <p className="neu-lead">
                Regístrate con tu correo <strong>@grupopdc.com</strong>. Te generaremos usuario y
                contraseña.
              </p>
              <div className="neu-field">
                <User className="neu-ic" />
                <input
                  className="neu-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="neu-field">
                <Mail className="neu-ic" />
                <input
                  className="neu-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@grupopdc.com"
                  autoComplete="email"
                />
              </div>
              {regError && <p className="neu-error">{regError}</p>}
              <button
                type="submit"
                className="neu-btn neu-btn--solid"
                disabled={regLoading || !email}
              >
                {regLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creando…
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>
              <button type="button" className="neu-link" onClick={() => setSignUpMode(false)}>
                Ya tengo acceso
              </button>
            </form>
          )}
        </div>

        {/* ---- Iniciar sesión ---- */}
        <div className="neu-container neu-b">
          <form className="neu-form" onSubmit={signIn}>
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
            {LOGO}
            <h3 className="neu-switch__title">¡Bienvenido!</h3>
            <p className="neu-switch__text">
              Ingresa con tus credenciales para acceder a la intranet de Créditos &amp; Cobros.
            </p>
            <button type="button" className="neu-btn neu-btn--ghost" onClick={() => setSignUpMode(false)}>
              Iniciar sesión
            </button>
          </div>

          <div className="neu-switch__panel is-b">
            {LOGO}
            <h3 className="neu-switch__title">Créditos &amp; Cobros</h3>
            <p className="neu-switch__text">
              ¿Nuevo en el equipo? Crea tu cuenta con tu correo @grupopdc.com.
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
