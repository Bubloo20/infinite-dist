import { NextResponse } from "next/server";
import { currentSession } from "@/lib/portal/auth";
import { listWorkLogsForUser, listPaymentsForUser, findUserById, dbConfigured } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

const num = (v: string | null) => (v === null ? 0 : Number(v) || 0);

/** A worker's own jobs, earnings and payment history. */
export async function GET() {
  const s = currentSession();
  if (!s || !s.userId) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: true, dbConfigured: false, jobs: [], payments: [], totals: null });
  }

  try {
    const [user, jobs, payments] = await Promise.all([
      findUserById(s.userId),
      listWorkLogsForUser(s.userId),
      listPaymentsForUser(s.userId),
    ]);

    const owed = jobs.filter((j) => !j.paid_on).reduce((t, j) => t + num(j.amount), 0);
    const paidFromJobs = jobs.filter((j) => j.paid_on).reduce((t, j) => t + num(j.amount), 0);
    const paidRecorded = payments.reduce((t, p) => t + num(p.amount), 0);
    const awaitingRate = jobs.filter((j) => !j.paid_on && j.amount === null).length;

    return NextResponse.json({
      ok: true,
      dbConfigured: true,
      fullName: user?.full_name ?? null,
      payDetails: user
        ? { bankName: user.bank_name, bankBsb: user.bank_bsb, bankAccount: user.bank_account, payid: user.payid }
        : null,
      jobs,
      payments,
      totals: {
        owed,
        paid: paidFromJobs,
        paidRecorded,
        jobCount: jobs.length,
        unpaidCount: jobs.filter((j) => !j.paid_on).length,
        paidCount: jobs.filter((j) => j.paid_on).length,
        awaitingRate,
        leaflets: jobs.reduce((t, j) => t + (j.leaflet_count || 0), 0),
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Query failed." }, { status: 500 });
  }
}
