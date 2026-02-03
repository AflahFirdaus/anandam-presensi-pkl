import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];
const ADMIN_PREFIX = "/admin";
const PKL_PRESENSI = "/presensi";

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isApi(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

// Proxy tidak bisa async DB; kita hanya cek ada/tidak cookie dan redirect.
// Auth sesungguhnya di API/Server Components via getSessionFromRequest().
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(process.env.SESSION_COOKIE_NAME ?? "presensi_session")?.value;

  if (isPublic(pathname)) {
    if (token && (pathname === "/login" || pathname.startsWith("/login"))) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    if (isApi(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
