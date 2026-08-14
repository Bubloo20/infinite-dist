import { NextResponse } from "next/server";
import { COOKIE_NAME, currentSession } from "@/lib/portal/auth";
import { findUserById, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = currentSession();
  if (!s) return NextResponse.json({ role: null });

  let fullName: string | null = s.role === "admin" ? "Admin" : null;
  if (s.userId && dbConfigured()) {
    try {
      const u = await findUserById(s.userId);
      fullName = u?.full_name ?? null;
    } catch {
      /* fall through — session is still valid */
    }
  }
  return NextResponse.json({ role: s.role, userId: s.userId, fullName });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return res;
}
