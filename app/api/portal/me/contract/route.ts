import { NextResponse } from "next/server";
import { currentSession } from "@/lib/portal/auth";
import { listJobsForWorkerAll, listAssignmentsForUser, findUserById, getContract, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** The worker's own copy of an agreement, for the printable view. */
export async function GET(req: Request) {
  const s = currentSession();
  if (!s || !s.userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });

  const jobId = Number(new URL(req.url).searchParams.get("jobId"));
  if (!jobId) return NextResponse.json({ ok: false, error: "Missing job." }, { status: 400 });

  try {
    const [jobs, assignments, user] = await Promise.all([
      listJobsForWorkerAll(s.userId), listAssignmentsForUser(s.userId), findUserById(s.userId),
    ]);
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return NextResponse.json({ ok: false, error: "That job isn't assigned to you." }, { status: 403 });
    // Once signed, the worker's own copy shows their signature back to them.
    const contract = await getContract(jobId, s.userId);
    return NextResponse.json({
      ok: true, job,
      assignment: assignments.find((a) => a.job_id === jobId) ?? null,
      workerName: user?.full_name ?? null,
      contract: contract
        ? { signedName: contract.signed_name, signaturePng: contract.signature_png,
            signedDate: contract.signed_date, schedule: contract.schedule }
        : null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Query failed." }, { status: 500 });
  }
}
