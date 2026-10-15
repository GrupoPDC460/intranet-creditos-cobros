import { NextResponse } from "next/server";
import { vaultUser } from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Indica si la sesión actual puede ver la sección Accesos (sin revelar nada más). */
export async function GET() {
  const ok = !!(await vaultUser());
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "No encontrado." }, { status: 404 });
}
