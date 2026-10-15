import { NextResponse } from "next/server";
import {
  vaultUser, audit, listEntries, createEntry, validCipher,
  getSlot, countSlots, upsertSlot, listarMiembros, validSlot,
} from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Si no tiene acceso, se responde 404: no se revela que la bóveda existe.
const notFound = () => NextResponse.json({ error: "No encontrado." }, { status: 404 });

export async function GET() {
  const yo = await vaultUser();
  if (!yo) return notFound();
  const [miSlot, total, miembros, entries] = await Promise.all([
    getSlot(yo), countSlots(), listarMiembros(), listEntries(),
  ]);
  return NextResponse.json({ yo, miSlot, hayBoveda: total > 0, miembros, entries });
}

export async function POST(req: Request) {
  const yo = await vaultUser();
  if (!yo) return notFound();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  // Crear la bóveda (solo si nadie la ha creado): ranura propia.
  if (body.action === "init") {
    if (!validSlot(body.slot)) return NextResponse.json({ error: "Parámetros inválidos." }, { status: 422 });
    if ((await countSlots()) > 0) {
      return NextResponse.json({ error: "La bóveda ya está configurada." }, { status: 409 });
    }
    await upsertSlot(yo, body.slot, false, yo);
    await audit(yo, "configurar");
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // Asignar/cambiar la clave de una persona (la propia, o una temporal a otro).
  if (body.action === "setSlot") {
    const destino = typeof body.login === "string" ? body.login.toLowerCase() : "";
    if (!validSlot(body.slot) || !destino) {
      return NextResponse.json({ error: "Parámetros inválidos." }, { status: 422 });
    }
    const miembros = await listarMiembros();
    if (!miembros.some((m) => m.login === destino)) {
      return NextResponse.json({ error: "Esa persona no tiene acceso a la bóveda." }, { status: 403 });
    }
    // Para asignar clave a otro hay que tener acceso propio a la bóveda.
    if (destino !== yo && !(await getSlot(yo))) {
      return NextResponse.json({ error: "Primero debes tener tu propia clave." }, { status: 403 });
    }
    const temporal = destino !== yo; // clave puesta por otro: se obliga a cambiarla
    await upsertSlot(destino, body.slot, temporal, yo);
    await audit(yo, temporal ? `asignar_clave:${destino}` : "cambiar_clave");
    return NextResponse.json({ ok: true });
  }

  // Nuevo acceso (llega ya cifrado desde el navegador).
  if (body.action === "create") {
    if (!validCipher(body.iv, body.ciphertext)) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
    }
    try {
      const id = await createEntry(body.iv as string, body.ciphertext as string, yo);
      await audit(yo, "crear", id);
      return NextResponse.json({ id }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
}
