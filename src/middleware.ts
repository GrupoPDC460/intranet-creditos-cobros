import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  // Sin sesión válida → al login (guardando el destino).
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Contraseña temporal: obligar a cambiarla antes de usar el portal.
  if (session.mc && !req.nextUrl.pathname.startsWith("/cuenta")) {
    const url = req.nextUrl.clone();
    url.pathname = "/cuenta";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protege TODO el portal excepto: login, endpoints de auth, y archivos estáticos.
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|mp4|ico|txt|woff2?)).*)",
  ],
};
