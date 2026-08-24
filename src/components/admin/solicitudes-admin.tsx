"use client";

import { useState } from "react";
import { Check, X, Copy, UserPlus, Mail, ShieldCheck, Loader2, KeyRound, Trash2, UserCog } from "lucide-react";
import { useToast } from "@/components/providers";
import { Modal } from "@/components/admin/ui";

interface Pending {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  createdAt: string;
}
interface Active {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  role: string;
  resetRequested: boolean;
}

export function SolicitudesAdmin({
  configured,
  pending,
  active,
}: {
  configured: boolean;
  pending: Pending[];
  active: Active[];
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ username: string; password: string; email: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  function reload() {
    setTimeout(() => window.location.assign("/admin/solicitudes"), 400);
  }

  async function approve(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        username?: string;
        password?: string;
        email?: string;
        error?: string;
      };
      if (res.ok && data.username && data.password) {
        setCreds({ username: data.username, password: data.password, email: data.email || "" });
      } else {
        toast(data.error ?? "No se pudo aprobar.", "error");
      }
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/users/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast("Solicitud rechazada", "success");
        reload();
      } else {
        toast("No se pudo rechazar.", "error");
      }
    } finally {
      setBusy(null);
    }
  }

  async function reset(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/users/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        username?: string;
        password?: string;
        email?: string;
        error?: string;
      };
      if (res.ok && data.username && data.password) {
        setCreds({ username: data.username, password: data.password, email: data.email || "" });
      } else {
        toast(data.error ?? "No se pudo restablecer.", "error");
      }
    } finally {
      setBusy(null);
    }
  }

  async function changeRole(id: string, role: "admin" | "member", label: string) {
    const verb = role === "admin" ? "delegar como administrador a" : "quitar el rol de administrador a";
    if (!window.confirm(`¿Deseas ${verb} ${label}?`)) return;
    setBusy(id);
    try {
      const res = await fetch("/api/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (res.ok) {
        toast(role === "admin" ? "Ahora es administrador" : "Rol de administrador retirado", "success");
        reload();
      } else {
        toast("No se pudo actualizar el rol.", "error");
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, label: string) {
    if (!window.confirm(`¿Eliminar la cuenta de ${label}? Esta acción no se puede deshacer.`)) return;
    setBusy(id);
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast("Cuenta eliminada", "success");
        reload();
      } else {
        toast("No se pudo eliminar.", "error");
      }
    } finally {
      setBusy(null);
    }
  }

  function copyCreds() {
    if (!creds) return;
    navigator.clipboard
      ?.writeText(
        `Acceso a la Intranet Créditos & Cobros\nUsuario: ${creds.username}\nContraseña: ${creds.password}`,
      )
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white">Solicitudes de acceso</h1>
        <p className="text-muted">Aprueba o rechaza el acceso a la intranet. Tú das el aval.</p>
      </div>

      {!configured && (
        <div className="glass rounded-2xl p-5 text-sm text-muted">
          El registro de usuarios requiere la base de datos configurada (Supabase).
        </div>
      )}

      {/* Pendientes */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-white">Pendientes</h2>
          <span className="chip">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted">
            <UserPlus className="mx-auto mb-2 h-6 w-6 opacity-60" />
            No hay solicitudes pendientes.
          </div>
        ) : (
          <ul className="space-y-2">
            {pending.map((p) => (
              <li
                key={p.id}
                className="glass flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 sm:flex-nowrap"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-brand-glow">
                  <Mail className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{p.fullName || p.email}</p>
                  <p className="truncate text-sm text-muted">
                    {p.email} · usuario sugerido: <span className="text-white">{p.username}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(p.id)}
                    disabled={busy === p.id}
                    className="btn btn-primary"
                  >
                    {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Aprobar
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    disabled={busy === p.id}
                    className="btn btn-ghost"
                  >
                    <X className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Activos */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-white">Usuarios activos</h2>
          <span className="chip">{active.length}</span>
        </div>
        {active.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted">
            Aún no hay usuarios activos.
          </div>
        ) : (
          <ul className="space-y-2">
            {active.map((u) => (
              <li key={u.id} className="glass flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 sm:flex-nowrap">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-brand-glow">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {u.fullName || u.username}{" "}
                    {u.role === "admin" && <span className="chip ml-1">admin</span>}
                    {u.resetRequested && (
                      <span className="ml-1 rounded-md bg-gold/20 px-1.5 py-0.5 text-[0.7rem] font-semibold text-gold">
                        pidió restablecer
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {u.email} · {u.username}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      changeRole(
                        u.id,
                        u.role === "admin" ? "member" : "admin",
                        u.fullName || u.username,
                      )
                    }
                    disabled={busy === u.id}
                    className="btn btn-ghost"
                    title={u.role === "admin" ? "Quitar rol de administrador" : "Delegar como administrador"}
                  >
                    <UserCog className="h-4 w-4" />
                    {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                  </button>
                  <button
                    onClick={() => reset(u.id)}
                    disabled={busy === u.id}
                    className="btn btn-ghost"
                    title="Generar una contraseña nueva"
                  >
                    {busy === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Restablecer
                  </button>
                  <button
                    onClick={() => remove(u.id, u.fullName || u.username)}
                    disabled={busy === u.id}
                    className="btn btn-danger"
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal de credenciales generadas */}
      <Modal
        open={!!creds}
        onClose={() => {
          setCreds(null);
          reload();
        }}
        title="Cuenta aprobada"
      >
        <p className="mb-4 text-sm text-muted">
          Comparte estas credenciales con la persona. La contraseña no se vuelve a mostrar.
        </p>
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <Row k="Correo" v={creds?.email ?? ""} />
          <Row k="Usuario" v={creds?.username ?? ""} />
          <Row k="Contraseña" v={creds?.password ?? ""} />
        </div>
        <button onClick={copyCreds} className="btn btn-primary mt-4 w-full">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar credenciales"}
        </button>
      </Modal>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted">{k}</span>
      <span className="font-mono text-sm font-semibold text-white">{v}</span>
    </div>
  );
}
