import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

/**
 * The names on the register, for the sign-in and sign-up pickers.
 *
 * Only accounts the office has added can sign in or claim an account, so the
 * portal offers the list rather than a free-text box. It returns names only —
 * no contact details, no pay, no ids that unlock anything — and a password is
 * still required to get in.
 */
export async function GET() {
  if (!dbConfigured()) return NextResponse.json({ ok: true, workers: [] });

  try {
    const r = await sql<{ full_name: string; has_password: boolean }>`
      SELECT full_name, (password_hash IS NOT NULL AND password_hash <> '') AS has_password
        FROM portal_users
       ORDER BY full_name;`;
    return NextResponse.json({
      ok: true,
      workers: r.rows.map((w) => ({ name: w.full_name, hasAccount: w.has_password })),
    });
  } catch {
    return NextResponse.json({ ok: true, workers: [] });
  }
}
