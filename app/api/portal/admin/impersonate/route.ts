import { NextResponse } from "next/server";
import { isAdmin, createToken, sessionCookie, COOKIE_NAME } from "@/lib/portal/auth";
import { findUserById } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/**
 * Admin opens a worker's portal to see exactly what they see (and fix things
 * for them). The session becomes that worker's, so "Return to admin" signs
 * back in with the admin password.
 */
export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  let b: { userId?: number };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  if (!b.userId) return NextResponse.json({ ok: false, error: "Choose a worker." }, { status: 400 });

  const user = await findUserById(b.userId);
  if (!user) return NextResponse.json({ ok: false, error: "Worker not found." }, { status: 404 });

  const res = NextResponse.json({ ok: true, fullName: user.full_name });
  res.cookies.set(sessionCookie(createToken("worker", user.id)));
  // Flag so the portal can show a "viewing as" banner.
  res.cookies.set({ name: "idp_impersonating", value: "1", path: "/", maxAge: 60 * 60 * 12, sameSite: "lax" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  res.cookies.set({ name: "idp_impersonating", value: "", path: "/", maxAge: 0 });
  return res;
}
