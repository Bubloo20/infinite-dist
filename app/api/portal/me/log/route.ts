import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { currentSession } from "@/lib/portal/auth";
import { verifyStravaActivity, isMapMyActivityUrl } from "@/lib/portal/strava";
import { packLinks, dbConfigured, syncJobOutCount } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/**
 * A worker editing one of their own shifts.
 * Locked once the office has marked it paid — the figures are settled by then.
 */
export async function POST(req: Request) {
  const s = currentSession();
  if (!s || !s.userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const id = Number(b.id);
  if (!id) return NextResponse.json({ ok: false, error: "Missing shift." }, { status: 400 });

  const existing = await sql<{ user_id: number; paid_on: string | null }>`
    SELECT user_id, paid_on FROM work_logs WHERE id=${id} LIMIT 1;`;
  const row = existing.rows[0];
  if (!row) return NextResponse.json({ ok: false, error: "Shift not found." }, { status: 404 });
  if (row.user_id !== s.userId) return NextResponse.json({ ok: false, error: "That isn't your shift." }, { status: 403 });
  if (row.paid_on) {
    return NextResponse.json({ ok: false, error: "This shift has been paid and can no longer be edited." }, { status: 409 });
  }

  const jobNumber = String(b.jobNumber || "").trim();
  const startedAt = String(b.startedAt || "").trim();
  const endedAt = String(b.endedAt || "").trim();
  const areaWorked = String(b.areaWorked || "").trim();
  const stravaUrls = (Array.isArray(b.stravaUrls) ? b.stravaUrls : []).map((u) => String(u || "").trim()).filter(Boolean);
  const mapmyUrls = (Array.isArray(b.mapmyUrls) ? b.mapmyUrls : []).map((u) => String(u || "").trim()).filter(Boolean);

  if (!jobNumber || !startedAt || !endedAt || !stravaUrls.length) {
    return NextResponse.json({ ok: false, error: "Job number, times and at least one Strava link are required." }, { status: 400 });
  }
  if (new Date(endedAt).getTime() <= new Date(startedAt).getTime()) {
    return NextResponse.json({ ok: false, error: "Finish time must be after the start time." }, { status: 400 });
  }
  const badMapmy = mapmyUrls.find((u) => !isMapMyActivityUrl(u));
  if (badMapmy) return NextResponse.json({ ok: false, error: `"${badMapmy}" doesn't look like a Map My URL.` }, { status: 400 });

  const checks = await Promise.all(stravaUrls.map((u) => verifyStravaActivity(u, { startedAt, endedAt })));
  const bad = checks.findIndex((c) => !c.ok);
  if (bad !== -1) {
    return NextResponse.json({ ok: false, error: `Strava link ${bad + 1}: ${checks[bad].message}` }, { status: 400 });
  }
  const normalised = checks.map((c, i) => c.normalisedUrl || stravaUrls[i]);

  let leafletCount: number | null = null;
  if (b.leafletCount !== undefined && String(b.leafletCount).trim() !== "") {
    const nCount = Number(b.leafletCount);
    if (!Number.isFinite(nCount) || nCount < 0) {
      return NextResponse.json({ ok: false, error: "Leaflet amount must be a number." }, { status: 400 });
    }
    leafletCount = Math.round(nCount);
  }

  await sql`
    UPDATE work_logs SET
      job_number=${jobNumber}, started_at=${startedAt}, ended_at=${endedAt},
      time_spent=${String(b.timeSpent || "") || null}, leaflet_count=${leafletCount},
      area_worked=${areaWorked || null}, strava_urls=${packLinks(normalised)},
      strava_url=${normalised[0] || null}, strava_status=${checks.every((c) => c.verified) ? "valid" : "unverified"},
      strava_verified=${checks.every((c) => c.verified)}, mapmy_urls=${packLinks(mapmyUrls)},
      notes=${String(b.notes || "").trim() || null}
    WHERE id=${id} AND user_id=${s.userId} AND paid_on IS NULL;`;

  return NextResponse.json({ ok: true });
}

/** Un-marking work as done — allowed until the office has paid for it. */
export async function DELETE(req: Request) {
  const s = currentSession();
  if (!s || !s.userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "Missing shift." }, { status: 400 });

  const existing = await sql<{ user_id: number; paid_on: string | null; client_job_id: number | null }>`
    SELECT user_id, paid_on, client_job_id FROM work_logs WHERE id=${id} LIMIT 1;`;
  const row = existing.rows[0];
  if (!row) return NextResponse.json({ ok: false, error: "Shift not found." }, { status: 404 });
  if (row.user_id !== s.userId) return NextResponse.json({ ok: false, error: "That isn't your shift." }, { status: 403 });
  if (row.paid_on) {
    return NextResponse.json({ ok: false, error: "This shift has been paid and can't be taken back." }, { status: 409 });
  }

  await sql`DELETE FROM work_logs WHERE id=${id};`;
  if (row.client_job_id) await syncJobOutCount(row.client_job_id);
  return NextResponse.json({ ok: true });
}
