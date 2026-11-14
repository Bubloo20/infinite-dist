import { NextResponse } from "next/server";
import { sendMail, mailConfigured } from "@/lib/portal/mail";
import { contractEmailHtml } from "@/lib/portal/contractEmail";
import { readAdhocToken, getAdhocContract, signAdhocContract, dbConfigured } from "@/lib/portal/db";
import { todayAu } from "@/lib/portal/text";

export const dynamic = "force-dynamic";

/**
 * A one-off agreement behind its own link.
 *
 * Open on purpose, like the job links: the link is the credential, so somebody
 * with no account can read what they are agreeing to and sign it on a phone.
 * It carries this agreement and nothing else — no job, no other worker, no
 * map.
 */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const id = await readAdhocToken(params.token);
  if (!id) return NextResponse.json({ ok: false, error: "That link isn't valid." }, { status: 404 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });

  try {
    const c = await getAdhocContract(id);
    if (!c) return NextResponse.json({ ok: false, error: "That agreement is no longer there." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      workerName: c.worker_name ?? "",
      title: c.title?.trim() || c.area?.trim() || "Leaflet distribution",
      area: c.area, leaflets: c.leaflets, pay: c.pay, minHours: c.min_hours,
      startDate: c.start_date, dueDate: c.due_date,
      junkMailAllowed: c.junk_mail_allowed, scheduleOptional: c.schedule_optional,
      signed: c.signed_name
        ? { name: c.signed_name, date: c.signed_date, schedule: c.schedule }
        : null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Couldn't load that." }, { status: 500 });
  }
}

/** Sign it, and post both copies out. */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const id = await readAdhocToken(params.token);
  if (!id) return NextResponse.json({ ok: false, error: "That link isn't valid." }, { status: 404 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });

  let b: { signedName?: string; signaturePng?: string; schedule?: string; agreed?: boolean; email?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 }); }

  const signedName = String(b.signedName || "").trim();
  const signaturePng = String(b.signaturePng || "");
  if (!signedName) return NextResponse.json({ ok: false, error: "Type your full name." }, { status: 400 });
  if (!signaturePng.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "Please draw your signature." }, { status: 400 });
  }
  if (!b.agreed) return NextResponse.json({ ok: false, error: "You must tick the agreement box." }, { status: 400 });

  try {
    const c = await getAdhocContract(id);
    if (!c) return NextResponse.json({ ok: false, error: "That agreement is no longer there." }, { status: 404 });
    if (c.signed_name) return NextResponse.json({ ok: false, error: "This has already been signed." }, { status: 409 });

    const signedDate = todayAu();
    const email = String(b.email || "").trim();
    const stored = await signAdhocContract(id, {
      signedName, signaturePng, signedDate, schedule: b.schedule || null, email: email || null,
    });
    if (!stored) return NextResponse.json({ ok: false, error: "This has already been signed." }, { status: 409 });

    const title = c.title?.trim() || c.area?.trim() || "Leaflet distribution";
    const html = contractEmailHtml({
      workerName: signedName, title, area: c.area,
      leaflets: c.leaflets, pay: c.pay, minHours: c.min_hours,
      startDate: c.start_date, dueDate: c.due_date,
      junkMailAllowed: c.junk_mail_allowed, scheduleOptional: c.schedule_optional,
      signedName, signedDate, signaturePng, schedule: b.schedule || null,
    });

    // The agreement is saved either way; posting it out is best effort.
    let emailedWorker = false;
    let emailedOffice = false;
    if (mailConfigured()) {
      const office = await sendMail({ subject: `Signed - ${signedName} - ${title}`, html });
      emailedOffice = office.ok;
      if (!office.ok) console.error(`[adhoc] office copy failed: ${office.error}`);
      if (email) {
        const theirs = await sendMail({ subject: "Your signed agreement - Infinite Distribution", html, to: email });
        emailedWorker = theirs.ok;
        if (!theirs.ok) console.error(`[adhoc] worker copy failed: ${theirs.error}`);
      }
    }
    return NextResponse.json({ ok: true, signedDate, emailedWorker, emailedOffice, mailConfigured: mailConfigured() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Couldn't record that." }, { status: 500 });
  }
}
