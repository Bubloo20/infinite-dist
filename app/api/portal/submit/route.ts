import { NextResponse } from "next/server";
import { currentSession } from "@/lib/portal/auth";
import { verifyStravaActivity, isMapMyActivityUrl } from "@/lib/portal/strava";
import { insertWorkLog, dbConfigured, findUserById } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

type Payload = {
  jobNumber?: string;
  startedAt?: string;
  endedAt?: string;
  timeSpent?: string;
  leafletCount?: string | number;
  areaWorked?: string;
  clientJobId?: number | string | null;
  stravaUrls?: string[];
  mapmyUrls?: string[];
  notes?: string;
};

export async function POST(req: Request) {
  const session = currentSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  let b: Payload;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // The name comes from the signed-in account, not the form.
  let workerName = "Admin";
  if (session.userId && dbConfigured()) {
    const u = await findUserById(session.userId);
    if (!u) return NextResponse.json({ ok: false, error: "Account not found. Sign in again." }, { status: 401 });
    workerName = u.full_name;
  }

  const jobNumber = (b.jobNumber || "").trim();
  const startedAt = (b.startedAt || "").trim();
  const endedAt = (b.endedAt || "").trim();
  const areaWorked = (b.areaWorked || "").trim();
  const stravaUrls = (b.stravaUrls || []).map((u) => (u || "").trim()).filter(Boolean);
  const mapmyUrls = (b.mapmyUrls || []).map((u) => (u || "").trim()).filter(Boolean);

  const missing: string[] = [];
  if (!startedAt) missing.push("start time");
  if (!endedAt) missing.push("finish time");
  if (!stravaUrls.length) missing.push("at least one Strava link");
  if (missing.length) {
    return NextResponse.json({ ok: false, error: `Please fill in: ${missing.join(", ")}.` }, { status: 400 });
  }

  if (new Date(endedAt).getTime() <= new Date(startedAt).getTime()) {
    return NextResponse.json({ ok: false, error: "Finish time must be after the start time." }, { status: 400 });
  }

  let leafletCount: number | null = null;
  if (b.leafletCount !== undefined && String(b.leafletCount).trim() !== "") {
    const n = Number(b.leafletCount);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ ok: false, error: "Leaflet amount must be a number." }, { status: 400 });
    }
    leafletCount = Math.round(n);
  }

  const badMapmy = mapmyUrls.find((u) => !isMapMyActivityUrl(u));
  if (badMapmy) {
    return NextResponse.json({ ok: false, error: `"${badMapmy}" doesn't look like a MapMyRun/Ride/Walk URL.` }, { status: 400 });
  }

  // Every Strava link must check out — exists, real athlete name, dated inside the shift.
  const checks = await Promise.all(stravaUrls.map((u) => verifyStravaActivity(u, { startedAt, endedAt })));
  const bad = checks.findIndex((c) => !c.ok);
  if (bad !== -1) {
    return NextResponse.json(
      { ok: false, error: `Strava link ${bad + 1}: ${checks[bad].message}`, strava: checks[bad] },
      { status: 400 },
    );
  }
  const normalised = checks.map((c, i) => c.normalisedUrl || stravaUrls[i]);
  const allVerified = checks.every((c) => c.verified);
  const strava = {
    count: checks.length,
    status: allVerified ? "valid" : checks.some((c) => c.status === "unverified") ? "unverified" : "valid",
    verified: allVerified,
    urls: normalised,
  };

  let logId: number | null = null;
  let dbError: string | null = null;
  try {
    logId = await insertWorkLog({
      userId: session.userId,
      workerName,
      jobNumber: jobNumber || `JOB-${b.clientJobId ?? ""}`.replace(/-$/, "") || "—",
      startedAt,
      endedAt,
      timeSpent: b.timeSpent || null,
      leafletCount,
      areaWorked: areaWorked || null,
      clientJobId: Number(b.clientJobId) || null,
      stravaUrls: normalised,
      stravaStatus: strava.status,
      stravaVerified: strava.verified,
      mapmyUrls,
      notes: (b.notes || "").trim() || null,
    });
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Database write failed.";
  }

  return NextResponse.json({
    ok: true,
    logId,
    stored: logId !== null,
    workerName,
    dbConfigured: dbConfigured(),
    dbError,
    strava,
  });
}
