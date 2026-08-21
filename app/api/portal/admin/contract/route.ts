import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { isAdmin } from "@/lib/portal/auth";
import { getClientJob, findUserById, listContracts, ensureSchema } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** A signed agreement, for the printable admin copy. Without jobId, lists them all. */
export async function GET(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });

  const jobId = Number(new URL(req.url).searchParams.get("jobId"));
  try {
    await ensureSchema();
    if (!jobId) return NextResponse.json({ ok: true, contracts: await listContracts() });

    const rows = await sql<{
      signed_name: string; signature_png: string; signed_date: string; schedule: string | null;
      user_id: number; assignment_id: number | null; junk_mail_allowed: boolean | null;
      leaflet_share: number | null; area_note: string | null; pay: string | null;
      min_hours: string | null; allocated_time: string | null;
      start_date: string | null; due_date: string | null; title: string | null;
    }>`SELECT c.signed_name, c.signature_png, c.signed_date, c.schedule, c.user_id, c.assignment_id,
              a.junk_mail_allowed,
              -- The agreement is for this worker's slice, never the whole job.
              a.leaflet_share, a.area_note, a.pay, a.min_hours, a.allocated_time,
              a.start_date, a.due_date, a.title
       FROM job_contracts c
       LEFT JOIN job_assignments a ON a.id = c.assignment_id
      WHERE c.job_id = ${jobId} ORDER BY c.created_at DESC LIMIT 1;`;
    const contract = rows.rows[0];
    if (!contract) return NextResponse.json({ ok: false, error: "No signed contract for this job." }, { status: 404 });

    const [job, worker] = await Promise.all([getClientJob(jobId), findUserById(contract.user_id)]);
    return NextResponse.json({ ok: true, job, contract, worker: worker?.full_name ?? null });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Query failed." }, { status: 500 });
  }
}
