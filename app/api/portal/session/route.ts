import { NextResponse } from "next/server";
import { COOKIE_NAME, currentRole } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ role: currentRole() });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return res;
}
