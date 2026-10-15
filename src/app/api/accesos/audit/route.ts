import { NextResponse } from "next/server";
import { vaultUser, audit } from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCIONES = new Set(["abrir", "ver", "copiar_usuario", "copiar_clave"]);
const UUID = /^[0-9a-f-]{36}$/i;

/** Registra en la bitácora cuando se abre la bóveda o se ve/copia un acceso. */
export async function POST(req: Request) {
  const login = await vaultUser();
  if (!login) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { action?: string; entryId?: string } | null;
  if (!body || !body.action || !ACCIONES.has(body.action)) {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }
  const entry = body.entryId && UUID.test(body.entryId) ? body.entryId : null;
  await audit(login, body.action, entry);
  return NextResponse.json({ ok: true });
}
