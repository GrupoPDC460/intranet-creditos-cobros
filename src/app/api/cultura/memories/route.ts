import { NextResponse } from "next/server";
import { getSession } from "@/lib/require-admin";
import { getMemories, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function GET() {
  if (!culturaConfigured()) return NextResponse.json({ photos: [] });
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const photos = await getMemories(20);
  return NextResponse.json({ photos });
}
