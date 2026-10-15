"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyRound, Lock, Unlock, Plus, Search, Copy, Eye, EyeOff, Pencil, Trash2,
  ExternalLink, ShieldCheck, AlertTriangle, Check, X,
} from "lucide-react";
import {
  createVaultMeta, unlockVault, encryptAcceso, decryptAcceso, type Acceso,
} from "@/lib/vault-crypto";

type Meta = { salt: string; iterations: number; check_iv: string; check_ct: string };
type Row = { id: string; iv: string; ciphertext: string; updated_at: string; updated_by: string | null };
type Item = Acceso & { id: string; updated_at: string; updated_by: string | null };

const AUTO_LOCK_MS = 10 * 60 * 1000; // 10 minutos sin actividad
const VACIO: Acceso = { app: "", usuario: "", clave: "", url: "", notas: "" };

function registrar(action: string, entryId?: string) {
  fetch("/api/accesos/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, entryId }),
  }).catch(() => {});
}

/** Solo se enlazan URLs http(s); cualquier otra cosa se muestra como texto. */
function urlSegura(u: string): string | null {
  const s = u.trim();
  if (!s) return null;
  const conEsquema = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const p = new URL(conEsquema);
    return p.protocol === "http:" || p.protocol === "https:" ? p.href : null;
  } catch {
    return null;
  }
}

export function AccesosVault() {
  const [estado, setEstado] = useState<"cargando" | "error" | "configurar" | "bloqueada" | "abierta">("cargando");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState("");
  const keyRef = useRef<CryptoKey | null>(null);

  const cargar = useCallback(async () => {
    const r = await fetch("/api/accesos", { cache: "no-store" });
    if (!r.ok) { setEstado("error"); return null; }
    const data = (await r.json()) as { meta: Meta | null; entries: Row[] };
    setMeta(data.meta);
    setRows(data.entries);
    return data;
  }, []);

  useEffect(() => {
    cargar().then((d) => { if (d) setEstado(d.meta ? "bloqueada" : "configurar"); });
  }, [cargar]);

  const descifrarTodo = useCallback(async (lista: Row[]) => {
    const key = keyRef.current;
    if (!key) return;
    const out: Item[] = [];
    for (const r of lista) {
      try {
        const a = await decryptAcceso(key, r.iv, r.ciphertext);
        out.push({ ...a, id: r.id, updated_at: r.updated_at, updated_by: r.updated_by });
      } catch {
        // Registro dañado o de otra clave: se omite sin romper la vista.
      }
    }
    out.sort((a, b) => a.app.localeCompare(b.app, "es", { sensitivity: "base" }));
    setItems(out);
  }, []);

  const bloquear = useCallback((aviso?: string) => {
    keyRef.current = null;
    setItems([]);
    setEstado("bloqueada");
    if (aviso) setMsg(aviso);
  }, []);

  // Bloqueo automático por inactividad.
  useEffect(() => {
    if (estado !== "abierta") return;
    let t = window.setTimeout(() => bloquear("Bóveda bloqueada por inactividad."), AUTO_LOCK_MS);
    const reset = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => bloquear("Bóveda bloqueada por inactividad."), AUTO_LOCK_MS);
    };
    const ev = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    ev.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => { window.clearTimeout(t); ev.forEach((e) => window.removeEventListener(e, reset)); };
  }, [estado, bloquear]);

  async function recargarYDescifrar() {
    const d = await cargar();
    if (d) await descifrarTodo(d.entries);
  }

  if (estado === "cargando") {
    return <p className="mt-10 text-muted">Cargando…</p>;
  }
  if (estado === "error") {
    return <p className="mt-10 text-muted">No tienes acceso a esta sección.</p>;
  }
  if (estado === "configurar") {
    return (
      <Configurar
        onListo={async (key) => {
          keyRef.current = key;
          await recargarYDescifrar();
          setEstado("abierta");
        }}
      />
    );
  }
  if (estado === "bloqueada" && meta) {
    return (
      <Desbloquear
        meta={meta}
        aviso={msg}
        onListo={async (key) => {
          keyRef.current = key;
          setMsg("");
          await descifrarTodo(rows);
          registrar("abrir");
          setEstado("abierta");
        }}
      />
    );
  }

  return (
    <Boveda
      items={items}
      llave={keyRef}
      onCambio={recargarYDescifrar}
      onBloquear={() => bloquear()}
    />
  );
}

/* ------------------------------ Configuración ------------------------------ */

function Configurar({ onListo }: { onListo: (k: CryptoKey) => void }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [entiendo, setEntiendo] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (p1.length < 12) return setErr("Usa al menos 12 caracteres.");
    if (p1 !== p2) return setErr("Las claves no coinciden.");
    if (!entiendo) return setErr("Confirma que entiendes que la clave no se puede recuperar.");
    setBusy(true);
    try {
      const { meta, key } = await createVaultMeta(p1);
      const r = await fetch("/api/accesos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", meta }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "No se pudo configurar.");
      }
      onListo(key);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={crear} className="glass-strong mx-auto mt-10 max-w-md rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5">
          <ShieldCheck className="h-5 w-5 text-brand-glow" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Crear clave maestra</h2>
          <p className="text-sm text-muted">Protege todas las contraseñas de la bóveda.</p>
        </div>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-white">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <span>
          Esta clave <strong>no se guarda en ningún lado</strong>. Si se olvida, las contraseñas
          guardadas <strong>no se pueden recuperar</strong>. Anótala en un lugar seguro y compártela
          solo con quien deba usar la bóveda.
        </span>
      </div>
      <label className="label mt-5">Clave maestra</label>
      <input className="field" type="password" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} />
      <label className="label mt-3">Repetir clave maestra</label>
      <input className="field" type="password" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} />
      <label className="mt-4 flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" className="mt-1" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} />
        Entiendo que si la clave maestra se pierde, no hay forma de recuperarla.
      </label>
      {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
      <button className="btn btn-primary mt-5 w-full" disabled={busy}>
        {busy ? "Configurando…" : "Crear bóveda"}
      </button>
    </form>
  );
}

/* ------------------------------- Desbloqueo -------------------------------- */

function Desbloquear({ meta, aviso, onListo }: { meta: Meta; aviso: string; onListo: (k: CryptoKey) => void }) {
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [fallos, setFallos] = useState(0);
  const [esperaHasta, setEsperaHasta] = useState(0);

  async function abrir(e: React.FormEvent) {
    e.preventDefault();
    if (Date.now() < esperaHasta) {
      setErr(`Demasiados intentos. Espera ${Math.ceil((esperaHasta - Date.now()) / 1000)} s.`);
      return;
    }
    setErr("");
    setBusy(true);
    const key = await unlockVault(p, meta);
    setBusy(false);
    if (!key) {
      const n = fallos + 1;
      setFallos(n);
      if (n >= 5) { setEsperaHasta(Date.now() + 30000); setFallos(0); }
      setErr("Clave maestra incorrecta.");
      return;
    }
    setP("");
    onListo(key);
  }

  return (
    <form onSubmit={abrir} className="glass-strong mx-auto mt-10 max-w-md rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5">
          <Lock className="h-5 w-5 text-brand-glow" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Bóveda bloqueada</h2>
          <p className="text-sm text-muted">Escribe la clave maestra para ver los accesos.</p>
        </div>
      </div>
      {aviso && <p className="mt-4 text-sm text-gold">{aviso}</p>}
      <label className="label mt-5">Clave maestra</label>
      <input className="field" type="password" autoFocus autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} />
      {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
      <button className="btn btn-primary mt-5 w-full" disabled={busy || !p}>
        <Unlock className="h-4 w-4" />
        {busy ? "Verificando…" : "Desbloquear"}
      </button>
    </form>
  );
}

/* --------------------------------- Bóveda ---------------------------------- */

function Boveda({
  items, llave, onCambio, onBloquear,
}: {
  items: Item[];
  llave: React.MutableRefObject<CryptoKey | null>;
  onCambio: () => Promise<void>;
  onBloquear: () => void;
}) {
  const [q, setQ] = useState("");
  const [editando, setEditando] = useState<Item | "nuevo" | null>(null);
  const [aviso, setAviso] = useState("");

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => [i.app, i.usuario, i.url, i.notas].join(" ").toLowerCase().includes(t));
  }, [q, items]);

  function avisar(texto: string) {
    setAviso(texto);
    window.setTimeout(() => setAviso(""), 2200);
  }

  async function eliminar(i: Item) {
    if (!window.confirm(`¿Eliminar el acceso "${i.app}"? Esta acción no se puede deshacer.`)) return;
    const r = await fetch(`/api/accesos/${i.id}`, { method: "DELETE" });
    if (r.ok) { avisar("Acceso eliminado"); await onCambio(); }
    else avisar("No se pudo eliminar");
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="field pl-9" placeholder="Buscar aplicación, usuario o URL…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setEditando("nuevo")}>
          <Plus className="h-4 w-4" /> Nuevo acceso
        </button>
        <button className="btn btn-ghost" onClick={onBloquear} title="Bloquear bóveda">
          <Lock className="h-4 w-4" /> Bloquear
        </button>
      </div>

      <p className="mt-3 text-sm text-muted">
        {items.length} acceso{items.length === 1 ? "" : "s"} · se bloquea sola tras 10 min sin actividad
      </p>

      {aviso && (
        <div className="fixed bottom-6 right-6 z-[95] flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800/95 px-4 py-3 text-sm text-white shadow-glass-lg">
          <Check className="h-4 w-4 text-brand-glow" /> {aviso}
        </div>
      )}

      {lista.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center">
          <KeyRound className="mx-auto h-8 w-8 text-brand-glow" />
          <p className="mt-3 text-white">{items.length ? "Sin resultados para tu búsqueda." : "Aún no hay accesos guardados."}</p>
          {!items.length && <p className="mt-1 text-sm text-muted">Usa “Nuevo acceso” para agregar el primero.</p>}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((i) => (
            <Tarjeta key={i.id} item={i} onEditar={() => setEditando(i)} onEliminar={() => eliminar(i)} avisar={avisar} />
          ))}
        </div>
      )}

      {editando && (
        <Formulario
          inicial={editando === "nuevo" ? null : editando}
          llave={llave}
          onCerrar={() => setEditando(null)}
          onGuardado={async (texto) => { setEditando(null); avisar(texto); await onCambio(); }}
        />
      )}
    </div>
  );
}

function Tarjeta({
  item, onEditar, onEliminar, avisar,
}: { item: Item; onEditar: () => void; onEliminar: () => void; avisar: (t: string) => void }) {
  const [ver, setVer] = useState(false);
  const href = urlSegura(item.url);

  async function copiar(texto: string, que: "usuario" | "clave") {
    try {
      await navigator.clipboard.writeText(texto);
      avisar(que === "clave" ? "Contraseña copiada" : "Usuario copiado");
      registrar(que === "clave" ? "copiar_clave" : "copiar_usuario", item.id);
    } catch {
      avisar("No se pudo copiar");
    }
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5 shadow-glass">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-white">{item.app || "Sin nombre"}</h3>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-brand-glow hover:underline">
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.url}</span>
            </a>
          ) : item.url ? (
            <p className="truncate text-xs text-muted">{item.url}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <button className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white" onClick={onEditar} title="Editar"><Pencil className="h-4 w-4" /></button>
          <button className="rounded-lg p-1.5 text-muted hover:bg-red-500/15 hover:text-red-300" onClick={onEliminar} title="Eliminar"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {item.usuario && (
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
          <span className="w-16 shrink-0 text-xs text-muted">Usuario</span>
          <span className="min-w-0 flex-1 truncate text-sm text-white">{item.usuario}</span>
          <button className="rounded-lg p-1 text-muted hover:text-white" onClick={() => copiar(item.usuario, "usuario")} title="Copiar usuario"><Copy className="h-4 w-4" /></button>
        </div>
      )}

      {item.clave && (
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
          <span className="w-16 shrink-0 text-xs text-muted">Clave</span>
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-white">{ver ? item.clave : "••••••••••"}</span>
          <button
            className="rounded-lg p-1 text-muted hover:text-white"
            onClick={() => { if (!ver) registrar("ver", item.id); setVer((v) => !v); }}
            title={ver ? "Ocultar" : "Mostrar"}
          >
            {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button className="rounded-lg p-1 text-muted hover:text-white" onClick={() => copiar(item.clave, "clave")} title="Copiar contraseña"><Copy className="h-4 w-4" /></button>
        </div>
      )}

      {item.notas && <p className="whitespace-pre-line text-xs text-muted">{item.notas}</p>}
    </div>
  );
}

function Formulario({
  inicial, llave, onCerrar, onGuardado,
}: {
  inicial: Item | null;
  llave: React.MutableRefObject<CryptoKey | null>;
  onCerrar: () => void;
  onGuardado: (texto: string) => void;
}) {
  const base: Acceso = inicial
    ? { app: inicial.app, usuario: inicial.usuario, clave: inicial.clave, url: inicial.url, notas: inicial.notas }
    : VACIO;
  const [f, setF] = useState<Acceso>(base);
  const [verClave, setVerClave] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const sucio = JSON.stringify(f) !== JSON.stringify(base);

  // Cerrar sin guardar pide confirmación si hay cambios.
  const intentarCerrar = useCallback(() => {
    if (sucio && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar y perderlos?")) return;
    onCerrar();
  }, [sucio, onCerrar]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") intentarCerrar(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [intentarCerrar]);

  const set = (k: keyof Acceso) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.app.trim()) return setErr("Escribe el nombre de la aplicación.");
    const key = llave.current;
    if (!key) return setErr("La bóveda se bloqueó. Vuelve a desbloquearla.");
    setBusy(true);
    try {
      const limpio: Acceso = {
        app: f.app.trim(), usuario: f.usuario.trim(), clave: f.clave,
        url: f.url.trim(), notas: f.notas.trim(),
      };
      const { iv, ciphertext } = await encryptAcceso(key, limpio);
      const r = inicial
        ? await fetch(`/api/accesos/${inicial.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ iv, ciphertext }),
          })
        : await fetch("/api/accesos", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", iv, ciphertext }),
          });
      if (!r.ok) throw new Error("No se pudo guardar.");
      onGuardado(inicial ? "Acceso actualizado" : "Acceso guardado");
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#05081c]/70 backdrop-blur-sm" onClick={intentarCerrar} aria-hidden="true" />
      <form onSubmit={guardar} className="glass-strong relative w-full max-w-lg rounded-2xl p-6 shadow-glass-lg" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">{inicial ? "Editar acceso" : "Nuevo acceso"}</h2>
          <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white" onClick={intentarCerrar} aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </div>
        <label className="label mt-4">Aplicación *</label>
        <input className="field" autoFocus placeholder="Ej. JDE, Portal Avon, KACE" value={f.app} onChange={set("app")} />
        <label className="label mt-3">Usuario</label>
        <input className="field" autoComplete="off" value={f.usuario} onChange={set("usuario")} />
        <label className="label mt-3">Contraseña</label>
        <div className="relative">
          <input className="field pr-10 font-mono" type={verClave ? "text" : "password"} autoComplete="new-password" value={f.clave} onChange={set("clave")} />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-white" onClick={() => setVerClave((v) => !v)}>
            {verClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <label className="label mt-3">URL</label>
        <input className="field" placeholder="https://…" value={f.url} onChange={set("url")} />
        <label className="label mt-3">Notas</label>
        <textarea className="field" rows={2} value={f.notas} onChange={set("notas")} />
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={intentarCerrar}>Cancelar</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
}
