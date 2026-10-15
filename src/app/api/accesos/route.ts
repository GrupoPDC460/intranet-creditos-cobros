import { NextResponse } from "next/server";
import {
  vaultUser, audit, getMeta, createMeta, listEntries, createEntry, validCipher,
} from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Si no tiene acceso, se responde 404: no se revela que la bóveda existe.
const notFound = () => NextResponse.json({ error: "No encontrado." }, { status: 404 });

export async function GET() {
  const login = await vaultUser();
  if (!login) return notFound();
  const [meta, entries] = await Promise.all([getMeta(), listEntries()]);
  return NextResponse.json({ meta, entries });
}

export async function POST(req: Request) {
  const login = await vaultUser();
  if (!login) return notFound();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  // Configuración inicial de la clave maestra (solo una vez).
  if (body.action === "init") {
    const m = body.meta as Record<string, unknown> | undefined;
    if (
      !m || typeof m.salt !== "string" || !/^[A-Za-z0-9+/=]{20,64}$/.test(m.salt) ||
      typeof m.iterations !== "number" || m.iterations < 300000 || m.iterations > 5000000 ||
      !validCipher(m.check_iv, m.check_ct)
    ) {
      return NextResponse.json({ error: "Parámetros inválidos." }, { status: 422 });
    }
    if (await getMeta()) {
      return NextResponse.json({ error: "La bóveda ya está configurada." }, { status: 409 });
    }
    const ok = await createMeta({
      salt: m.salt, iterations: m.iterations,
      check_iv: m.check_iv as string, check_ct: m.check_ct as string,
    });
    if (!ok) return NextResponse.json({ error: "No se pudo configurar." }, { status: 500 });
    await audit(login, "configurar");
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // Nuevo acceso (llega ya cifrado desde el navegador).
  if (body.action === "create") {
    if (!validCipher(body.iv, body.ciphertext)) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
    }
    try {
      const id = await createEntry(body.iv as string, body.ciphertext as string, login);
      await audit(login, "crear", id);
      return NextResponse.json({ id }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
}
