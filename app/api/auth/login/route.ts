import { NextResponse } from "next/server";
import { checkDemoLogin } from "@/lib/auth/demo-accounts";
import { ROLE_INFO, ROLES, SESSION_COOKIE, SESSION_MAX_AGE, encodeSession, type Role } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; role?: string } | null;
  const session = checkDemoLogin(String(body?.email ?? ""), String(body?.password ?? ""));
  if (!session) return NextResponse.json({ error: "bad" }, { status: 401 });

  const wanted = ROLES.includes(body?.role as Role) ? (body?.role as Role) : null;
  if (wanted && wanted !== session.role) {
    return NextResponse.json({ error: "role", role: session.role }, { status: 403 });
  }

  const res = NextResponse.json({ home: ROLE_INFO[session.role].home, role: session.role });
  res.cookies.set(SESSION_COOKIE, encodeSession(session), {
    path: "/",
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Readable by the page on purpose (demo): the header shows who is signed in without a round trip.
    httpOnly: false,
  });
  return res;
}
