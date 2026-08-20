import { NextResponse } from "next/server";
import { getRepository, ReadOnlyError } from "@/lib/data/repository";
import { isAdmin } from "@/lib/require-admin";
import { validateResourceInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const repo = getRepository();
  const data = await repo.getAll();
  return NextResponse.json({ ...data, writable: repo.writable });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const raw = await req.json().catch(() => null);
  const result = validateResourceInput(raw);
  if (!result.ok || !result.value) {
    return NextResponse.json({ error: result.errors.join(" ") }, { status: 422 });
  }
  try {
    const created = await getRepository().createResource(result.value);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof ReadOnlyError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json({ error: "No se pudo crear el recurso." }, { status: 500 });
  }
}
