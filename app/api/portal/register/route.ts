import { NextResponse } from "next/server";
import { hashPassword, createToken, sessionCookie, checkTeamPassword } from "@/lib/portal/auth";
import { createUser, findUserByName, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "Accounts are unavailable — the database isn't connected yet." }, { status: 503 });
  }

  let b: { fullName?: string; password?: string; teamPassword?: string; remember?: boolean };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const remember = Boolean(b.remember);
  const fullName = (b.fullName || "").trim();
  const password = b.password || "";

  if (!checkTeamPassword((b.teamPassword || "").trim())) {
    return NextResponse.json({ ok: false, error: "Team password is incorrect." }, { status: 401 });
  }
  if (fullName.length < 2) {
    return NextResponse.json({ ok: false, error: "Enter your full name." }, { status: 400 });
  }
  // Deliberately no complexity rules — any non-empty password is accepted.
  if (!password) {
    return NextResponse.json({ ok: false, error: "Choose a password." }, { status: 400 });
  }

  try {
    if (await findUserByName(fullName)) {
      return NextResponse.json({ ok: false, error: "An account already exists with that name. Sign in instead." }, { status: 409 });
    }
    const id = await createUser(fullName, hashPassword(password));
    const res = NextResponse.json({ ok: true, role: "worker", fullName, userId: id });
    // Creating an account honours "stay signed in" the same as signing in does.
    res.cookies.set(sessionCookie(createToken("worker", id, remember), remember));
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Could not create the account." }, { status: 500 });
  }
}
