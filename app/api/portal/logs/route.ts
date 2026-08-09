import { NextResponse } from "next/server";
import { currentRole } from "@/lib/portal/auth";
import { listWorkLogs, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Admin only — the dashboard's data source. */
export async function GET() {
  if (currentRole() !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: true, dbConfigured: false, logs: [] });
  }
  try {
    const logs = await listWorkLogs();
    return NextResponse.json({ ok: true, dbConfigured: true, logs });
  } catch (e) {
    return NextResponse.json(
      { ok: false, dbConfigured: true, logs: [], error: e instanceof Error ? e.message : "Query failed." },
      { status: 500 },
    );
  }
}
