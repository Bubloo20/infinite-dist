import { NextResponse } from "next/server";
import { isAdmin, hashPassword } from "@/lib/portal/auth";
import { updateUserPayDetails, updateUserNotes, createUser, findUserByName, deleteUser } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Create a worker, or update their pay details / notes / suburbs. */
export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  let b: {
    action?: string; id?: number; fullName?: string; password?: string;
    bankName?: string; bankBsb?: string; bankAccount?: string; payid?: string;
    notes?: string; area?: string;
  };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  try {
    if (b.action === "create") {
      const fullName = (b.fullName || "").trim();
      if (fullName.length < 2) return NextResponse.json({ ok: false, error: "Enter the worker's full name." }, { status: 400 });
      if (await findUserByName(fullName)) {
        return NextResponse.json({ ok: false, error: "A worker with that name already exists." }, { status: 409 });
      }
      // Defaults to the team password; the worker can be told to change it.
      const id = await createUser(fullName, hashPassword(b.password?.trim() || "infinite"));
      if (b.notes || b.area) await updateUserNotes(id, b.notes || null, b.area || null);
      return NextResponse.json({ ok: true, id });
    }

    if (!b.id) return NextResponse.json({ ok: false, error: "Missing worker." }, { status: 400 });

    if (b.action === "notes") {
      await updateUserNotes(b.id, (b.notes || "").trim() || null, (b.area || "").trim() || null);
      return NextResponse.json({ ok: true });
    }

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

export async function DELETE(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "Missing worker." }, { status: 400 });
  try {
    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Delete failed." }, { status: 500 });
  }
}
