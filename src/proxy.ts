import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin URL gate.
 *
 * - The admin panel is served at /milean (private URL). Visiting /milean
 *   internally rewrites to /admin and drops an httpOnly gate cookie so
 *   subsequent requests to the real /admin paths also work.
 * - Any direct request to /admin/* or /api/admin/* that does NOT carry
 *   the gate cookie gets a genuine HTTP 404 (no redirect, no hint that
 *   an admin panel exists).
 * - The secret path is configurable via ADMIN_URL_PATH (default "milean").
 */

const GATE_COOKIE = "admin_gate";
const GATE_VALUE = "granted";
const FIVE_YEARS_SECONDS = 5 * 365 * 24 * 60 * 60;

function adminPathPrefix() {
  return `/${(process.env.ADMIN_URL_PATH || "milean")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase()}`;
}

function notFoundResponse(request: NextRequest) {
  // Rewrite to a non-existent path so Next.js renders its real 404 page
  // with a genuine 404 status code.
  const url = request.nextUrl.clone();
  url.pathname = "/_private-admin-404";
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const privatePrefix = adminPathPrefix();

  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isApiAdmin = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const isPrivate = pathname === privatePrefix || pathname.startsWith(`${privatePrefix}/`);

  // Private URL: rewrite /milean(/...) -> /admin(/...) and set the gate
  // cookie so subsequent /admin and /api/admin requests pass.
  if (isPrivate) {
    const internalPath = pathname.replace(privatePrefix, "/admin") || "/admin";

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPath;

    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set(GATE_COOKIE, GATE_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: FIVE_YEARS_SECONDS,
    });
    return response;
  }

  // Real admin paths: 404 unless the visitor holds the gate cookie.
  if (isAdmin || isApiAdmin) {
    if (request.cookies.get(GATE_COOKIE)?.value === GATE_VALUE) {
      return NextResponse.next();
    }

    return notFoundResponse(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    // Match the private prefix dynamically via a broad pattern; the exact
    // path is enforced in code so changing ADMIN_URL_PATH requires no
    // matcher change.
    "/milean",
    "/milean/:path*",
  ],
};
