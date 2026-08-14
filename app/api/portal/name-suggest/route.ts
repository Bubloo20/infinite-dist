import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/**
 * Type-ahead for the sign-in name box.
 *
 * Privacy: this is unauthenticated, so it never lists the team. It needs at
 * least 3 characters, matches from the start of the name or of any word in it,
 * returns at most 5, and is rate limited — enough to finish a name you already
 * know, not enough to enumerate the roster.
 */
const MIN_CHARS = 3;
const MAX_RESULTS = 5;

const hits = new Map<string, { count: number; first: number }>();
const WINDOW = 60 * 1000;
const MAX_PER_MIN = 30;

function limited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.first > WINDOW) {
    hits.set(ip, { count: 1, first: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_MIN;
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ names: [] });

  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < MIN_CHARS || !dbConfigured()) return NextResponse.json({ names: [] });

  try {
    const like = `${q.toLowerCase()}%`;
    const wordLike = `% ${q.toLowerCase()}%`;
    const r = await sql<{ full_name: string }>`
      SELECT full_name FROM portal_users
      WHERE name_key LIKE ${like} OR name_key LIKE ${wordLike}
      ORDER BY full_name ASC
      LIMIT ${MAX_RESULTS};
    `;
    return NextResponse.json({ names: r.rows.map((x) => x.full_name) });
  } catch {
    return NextResponse.json({ names: [] });
  }
}
