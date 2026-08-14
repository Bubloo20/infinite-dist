import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/portal/auth";
import { verifyStravaActivity } from "@/lib/portal/strava";

export const dynamic = "force-dynamic";

/** Live "does this activity exist?" check, used for instant feedback in the form. */
export async function POST(req: Request) {
  if (!isSignedIn()) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  let body: { url?: string; startedAt?: string; endedAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  const result = await verifyStravaActivity(body.url || "", {
    startedAt: body.startedAt || null,
    endedAt: body.endedAt || null,
  });
  return NextResponse.json(result);
}
