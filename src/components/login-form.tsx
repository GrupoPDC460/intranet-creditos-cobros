"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

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
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Crear cuenta
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  async function forgot(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
    } catch {
      /* respuesta uniforme */
    }
    setForgotSent(true);
  }

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
      const data = (await res.json().catch(() => ({}))) as { error?: string; pending?: boolean };
      if (res.ok) {
        setRequested(true);
      } else {
        setRegError(data.error ?? "No se pudo enviar la solicitud.");
      }
    } catch {
      setRegError("Error de red. Intenta de nuevo.");
    } finally {
      setRegLoading(false);
    }
  }

  function goSignIn() {
    setSignUpMode(false);
  }

  return (
    <div className="neu-page">
      <div className={"neu-main" + (signUpMode ? " is-signup" : "")}>
        {/* ---- Solicitar acceso ---- */}
        <div className="neu-container neu-a">
          {requested ? (
            <div className="neu-form">
              <h2 className="neu-title">Solicitud enviada</h2>
              <p className="neu-lead">
                Tu solicitud llegó al administrador. Cuando la apruebe, recibirás tu usuario y
                contraseña para ingresar.
              </p>
              <button type="button" className="neu-btn neu-btn--solid" onClick={goSignIn}>
                Volver a iniciar sesión
              </button>
            </div>
          ) : (
            <form className="neu-form" onSubmit={register}>
              <h2 className="neu-title">Solicitar acceso</h2>
              <p className="neu-lead">
                Solicita tu acceso con tu correo <strong>@grupopdc.com</strong>. El administrador
                lo aprueba y te genera usuario y contraseña.
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  "Solicitar acceso"
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
                className="neu-input neu-input--eye"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="neu-eye"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPw ? "Ocultar" : "Mostrar"}
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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
            <button
              type="button"
              className="neu-link"
              onClick={() => {
                setForgotOpen((v) => !v);
                setForgotSent(false);
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>

            {forgotOpen && !forgotSent && (
              <div className="neu-forgot">
                <p className="neu-forgot__lead">
                  Ingresa tu correo @grupopdc.com y el administrador procesará tu restablecimiento.
                </p>
                <div className="neu-field">
                  <Mail className="neu-ic" />
                  <input
                    className="neu-input"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu.correo@grupopdc.com"
                  />
                </div>
                <button type="button" className="neu-btn" onClick={forgot} disabled={!forgotEmail}>
                  Enviar solicitud
                </button>
              </div>
            )}
            {forgotSent && (
              <p className="neu-forgot__ok">
                Si tu cuenta existe, el administrador procesará tu restablecimiento y te dará una
                contraseña nueva.
              </p>
            )}
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
              ¿Nuevo en el equipo? Solicita tu acceso con tu correo @grupopdc.com.
            </p>
            <button type="button" className="neu-btn neu-btn--ghost" onClick={() => setSignUpMode(true)}>
              Solicitar acceso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
