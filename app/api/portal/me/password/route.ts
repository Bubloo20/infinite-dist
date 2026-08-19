import { NextResponse } from "next/server";
import { currentSession, hashPassword, verifyPassword, isDefaultPassword } from "@/lib/portal/auth";
import { findUserById, setUserPassword, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Change your own password. The current one has to be right first. */
export async function POST(req: Request) {
  const session = currentSession();
  if (!session || session.role !== "worker" || !session.userId) {
    return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });
  }

  let b: { current?: string; next?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const current = (b.current || "").trim();
  const next = (b.next || "").trim();
  if (next.length < 4) {
    return NextResponse.json({ ok: false, error: "Use at least four characters." }, { status: 400 });
  }

  try {
    const user = await findUserById(session.userId);
    if (!user) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

    const stored = (user as typeof user & { password_hash: string }).password_hash;
    const ok = verifyPassword(current, stored) ||
      (!user.password_set && isDefaultPassword(user.full_name, current));
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Your current password isn't right." }, { status: 401 });
    }

    await setUserPassword(user.id, hashPassword(next));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Couldn't change the password." },
      { status: 500 },
    );
  }
}
