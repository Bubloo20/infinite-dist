import { NextResponse } from "next/server";
import { currentSession } from "@/lib/portal/auth";
import {
  listOpenJobs, listJobsForWorkerAll, listInterest, addInterest, removeInterest,
  getContract, saveContract, findUserById, dbConfigured, listAssignmentsForUser, renameUserTo,
  upsertAssignment, listWorkLogsForUser, syncJobOutCount, acceptAssignment, listContractsForUser,
} from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Worker view: jobs open for interest, jobs assigned to me, my interest + contracts. */
export async function GET() {
  const s = currentSession();
  if (!s || !s.userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: true, open: [], mine: [], interest: [], contracts: [] });

  try {
    const [open, mine, allInterest, assignments, myLogs] = await Promise.all([
      listOpenJobs(), listJobsForWorkerAll(s.userId), listInterest(), listAssignmentsForUser(s.userId),
      listWorkLogsForUser(s.userId),
    ]);
    const interest = allInterest.filter((i) => i.user_id === s.userId).map((i) => i.job_id);
    const signed = await listContractsForUser(s.userId);
    // Only what the job card needs to show progress and payment state.
    const logs = myLogs.map((l) => ({
      id: l.id, jobId: l.client_job_id, jobNumber: l.job_number,
      startedAt: l.started_at, endedAt: l.ended_at, timeSpent: l.time_spent,
      assignmentId: l.assignment_id,
      leaflets: l.leaflet_count, amount: l.amount, paidOn: l.paid_on, paidAt: l.paid_at,
      verifiedAt: l.verified_at,
      areaWorked: l.area_worked, notes: l.notes,
      stravaUrls: l.strava_urls, mapmyUrls: l.mapmy_urls,
    }));
    return NextResponse.json({
      ok: true, open, mine, interest, assignments, logs,
      contracts: signed.map((c) => ({
        jobId: c.job_id, assignmentId: c.assignment_id, signedDate: c.signed_date,
        // What the pay was when they signed, so a change since is visible.
        agreedPay: c.agreed_pay,
      })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Query failed." }, { status: 500 });
  }
}

/** Register/withdraw interest, or sign the contract for an assigned job. */
export async function POST(req: Request) {
  const s = currentSession();
  if (!s || !s.userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  let b: Record<string, unknown> & { action?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const jobId = Number(b.jobId);
  if (!jobId) return NextResponse.json({ ok: false, error: "Missing job." }, { status: 400 });

  try {
    if (b.action === "interest") {
      await addInterest(jobId, s.userId, (b.note as string) || null);
      return NextResponse.json({ ok: true });
    }
    if (b.action === "withdraw") {
      await removeInterest(jobId, s.userId);
      return NextResponse.json({ ok: true });
    }
    if (b.action === "accept") {
      // Only someone actually on the job can accept it.
      const mine = await listJobsForWorkerAll(s.userId);
      const job = mine.find((j) => j.id === jobId);
      if (!job) return NextResponse.json({ ok: false, error: "That job isn't assigned to you." }, { status: 403 });
      // Each sub-contract is accepted on its own — two on the same job are two
      // separate pieces of work.
      const held = (await listAssignmentsForUser(s.userId)).filter((a) => a.job_id === jobId);
      const target = b.assignmentId ? held.find((a) => a.id === Number(b.assignmentId)) : held[0];
      if (target) {
        await acceptAssignment(target.id, s.userId);
      } else {
        await upsertAssignment({
          jobId, userId: s.userId, status: "accepted",
          pay: job.worker_pay != null ? Number(job.worker_pay) : null,
          minHours: job.min_hours ?? null,
          allocatedTime: job.allocated_time ?? null,
        });
      }
      await syncJobOutCount(jobId);
      return NextResponse.json({ ok: true });
    }

    if (b.action === "sign") {
      const signaturePng = String(b.signaturePng || "");
      const signedName = String(b.signedName || "").trim();
      const signedDate = String(b.signedDate || "").trim() || new Date().toISOString().slice(0, 10);
      if (!signedName) return NextResponse.json({ ok: false, error: "Type your full name." }, { status: 400 });
      if (!signaturePng.startsWith("data:image/")) {
        return NextResponse.json({ ok: false, error: "Please draw your signature." }, { status: 400 });
      }
      if (!b.agreed) return NextResponse.json({ ok: false, error: "You must tick the agreement box." }, { status: 400 });

      // Only a worker on the job may sign.
      const mine = await listJobsForWorkerAll(s.userId);
      if (!mine.some((j) => j.id === jobId)) {
        return NextResponse.json({ ok: false, error: "That job isn't assigned to you." }, { status: 403 });
      }
      const user = await findUserById(s.userId);
      // Signing is against one sub-contract, so each is agreed separately.
      const heldNow = (await listAssignmentsForUser(s.userId)).filter((a) => a.job_id === jobId);
      const signFor = b.assignmentId
        ? heldNow.find((a) => a.id === Number(b.assignmentId))
        : heldNow.length === 1 ? heldNow[0] : null;
      await saveContract({
        jobId, userId: s.userId, assignmentId: signFor?.id ?? null,
        signedName: signedName || user?.full_name || "",
        signaturePng, signedDate,
        // Left out when they're only agreeing to a new figure — the days they
        // already gave us are kept rather than wiped.
        schedule: (b.schedule as string) || null,
        agreedPay: signFor?.pay != null ? Number(signFor.pay) : null,
      });
      // However they wrote their name on the agreement is how they're known
      // from here on — the register was only ever the office's best guess.
      const renamed = signedName ? await renameUserTo(s.userId, signedName) : false;
      return NextResponse.json({ ok: true, renamedTo: renamed ? signedName.trim() : null });
    }
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Action failed." }, { status: 500 });
  }
}
