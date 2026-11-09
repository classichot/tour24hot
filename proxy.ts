import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession, roleForPath, rolesFor } from "@/lib/auth/session";

/** Member spaces: send visitors without the right role to the sign-in page, then back. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const allowed = rolesFor(pathname);
  if (!allowed) return NextResponse.next();

  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session && allowed.includes(session.role)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("role", roleForPath(pathname, search));
  url.searchParams.set("next", pathname + search);
  if (session) url.searchParams.set("wrong", session.role);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/trips/:path*", "/agency/:path*", "/inbound/agency/:path*", "/os/:path*"],
};
