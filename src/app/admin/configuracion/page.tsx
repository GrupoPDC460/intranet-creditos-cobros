import { Database, HardDrive, ShieldCheck, CheckCircle2, Circle } from "lucide-react";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configuración" };

function EnvRow({ name, set }: { name: string; set: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {set ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      ) : (
        <Circle className="h-4 w-4 text-muted/50" />
      )}
      <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{name}</code>
      <span className="text-muted">{set ? "configurada" : "no configurada"}</span>
    </li>
  );
}

export default function AdminSettingsPage() {
  const repo = getRepository();
  const supabaseOn = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const secretOn = Boolean(process.env.SESSION_SECRET);
  const passOn = Boolean(process.env.ADMIN_PASSWORD);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white">Configuración</h1>
        <p className="text-sm text-muted">Estado del entorno y persistencia.</p>
      </div>

      <div className="glass mb-4 rounded-2xl p-5 shadow-glass">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10"
            style={{
              background: repo.writable ? "rgba(33,163,102,0.15)" : "rgba(245,166,35,0.15)",
              color: repo.writable ? "#21A366" : "#F3B24E",
            }}
          >
            {repo.writable ? (
              <Database className="h-5 w-5" />
            ) : (
              <HardDrive className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="font-display text-base font-semibold text-white">
              {repo.writable ? "Supabase conectado" : "Modo semilla (solo lectura)"}
            </p>
            <p className="text-sm text-muted">
              {repo.writable
                ? "Los cambios del panel se guardan de forma permanente."
                : "Se muestra contenido de ejemplo. Conecta Supabase para editar."}
            </p>
          </div>
        </div>
      </div>

      <div className="glass mb-4 rounded-2xl p-5 shadow-glass">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-glow" />
          <h2 className="font-display text-base font-semibold text-white">
            Variables de entorno
          </h2>
        </div>
        <ul className="space-y-2">
          <EnvRow name="ADMIN_PASSWORD" set={passOn} />
          <EnvRow name="SESSION_SECRET" set={secretOn} />
          <EnvRow name="NEXT_PUBLIC_SUPABASE_URL" set={supabaseOn} />
          <EnvRow name="SUPABASE_SERVICE_ROLE_KEY" set={supabaseOn} />
        </ul>
      </div>

      <div className="glass rounded-2xl p-5 text-sm text-muted shadow-glass">
        <h2 className="mb-2 font-display text-base font-semibold text-white">
          Cómo habilitar la persistencia
        </h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Crea un proyecto en Supabase.</li>
          <li>
            Ejecuta el archivo <code className="rounded bg-white/10 px-1">supabase/schema.sql</code>{" "}
            en el editor SQL (crea tablas y carga la semilla).
          </li>
          <li>
            En Vercel, define <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="rounded bg-white/10 px-1">SUPABASE_SERVICE_ROLE_KEY</code>,{" "}
            <code className="rounded bg-white/10 px-1">ADMIN_PASSWORD</code> y{" "}
            <code className="rounded bg-white/10 px-1">SESSION_SECRET</code>.
          </li>
          <li>Vuelve a desplegar. El panel pasará a modo escritura automáticamente.</li>
        </ol>
      </div>
    </div>
  );
}
