import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/portal/auth";
import { verifyStravaActivity, isMapMyActivityUrl } from "@/lib/portal/strava";
import { insertWorkLog, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

type Payload = {
  workerName?: string;
  jobNumber?: string;
  workDate?: string;
  startedAt?: string;
  endedAt?: string;
  timeSpent?: string;
  stravaUrl?: string;
  mapmyUrl?: string;
  notes?: string;
};

export async function POST(req: Request) {
  if (!hasAccess("worker")) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  let b: Payload;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const workerName = (b.workerName || "").trim();
  const jobNumber = (b.jobNumber || "").trim();
  const startedAt = (b.startedAt || "").trim();
  const endedAt = (b.endedAt || "").trim();
  const stravaUrl = (b.stravaUrl || "").trim();
  const mapmyUrl = (b.mapmyUrl || "").trim();

  const missing: string[] = [];
  if (!workerName) missing.push("your name");
  if (!jobNumber) missing.push("job number");
  if (!startedAt) missing.push("start time");
  if (!endedAt) missing.push("finish time");
  if (!stravaUrl) missing.push("Strava link");
  if (missing.length) {
    return NextResponse.json({ ok: false, error: `Please fill in: ${missing.join(", ")}.` }, { status: 400 });
  }

  if (new Date(endedAt).getTime() <= new Date(startedAt).getTime()) {
    return NextResponse.json({ ok: false, error: "Finish time must be after the start time." }, { status: 400 });
  }

  if (mapmyUrl && !isMapMyActivityUrl(mapmyUrl)) {
    return NextResponse.json({ ok: false, error: "Map My Activity link doesn't look like a MapMyRun/Ride/Walk URL." }, { status: 400 });
  }

  // Strava is mandatory and must not be a dead link.
  const strava = await verifyStravaActivity(stravaUrl);
  if (!strava.ok) {
    return NextResponse.json({ ok: false, error: strava.message, strava }, { status: 400 });
  }

  let logId: number | null = null;
  let dbError: string | null = null;
  try {
    logId = await insertWorkLog({
      workerName,
      jobNumber,
      workDate: b.workDate || null,
      startedAt,
      endedAt,
      timeSpent: b.timeSpent || null,
      stravaUrl: strava.normalisedUrl || stravaUrl,
      stravaStatus: strava.status,
      stravaVerified: strava.verified,
      mapmyUrl: mapmyUrl || null,
      notes: (b.notes || "").trim() || null,
    });
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database write failed.";
  }

  return NextResponse.json({
    ok: true,
    logId,
    stored: logId !== null,
    dbConfigured: dbConfigured(),
    dbError,
    strava,
  });
}
