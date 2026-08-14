import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/portal/auth";
import { listWorkLogs, listUsers, listPayments, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Admin only — everything the dashboard needs in one call. */
export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({
      ok: true,
      dbConfigured: false,
      logs: [],
      users: [],
      payments: [],
      diagnostic: {
        dbEnvVarsVisible: Object.keys(process.env)
          .filter((k) => /POSTGRES|DATABASE|NEON|PG/i.test(k))
          .sort(),
        portalSecretSet: Boolean(process.env.PORTAL_SECRET),
        vercelEnv: process.env.VERCEL_ENV || null,
      },
    });
  }
  try {
    const [logs, users, payments] = await Promise.all([listWorkLogs(), listUsers(), listPayments()]);
    return NextResponse.json({ ok: true, dbConfigured: true, logs, users, payments });
  } catch (e) {
    return NextResponse.json(
      { ok: false, dbConfigured: true, logs: [], users: [], payments: [], error: e instanceof Error ? e.message : "Query failed." },
      { status: 500 },
    );
  }
}
