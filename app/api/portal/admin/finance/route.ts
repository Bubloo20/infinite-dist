import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/portal/auth";
import { addFinanceEntry, deleteFinanceEntry, listFinanceEntries } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, entries: await listFinanceEntries() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Query failed." }, { status: 500 });
  }
}

/** Record revenue taken or a business expense. */
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  let b: { kind?: string; amount?: string | number; category?: string; description?: string; entryDate?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const kind = b.kind === "expense" ? "expense" : "revenue";
  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "Enter an amount." }, { status: 400 });
  }
  try {
    const id = await addFinanceEntry({
      kind,
      amount,
      category: b.category || null,
      description: b.description || null,
      entryDate: b.entryDate || null,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Save failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "Missing entry." }, { status: 400 });
  try {
    await deleteFinanceEntry(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Delete failed." }, { status: 500 });
  }
}
