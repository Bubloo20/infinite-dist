import { NextResponse } from "next/server";
import { currentSession } from "@/lib/portal/auth";
import {
  startSession, setSessionStatus, addSessionPoints,
  getSessionForAssignment, listSessionPoints, listAssignmentsForUser, dbConfigured,
  type SessionPoint,
} from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/** Where a tracked walk stands, so the page can pick up where it left off. */
export async function GET(req: Request) {
  const s = currentSession();
  if (!s?.userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });

  const assignmentId = Number(new URL(req.url).searchParams.get("assignmentId"));
  if (!assignmentId) return NextResponse.json({ ok: false, error: "Missing job." }, { status: 400 });

  const session = await getSessionForAssignment(s.userId, assignmentId);
  if (!session) return NextResponse.json({ ok: true, session: null, points: [] });
  return NextResponse.json({ ok: true, session, points: await listSessionPoints(session.id) });
}

/**
 * Start, pause, resume or finish a walk, and take batches of positions along
 * the way. Points arrive in batches so a dropped connection or a phone going
 * to sleep costs at most the last few seconds.
 */
export async function POST(req: Request) {
  const s = currentSession();
  if (!s?.userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const action = String(b.action || "");

  try {
    if (action === "start") {
      const assignmentId = Number(b.assignmentId) || null;
      if (!assignmentId) return NextResponse.json({ ok: false, error: "Missing job." }, { status: 400 });
      // Only work that's actually theirs can be tracked.
      const mine = (await listAssignmentsForUser(s.userId)).find((a) => a.id === assignmentId);
      if (!mine) return NextResponse.json({ ok: false, error: "That work isn't yours." }, { status: 403 });
      const id = await startSession({ userId: s.userId, jobId: mine.job_id, assignmentId });
      return NextResponse.json({ ok: true, sessionId: id });
    }

    const sessionId = Number(b.sessionId);
    if (!sessionId) return NextResponse.json({ ok: false, error: "Missing session." }, { status: 400 });

    if (action === "points") {
      const raw = Array.isArray(b.points) ? (b.points as unknown[]) : [];
      const points: SessionPoint[] = raw
        .map((p) => p as Record<string, unknown>)
        .filter((p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
        .slice(0, 500)
        .map((p) => ({
          lat: Number(p.lat), lng: Number(p.lng),
          accuracy: Number.isFinite(Number(p.accuracy)) ? Number(p.accuracy) : null,
          speed: Number.isFinite(Number(p.speed)) ? Number(p.speed) : null,
          at: String(p.at || new Date().toISOString()),
          gap: Boolean(p.gap),
        }));
      const t = (b.totals || {}) as Record<string, unknown>;
      await addSessionPoints(sessionId, s.userId, points, {
        distanceM: Number(t.distanceM) || 0,
        movingMs: Number(t.movingMs) || 0,
        inside: Number(t.inside) || 0,
        outside: Number(t.outside) || 0,
      });
      return NextResponse.json({ ok: true, stored: points.length });
    }

    if (action === "pause" || action === "resume" || action === "finish") {
      await setSessionStatus(sessionId, s.userId, action === "finish" ? "finished" : action === "pause" ? "paused" : "running");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Tracking failed." }, { status: 500 });
  }
}
