import { NextResponse } from "next/server";
import { checkPassword, createToken, sessionCookie, type Role } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

/** Small in-memory throttle to slow down password guessing. */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

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

  let body: { password?: string; role?: Role };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const role: Role = body.role === "admin" ? "admin" : "worker";
  const password = (body.password || "").trim();

  if (!checkPassword(role, password)) {
    // An admin password typed into the worker box should still let them in.
    if (role === "worker" && checkPassword("admin", password)) {
      const res = NextResponse.json({ ok: true, role: "admin" });
      res.cookies.set(sessionCookie(createToken("admin")));
      return res;
    }
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(sessionCookie(createToken(role)));
  return res;
}
