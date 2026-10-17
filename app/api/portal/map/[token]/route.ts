import { NextResponse } from "next/server";
import { readMapShareToken } from "@/lib/portal/auth";
import { readShareKey } from "@/lib/portal/db";
import { listAssignments, getClientJob, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/**
 * The area behind a shared map link.
 *
 * Deliberately open: the link is the credential, and it's signed, so a worker
 * can open it from a text message without an account. Only what's needed to
 * draw the map goes out — the shape, where to centre it and what the run is
 * called. No pay, no dates, no names, nothing about the rest of the job.
 */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const id = (await readShareKey("map", params.token)) ?? readMapShareToken(params.token);
  if (!id) return NextResponse.json({ ok: false, error: "That link isn't valid." }, { status: 404 });
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "The database isn't connected." }, { status: 503 });
  }

  try {
    const assignment = (await listAssignments()).find((a) => a.id === id);
    if (!assignment) {
      return NextResponse.json({ ok: false, error: "That area is no longer there." }, { status: 404 });
    }
    const job = await getClientJob(assignment.job_id);

    return NextResponse.json({
      ok: true,
      title: assignment.title?.trim() || assignment.area_note?.trim() || job?.area?.trim() || "Delivery area",
      boundary: assignment.boundary || job?.boundary || null,
      mapCenter: assignment.map_center || job?.map_center || null,
      junkMailAllowed: assignment.junk_mail_allowed,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Couldn't load that map." },
      { status: 500 },
    );
  }
}
