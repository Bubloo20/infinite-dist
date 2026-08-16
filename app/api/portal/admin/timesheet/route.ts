import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { isAdmin } from "@/lib/portal/auth";
import { getClientJob, ensureSchema, type WorkLog } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Everyone on a job: the hours they agreed to, and the shifts they actually logged. */
export async function GET(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });

  const jobId = Number(new URL(req.url).searchParams.get("jobId"));
  if (!jobId) return NextResponse.json({ ok: false, error: "Missing job." }, { status: 400 });

  try {
    await ensureSchema();
    const [job, people, logs] = await Promise.all([
      getClientJob(jobId),
      sql<{
        user_id: number; full_name: string; min_hours: string | null; pay: string | null;
        leaflet_share: number | null; area_note: string | null;
        start_date: string | null; due_date: string | null;
        schedule: string | null; signed_date: string | null;
      }>`
        SELECT a.user_id, u.full_name, a.min_hours, a.pay, a.leaflet_share, a.area_note,
               a.start_date, a.due_date, c.schedule, c.signed_date
          FROM job_assignments a
          JOIN portal_users u ON u.id = a.user_id
          LEFT JOIN job_contracts c ON c.job_id = a.job_id AND c.user_id = a.user_id
         WHERE a.job_id = ${jobId}
         ORDER BY u.full_name;`,
      sql<WorkLog>`
        SELECT * FROM work_logs WHERE client_job_id = ${jobId} ORDER BY started_at;`,
    ]);

    if (!job) return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });

    const workers = people.rows.map((p) => ({
      ...p,
      logs: logs.rows.filter((l) => l.user_id === p.user_id),
    }));
    // Shifts logged by someone who isn't on the assignment list any more.
    const orphans = logs.rows.filter((l) => !people.rows.some((p) => p.user_id === l.user_id));

    return NextResponse.json({ ok: true, job, workers, orphans });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Query failed." }, { status: 500 });
  }
}
