import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/portal/auth";
import { updateUserPayDetails } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Admin saves a worker's bank / PayID details. */
export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  let b: { id?: number; bankName?: string; bankBsb?: string; bankAccount?: string; payid?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  if (!b.id) return NextResponse.json({ ok: false, error: "Missing user." }, { status: 400 });

  try {
    await updateUserPayDetails(b.id, {
      bankName: (b.bankName || "").trim() || null,
      bankBsb: (b.bankBsb || "").trim() || null,
      bankAccount: (b.bankAccount || "").trim() || null,
      payid: (b.payid || "").trim() || null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Save failed." }, { status: 500 });
  }
}
