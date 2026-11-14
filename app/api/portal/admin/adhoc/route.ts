import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/portal/auth";
import { createAdhocContract, listAdhocContracts, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Every one-off agreement, newest first, with the link that opens each. */
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });
  try {
    const rows = await listAdhocContracts();
    return NextResponse.json({
      ok: true,
      contracts: rows.map((c) => ({ ...c, token: `${c.id}-${c.share_key}`, share_key: undefined })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Query failed." }, { status: 500 });
  }
}

/** Write one out and hand back its link. */
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 }); }

  const num = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  if (!str(b.title) && !str(b.area)) {
    return NextResponse.json({ ok: false, error: "Give the work a name or an area." }, { status: 400 });
  }

  try {
    const made = await createAdhocContract({
      workerName: str(b.workerName), title: str(b.title), area: str(b.area),
      leaflets: num(b.leaflets), pay: num(b.pay), minHours: str(b.minHours),
      startDate: str(b.startDate), dueDate: str(b.dueDate),
      junkMailAllowed: Boolean(b.junkMailAllowed), scheduleOptional: Boolean(b.scheduleOptional),
    });
    return NextResponse.json({ ok: true, ...made });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Couldn't save that." }, { status: 500 });
  }
}
