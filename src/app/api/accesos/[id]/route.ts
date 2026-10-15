import { NextResponse } from "next/server";
import { vaultUser, audit, updateEntry, deleteEntry, validCipher } from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => NextResponse.json({ error: "No encontrado." }, { status: 404 });
const UUID = /^[0-9a-f-]{36}$/i;

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const login = await vaultUser();
  if (!login || !UUID.test(params.id)) return notFound();
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !validCipher(body.iv, body.ciphertext)) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }
  try {
    await updateEntry(params.id, body.iv as string, body.ciphertext as string, login);
    await audit(login, "editar", params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const login = await vaultUser();
  if (!login || !UUID.test(params.id)) return notFound();
  try {
    await deleteEntry(params.id);
    await audit(login, "eliminar", params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
  }
}
