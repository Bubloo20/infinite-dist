import { NextResponse } from "next/server";
import { isAdmin, currentSession } from "@/lib/portal/auth";
import { getSetting, setSetting, REP_SIGNATURE, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** A signature image is small; anything larger than this isn't one. */
const MAX_CHARS = 400_000;

/**
 * The countersignature.
 *
 * Readable by anyone signed in, because a worker's own copy of the agreement
 * has to show it. Only the office can set it.
 */
export async function GET() {
  if (!currentSession()) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  if (!dbConfigured()) return NextResponse.json({ ok: true, signature: null });
  try {
    return NextResponse.json({ ok: true, signature: await getSetting(REP_SIGNATURE) });
  } catch {
    return NextResponse.json({ ok: true, signature: null });
  }
}

export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });
  }

  let b: { signature?: string | null };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const value = (b.signature ?? "").trim();
  if (value && !/^data:image\/(png|jpeg|webp);base64,/.test(value)) {
    return NextResponse.json({ ok: false, error: "That doesn't look like an image." }, { status: 400 });
  }
  if (value.length > MAX_CHARS) {
    return NextResponse.json({ ok: false, error: "That image is too large — try a smaller one." }, { status: 413 });
  }

  try {
    await setSetting(REP_SIGNATURE, value || null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Couldn't save it." },
      { status: 500 },
    );
  }
}
