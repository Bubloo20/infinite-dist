import { NextResponse } from "next/server";
import { currentSession } from "@/lib/portal/auth";
import { listJobsForWorkerAll, listAssignmentsForUser, findUserById, getContract, getContractForAssignment, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** The worker's own copy of an agreement, for the printable view. */
export async function GET(req: Request) {
  const s = currentSession();
  if (!s || !s.userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });

  const params = new URL(req.url).searchParams;
  const jobId = Number(params.get("jobId"));
  // Which piece of work — a worker can hold several on one job.
  const assignmentId = Number(params.get("assignmentId")) || null;
  if (!jobId) return NextResponse.json({ ok: false, error: "Missing job." }, { status: 400 });

  try {
    const [jobs, assignments, user] = await Promise.all([
      listJobsForWorkerAll(s.userId), listAssignmentsForUser(s.userId), findUserById(s.userId),
    ]);
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return NextResponse.json({ ok: false, error: "That job isn't assigned to you." }, { status: 403 });
    const held = assignments.filter((a) => a.job_id === jobId);
    const mine = assignmentId
      ? held.find((a) => a.id === assignmentId) ?? null
      : held.length === 1 ? held[0] : null;
    if (assignmentId && !mine) {
      return NextResponse.json({ ok: false, error: "That work isn't yours." }, { status: 403 });
    }

    // Signed for this sub-contract, never borrowed from another on the same job.
    const contract = mine
      ? await getContractForAssignment(mine.id)
      : await getContract(jobId, s.userId);

    return NextResponse.json({
      ok: true, job,
      assignment: mine ?? held[0] ?? null,
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
