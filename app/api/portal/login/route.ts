import { NextResponse } from "next/server";
import { checkAdminPassword, verifyPassword, isDefaultPassword, createToken, sessionCookie } from "@/lib/portal/auth";
import { findUserByName, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Small in-memory throttle to slow down password guessing. */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX_ATTEMPTS = 12;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW) {
    attempts.set(ip, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  let b: { fullName?: string; password?: string; role?: string; remember?: boolean };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const remember = Boolean(b.remember);
  const password = (b.password || "").trim();
  const fullName = (b.fullName || "").trim();

  // Admin sign-in: password only, no account needed.
  if (b.role === "admin" || !fullName) {
    if (checkAdminPassword(password)) {
      attempts.delete(ip);
      const res = NextResponse.json({ ok: true, role: "admin", fullName: "Admin" });
      res.cookies.set(sessionCookie(createToken("admin", null, remember), remember));
      return res;
    }
    if (b.role === "admin") {
      return NextResponse.json({ ok: false, error: "Incorrect admin password." }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Enter your full name." }, { status: 400 });
  }

  // Worker sign-in with their own account.
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "Accounts are unavailable — the database isn't connected yet." }, { status: 503 });
  }

  try {
    const user = await findUserByName(fullName);
    // Until someone picks their own password, the one they were given — their
    // first name — gets them in.
    const ok = user && (
      verifyPassword(password, user.password_hash) ||
      (!user.password_set && isDefaultPassword(user.full_name, password))
    );
    if (!user || !ok) {
      return NextResponse.json({ ok: false, error: "Name or password is incorrect." }, { status: 401 });
    }
    attempts.delete(ip);
    const res = NextResponse.json({
      ok: true, role: "worker", fullName: user.full_name, userId: user.id,
      // The dashboard nudges them to pick their own.
      usingDefaultPassword: !user.password_set,
    });
    res.cookies.set(sessionCookie(createToken("worker", user.id, remember), remember));
    return res;
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Sign-in failed." },
      { status: 500 },
    );
  }
}
