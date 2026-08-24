"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export function ChangePasswordForm({ forced = false }: { forced?: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) {
      setMsg({ type: "err", text: "La nueva contraseña y su confirmación no coinciden." });
      return;
    }
    if (next.length < 8) {
      setMsg({ type: "err", text: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setMsg({ type: "ok", text: "Contraseña actualizada correctamente." });
        setCurrent(""); setNext(""); setConfirm("");
        if (forced) {
          setTimeout(() => { window.location.assign("/"); }, 800);
        } else {
          router.refresh();
        }
      } else {
        setMsg({ type: "err", text: data.error ?? "No se pudo cambiar." });
      }
    } catch {
      setMsg({ type: "err", text: "Error de red. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  const field = (
    value: string,
    set: (v: string) => void,
    ph: string,
    auto: string,
  ) => (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="password"
        value={value}
        onChange={(e) => set(e.target.value)}
        className="field pl-9"
        placeholder={ph}
        autoComplete={auto}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Contraseña actual</label>
        {field(current, setCurrent, "Tu contraseña actual", "current-password")}
      </div>
      <div>
        <label className="label">Nueva contraseña</label>
        {field(next, setNext, "Mínimo 8 caracteres", "new-password")}
      </div>
      <div>
        <label className="label">Confirmar nueva contraseña</label>
        {field(confirm, setConfirm, "Repite la nueva contraseña", "new-password")}
      </div>
      {msg && (
        <p
          className={
            "rounded-lg px-3 py-2 text-sm " +
            (msg.type === "ok"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-200")
          }
        >
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={loading || !current || !next} className="btn btn-primary w-full">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : "Actualizar contraseña"}
      </button>
    </form>
  );
}
