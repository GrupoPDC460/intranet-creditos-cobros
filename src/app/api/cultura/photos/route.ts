import { NextResponse } from "next/server";
import { getSession } from "@/lib/require-admin";
import { getPhotos, culturaConfigured } from "@/lib/cultura";
export const runtime = "nodejs";
export async function GET(req: Request) {
  if (!culturaConfigured()) return NextResponse.json({ photos: [] });
  if (!(await getSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const albumId = new URL(req.url).searchParams.get("albumId") || "";
  if (!albumId) return NextResponse.json({ error: "Falta albumId." }, { status: 400 });
  const photos = await getPhotos(albumId);
  return NextResponse.json({ photos });
}
