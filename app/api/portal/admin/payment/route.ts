import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/portal/auth";
import { addPayment, deletePayment, setWorkLogPaid } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Record money actually sent to a worker. */
export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  let b: { userId?: number; amount?: string | number; paidOn?: string; method?: string; note?: string;
           workLogIds?: number[] };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const amount = Number(b.amount);
  if (!b.userId) return NextResponse.json({ ok: false, error: "Choose a worker." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "Enter a payment amount." }, { status: 400 });
  }
  try {
    const paidOn = b.paidOn || new Date().toISOString().slice(0, 10);
    const id = await addPayment({
      userId: b.userId, amount, paidOn,
      method: b.method || null, note: b.note || null,
    });
    // Settling specific shifts marks them paid so they leave the owed column.
    for (const logId of b.workLogIds || []) await setWorkLogPaid(logId, paidOn);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Save failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "Missing payment." }, { status: 400 });
  try {
    await deletePayment(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Delete failed." }, { status: 500 });
  }
}
