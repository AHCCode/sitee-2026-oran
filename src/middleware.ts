import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Edge middleware — first line of defence (the real session/role check is done
 * server-side against the DB in the admin layout and in every /api/admin handler):
 *  1. CSRF: reject cross-origin state-changing API requests.
 *  2. /admin/* pages: redirect to the login page when there is no session cookie.
 *  3. /api/admin/*: fast 401 when there is no session cookie.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const fr = !(req.cookies.get("afm_locale")?.value === "en");

  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      let sameOrigin = false;
      try {
        sameOrigin = new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: fr ? "Origine de la requête non autorisée." : "Cross-origin request rejected." } },
          { status: 403 },
        );
      }
    }
  }

  if (pathname.startsWith("/api/admin")) {
    if (!hasSession) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: fr ? "Authentification requise." : "Authentication required." } },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
