import { NextResponse } from "next/server";
import crypto from "crypto";
import { listFinanceEntries, listWorkLogs, listPayments, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

const num = (v: string | null) => (v === null ? 0 : Number(v) || 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

function keyOk(req: Request): boolean {
  const expected = process.env.FINANCE_API_KEY;
  if (!expected) return false; // disabled until a key is set
  const url = new URL(req.url);
  const given =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("key") ||
    "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-api-key, authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

/**
 * Read-only financial summary for Infinite Distributions.
 *
 *   GET /api/finance?key=<FINANCE_API_KEY>[&from=YYYY-MM-DD&to=YYYY-MM-DD]
 *
 * Revenue and non-labour expenses come from entries recorded in the admin
 * dashboard. Labour cost is derived from the work logs (what each job pays).
 */
export async function GET(req: Request) {
  if (!process.env.FINANCE_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "Finance API is disabled. Set FINANCE_API_KEY to enable it." },
      { status: 503, headers: cors },
    );
  }
  if (!keyOk(req)) {
    return NextResponse.json({ ok: false, error: "Invalid API key." }, { status: 401, headers: cors });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not connected." }, { status: 503, headers: cors });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const inRange = (d: string | null) => {
    if (!d) return !from && !to ? true : false;
    const day = String(d).slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  };

  try {
    const [entries, jobs, payments] = await Promise.all([listFinanceEntries(1000), listWorkLogs(1000), listPayments()]);

    const fin = entries.filter((e) => inRange(e.entry_date));
    const revenue = fin.filter((e) => e.kind === "revenue").reduce((t, e) => t + num(e.amount), 0);
    const otherExpenses = fin.filter((e) => e.kind === "expense").reduce((t, e) => t + num(e.amount), 0);

    const jobsInRange = jobs.filter((j) => inRange(j.created_at));
    const labourTotal = jobsInRange.reduce((t, j) => t + num(j.amount), 0);
    const labourPaid = jobsInRange.filter((j) => j.paid_on).reduce((t, j) => t + num(j.amount), 0);
    const labourOwed = round2(labourTotal - labourPaid);

    const expenses = round2(otherExpenses + labourTotal);
    const profit = round2(revenue - expenses);

    const byCategory = (kind: "revenue" | "expense") => {
      const out: Record<string, number> = {};
      fin.filter((e) => e.kind === kind).forEach((e) => {
        const k = e.category || "Uncategorised";
        out[k] = round2((out[k] || 0) + num(e.amount));
      });
      return out;
    };

    return NextResponse.json(
      {
        ok: true,
        business: "Infinite Distributions",
        currency: "AUD",
        period: { from: from || null, to: to || null },
        generatedAt: new Date().toISOString(),
        totals: {
          revenue: round2(revenue),
          expenses,
          profit,
          margin: revenue > 0 ? round2((profit / revenue) * 100) : null,
        },
        breakdown: {
          labour: { total: round2(labourTotal), paid: round2(labourPaid), owed: labourOwed },
          otherExpenses: round2(otherExpenses),
          revenueByCategory: byCategory("revenue"),
          expensesByCategory: byCategory("expense"),
        },
        activity: {
          jobs: jobsInRange.length,
          leafletsDelivered: jobsInRange.reduce((t, j) => t + (j.leaflet_count || 0), 0),
          workerPaymentsRecorded: payments.length,
        },
      },
      { headers: cors },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Query failed." },
      { status: 500, headers: cors },
    );
  }
}
