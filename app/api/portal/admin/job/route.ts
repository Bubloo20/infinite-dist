import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/portal/auth";
import { setWorkLogAmount, setWorkLogPaid, setWorkLogVerified, deleteWorkLog } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Admin sets what a job pays, and marks it paid/unpaid. */
export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  let b: { id?: number; amount?: string | number | null; paidOn?: string | null; markPaid?: boolean; verified?: boolean };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  if (!b.id) return NextResponse.json({ ok: false, error: "Missing job." }, { status: 400 });

  try {
    if (b.amount !== undefined) {
      const raw = b.amount === null || b.amount === "" ? null : Number(b.amount);
      if (raw !== null && (!Number.isFinite(raw) || raw < 0)) {
        return NextResponse.json({ ok: false, error: "Amount must be a positive number." }, { status: 400 });
      }
      await setWorkLogAmount(b.id, raw);
    }
    if (b.verified !== undefined) {
      await setWorkLogVerified(b.id, Boolean(b.verified));
    }
    if (b.markPaid !== undefined) {
      await setWorkLogPaid(b.id, b.markPaid ? b.paidOn || new Date().toISOString().slice(0, 10) : null);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Update failed." }, { status: 500 });
  }
}

/** Throw a logged shift away. */
export async function DELETE(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "Missing shift." }, { status: 400 });
  try {
    await deleteWorkLog(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Couldn't delete it." },
      { status: 500 },
    );
  }
}
