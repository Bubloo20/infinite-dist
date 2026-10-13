import { sendMail, mailConfigured } from "@/lib/portal/mail";
import { contractEmailHtml } from "@/lib/portal/contractEmail";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";

/** What the office calls this piece of work. */
export function noticeTitle(a: JobAssignment | null, job: ClientJob | null): string {
  return (
    a?.title?.trim() || a?.area_note?.trim() ||
    job?.title?.trim() || job?.area?.trim() || "Leaflet distribution"
  );
}

export type SignedNotice = {
  job: ClientJob | null;
  assignment: JobAssignment | null;
  signedName: string;
  signedDate: string;
  signaturePng: string;
  /** The days they put down, as stored on the contract. */
  schedule: string | null;
  /** Their own copy — only when they gave us an address. */
  workerEmail?: string | null;
};

/**
 * Post the signed agreement out.
 *
 * Every signature reaches the office the same way, whether it was signed on a
 * link or inside the portal — the office hearing about one and not the other
 * was how a signed job could sit there unnoticed. The worker gets the same
 * document when they've given an address, so neither side can later be said to
 * have agreed to something the other didn't see.
 *
 * Best effort by design: the agreement is already saved by the time this runs,
 * so a refused send is reported back, never raised. Nothing is sent at all
 * until RESEND_API_KEY is set, and `configured: false` says so plainly rather
 * than looking like success.
 */
export async function sendSignedAgreement(n: SignedNotice): Promise<{
  configured: boolean; office: boolean; worker: boolean; error?: string;
}> {
  if (!mailConfigured()) return { configured: false, office: false, worker: false };

  const { job, assignment: a } = n;
  const title = noticeTitle(a, job);
  const html = contractEmailHtml({
    workerName: n.signedName,
    title,
    area: a?.area_note || job?.area || null,
    leaflets: a?.leaflet_share ?? job?.quantity ?? null,
    pay: a?.pay ?? job?.worker_pay ?? null,
    minHours: a?.min_hours || job?.min_hours || null,
    startDate: a?.start_date ?? null,
    dueDate: a?.due_date ?? null,
    junkMailAllowed: Boolean(a?.junk_mail_allowed),
    scheduleOptional: Boolean(a?.schedule_optional),
    signedName: n.signedName,
    signedDate: n.signedDate,
    signaturePng: n.signaturePng,
    schedule: n.schedule,
  });

  const office = await sendMail({ subject: `Signed — ${n.signedName} — ${title}`, html });
  if (!office.ok) {
    // Vercel's logs are the only place a failed send can still be seen.
    console.error(`[contract] office copy for ${n.signedName} failed: ${office.error}`);
  }

  let worker = false;
  if (n.workerEmail) {
    const theirs = await sendMail({
      subject: "Your signed agreement — Infinite Distribution",
      html,
      to: n.workerEmail,
    });
    worker = theirs.ok;
    if (!theirs.ok) console.error(`[contract] worker copy to ${n.workerEmail} failed: ${theirs.error}`);
  }

  return { configured: true, office: office.ok, worker, error: office.ok ? undefined : office.error };
}
