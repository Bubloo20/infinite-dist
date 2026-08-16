import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { ensureSchema, dbConfigured } from "@/lib/portal/db";
import { sendMail, mailConfigured } from "@/lib/portal/mail";

export const dynamic = "force-dynamic";

/** Today in Melbourne, as YYYY-MM-DD — cron fires in UTC, the schedule is local. */
function melbourneToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Who is due to start work today. Runs on a Vercel cron each morning and emails
 * the office a rundown of every worker's start time, taken from the schedules
 * they committed to when they signed.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when that env var is set —
 * if it is, requests without it are turned away.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorised." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });
  }

  const today = melbourneToday();

  try {
    await ensureSchema();
    const rows = await sql<{
      full_name: string; schedule: string | null; job_id: number;
      title: string | null; job_number: string | null; area: string | null;
      area_note: string | null; leaflet_share: number | null; pay: string | null;
    }>`
      SELECT u.full_name, c.schedule, c.job_id,
             j.title, j.job_number, j.area,
             a.area_note, a.leaflet_share, a.pay
        FROM job_contracts c
        JOIN portal_users u ON u.id = c.user_id
        JOIN client_jobs j ON j.id = c.job_id
        LEFT JOIN job_assignments a ON a.job_id = c.job_id AND a.user_id = c.user_id
       WHERE c.schedule IS NOT NULL;`;

    // Only the people whose agreed schedule has them starting today.
    const due = rows.rows
      .map((r) => {
        let day: { start?: string; end?: string } | undefined;
        try {
          day = r.schedule ? (JSON.parse(r.schedule) as Record<string, { start?: string; end?: string }>)[today] : undefined;
        } catch {
          day = undefined;
        }
        return day?.start ? { ...r, start: day.start, end: day.end || "" } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.start.localeCompare(b!.start)) as Array<
        (typeof rows.rows)[number] & { start: string; end: string }
      >;

    if (!due.length) {
      return NextResponse.json({ ok: true, date: today, due: 0, emailed: false, note: "Nobody scheduled today." });
    }

    const pretty = new Date(`${today}T00:00:00`).toLocaleDateString("en-AU", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:640px">
        <h2 style="margin:0 0 4px">Starting work today</h2>
        <p style="margin:0 0 18px;color:#555">${esc(pretty)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="text-align:left;background:#f4f4f5">
              <th style="padding:8px;border:1px solid #e4e4e7">Worker</th>
              <th style="padding:8px;border:1px solid #e4e4e7">Start</th>
              <th style="padding:8px;border:1px solid #e4e4e7">End</th>
              <th style="padding:8px;border:1px solid #e4e4e7">Job</th>
              <th style="padding:8px;border:1px solid #e4e4e7">Area</th>
            </tr>
          </thead>
          <tbody>
            ${due
              .map(
                (r) => `<tr>
              <td style="padding:8px;border:1px solid #e4e4e7"><strong>${esc(r.full_name)}</strong></td>
              <td style="padding:8px;border:1px solid #e4e4e7">${esc(r.start)}</td>
              <td style="padding:8px;border:1px solid #e4e4e7">${esc(r.end || "—")}</td>
              <td style="padding:8px;border:1px solid #e4e4e7">${esc(r.title || `Job #${r.job_id}`)}${
                r.job_number ? ` <span style="color:#777">(${esc(r.job_number)})</span>` : ""
              }</td>
              <td style="padding:8px;border:1px solid #e4e4e7">${esc(r.area_note || r.area || "—")}</td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <p style="margin:18px 0 0;font-size:13px;color:#777">
          Times come from the schedule each contractor agreed to when they signed.
          Timesheets live in the admin dashboard.
        </p>
      </div>`;

    if (!mailConfigured()) {
      return NextResponse.json({
        ok: true, date: today, due: due.length, emailed: false,
        error: "Email is not configured. Set RESEND_API_KEY to enable it.",
        workers: due.map((r) => ({ name: r.full_name, start: r.start, end: r.end, jobId: r.job_id })),
      });
    }

    const sent = await sendMail({
      subject: `${due.length} starting today — ${pretty}`,
      html,
    });

    return NextResponse.json({
      ok: true, date: today, due: due.length,
      emailed: sent.ok, ...(sent.ok ? {} : { error: sent.error }),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
