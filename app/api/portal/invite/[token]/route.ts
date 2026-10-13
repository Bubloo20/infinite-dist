import { NextResponse } from "next/server";
import { readInviteToken } from "@/lib/portal/auth";
import { sendMail, mailConfigured } from "@/lib/portal/mail";
import { contractEmailHtml } from "@/lib/portal/contractEmail";
import {
  listAssignments, getClientJob, getContractForAssignment, saveContract,
  acceptAssignment, findUserById, dbConfigured,
} from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Everything the link needs to show, and nothing it doesn't. */
async function load(id: number) {
  const assignment = (await listAssignments()).find((a) => a.id === id);
  if (!assignment) return null;
  const [job, contract, worker] = await Promise.all([
    getClientJob(assignment.job_id),
    getContractForAssignment(assignment.id),
    findUserById(assignment.user_id),
  ]);
  return { assignment, job, contract, worker };
}

/**
 * The terms behind an invite link.
 *
 * Open on purpose — the signed link is the credential, so somebody with no
 * account can read what they're agreeing to on their phone. It carries this
 * sub-contract only: its pay, dates and area, never the job's totals or
 * anything about the other workers on it.
 */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const id = readInviteToken(params.token);
  if (!id) return NextResponse.json({ ok: false, error: "That link isn't valid." }, { status: 404 });
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });
  }

  try {
    const found = await load(id);
    if (!found) return NextResponse.json({ ok: false, error: "That work is no longer there." }, { status: 404 });
    const { assignment: a, job, contract, worker } = found;

    return NextResponse.json({
      ok: true,
      workerName: worker?.full_name ?? "",
      title: a.title?.trim() || a.area_note?.trim() || job?.area?.trim() || "Leaflet distribution",
      area: a.area_note || job?.area || null,
      leaflets: a.leaflet_share,
      pay: a.pay,
      minHours: a.min_hours || job?.min_hours || null,
      startDate: a.start_date,
      dueDate: a.due_date,
      allocatedTime: a.allocated_time,
      junkMailAllowed: a.junk_mail_allowed,
      scheduleOptional: a.schedule_optional,
      boundary: a.boundary || job?.boundary || null,
      mapCenter: a.map_center || job?.map_center || null,
      signed: contract
        ? { name: contract.signed_name, date: contract.signed_date, schedule: contract.schedule }
        : null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Couldn't load that." },
      { status: 500 },
    );
  }
}

/**
 * Sign it.
 *
 * Signing is the acceptance, same as in the portal: the sub-contract is taken
 * and the agreement recorded together, against the worker the office already
 * put on it — the link decides who that is, never the request body.
 */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const id = readInviteToken(params.token);
  if (!id) return NextResponse.json({ ok: false, error: "That link isn't valid." }, { status: 404 });
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });
  }

  let b: {
    signedName?: string; signaturePng?: string; signedDate?: string;
    schedule?: string; agreed?: boolean; email?: string;
  };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const signedName = String(b.signedName || "").trim();
  const signaturePng = String(b.signaturePng || "");
  const signedDate = String(b.signedDate || "").trim() || new Date().toISOString().slice(0, 10);
  if (!signedName) return NextResponse.json({ ok: false, error: "Type your full name." }, { status: 400 });
  if (!signaturePng.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "Please draw your signature." }, { status: 400 });
  }
  if (!b.agreed) return NextResponse.json({ ok: false, error: "You must tick the agreement box." }, { status: 400 });

  try {
    const found = await load(id);
    if (!found) return NextResponse.json({ ok: false, error: "That work is no longer there." }, { status: 404 });
    const { assignment: a } = found;

    const email = String(b.email || "").trim();
    await acceptAssignment(a.id, a.user_id);
    await saveContract({
      jobId: a.job_id,
      userId: a.user_id,
      assignmentId: a.id,
      signedName,
      signaturePng,
      signedDate,
      schedule: b.schedule || null,
      agreedPay: a.pay != null ? Number(a.pay) : null,
      signedEmail: email || null,
    });

    // The agreement is saved either way; posting it out is best effort, and
    // the page tells them to keep their own copy when it doesn't go.
    const job = found.job;
    const html = contractEmailHtml({
      workerName: found.worker?.full_name ?? signedName,
      title: a.title?.trim() || a.area_note?.trim() || job?.area?.trim() || "Leaflet distribution",
      area: a.area_note || job?.area || null,
      leaflets: a.leaflet_share,
      pay: a.pay,
      minHours: a.min_hours || job?.min_hours || null,
      startDate: a.start_date,
      dueDate: a.due_date,
      junkMailAllowed: a.junk_mail_allowed,
      scheduleOptional: a.schedule_optional,
      signedName,
      signedDate,
      signaturePng,
      schedule: b.schedule || null,
    });
    const subject = `Signed agreement — ${signedName} — ${a.title?.trim() || a.area_note?.trim() || `job #${a.job_id}`}`;

    let emailedWorker = false;
    let emailedOffice = false;
    if (mailConfigured()) {
      // The office always gets one; the worker only if they gave an address.
      const office = await sendMail({ subject, html });
      emailedOffice = office.ok;
      if (email) {
        const theirs = await sendMail({ subject: "Your signed agreement — Infinite Distribution", html, to: email });
        emailedWorker = theirs.ok;
      }
    }

    return NextResponse.json({ ok: true, emailedWorker, emailedOffice, mailConfigured: mailConfigured() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Couldn't record that." },
      { status: 500 },
    );
  }
}
