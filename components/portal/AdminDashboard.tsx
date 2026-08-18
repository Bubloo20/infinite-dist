"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard, PortalMark, Loading } from "./PortalShell";
import { unpackLinks, type WorkLog, type Payment, type PortalUser, type FinanceEntry,
  type Agency, type Agent, type ClientJob, type AgencyPayment } from "@/lib/portal/db";
import ClientsTab, { ClientJobsTab } from "./ClientsTab";
import TrendChart, { type TrendPoint } from "./TrendChart";
import PublishToWorkers from "./PublishToWorkers";
import type { JobInterest, JobAssignment } from "@/lib/portal/db";
import { isTestName } from "@/lib/portal/text";

const money = (v: number) => `$${v.toFixed(2)}`;
const num = (v: string | null) => (v === null ? 0 : Number(v) || 0);
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const stamp = (d: string) => new Date(d).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const input =
  "w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] [color-scheme:dark]";
const btn =
  "rounded-xl bg-gradient-to-r from-electric to-orchid px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(182,109,199,0.9)] transition hover:-translate-y-0.5 disabled:opacity-40";
const btnGhost =
  "rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.1] hover:text-white";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "owed" | "paid" | "accent" }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className={`mt-2.5 font-display text-3xl font-extrabold tracking-tight ${
        tone === "owed" ? "text-amber-300" : tone === "paid" ? "text-emerald-300"
        : tone === "accent" ? "bg-gradient-to-r from-[#8b93ff] to-orchid bg-clip-text text-transparent" : "text-white"}`}>
        {value}
      </p>
    </GlassCard>
  );
}

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [finance, setFinance] = useState<FinanceEntry[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clientJobs, setClientJobs] = useState<ClientJob[]>([]);
  const [agencyPayments, setAgencyPayments] = useState<AgencyPayment[]>([]);
  const [interest, setInterest] = useState<JobInterest[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [contracts, setContracts] = useState<{ id: number; job_id: number; user_id: number; signed_date: string }[]>([]);
  const [dbOn, setDbOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"clientjobs" | "agencies" | "workers" | "shifts" | "payments" | "finance">("clientjobs");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [period, setPeriod] = useState<"week" | "fortnight" | "month" | "year" | "all">("week");

  // `silent` refreshes keep the screen up: saving shouldn't wipe the dashboard
  // back to a spinner and lose whatever drawer or half-typed field was open.
  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      fetch("/api/portal/logs").then((r) => r.json()),
      fetch("/api/portal/admin/finance").then((r) => r.json()).catch(() => ({ entries: [] })),
      fetch("/api/portal/admin/clients").then((r) => r.json()).catch(() => ({})),
      fetch("/api/portal/admin/contract").then((r) => r.json()).catch(() => ({ contracts: [] })),
    ])
      .then(([d, f, c, ct]) => {
        setLogs(d.logs || []); setUsers(d.users || []); setPayments(d.payments || []);
        setDbOn(Boolean(d.dbConfigured)); setFinance(f.entries || []);
        setAgencies(c.agencies || []); setAgents(c.agents || []);
        setClientJobs(c.jobs || []); setAgencyPayments(c.agencyPayments || []); setInterest(c.interest || []); setAssignments(c.assignments || []); setContracts(ct.contracts || []);
      })
      .catch(() => setMsg("Couldn't load data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const post = async (url: string, body: unknown) => {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!d.ok) { setMsg(d.error || "Action failed."); return false; }
    setMsg(""); load(true); return true;
  };

  // Period window: the week runs Sunday -> Saturday.
  const since = useMemo(() => {
    if (period === "all") return null;
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "week") { d.setDate(d.getDate() - d.getDay()); return d; }
    if (period === "fortnight") { d.setDate(d.getDate() - d.getDay() - 7); return d; }
    if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(now.getFullYear(), 0, 1);
  }, [period]);

  const inPeriod = useCallback((iso: string | null) => {
    if (!since) return true;
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) && t >= since.getTime();
  }, [since]);

  // Test jobs and the Test agency are excluded from every figure below.
  const isTestJob = useCallback((j: { title: string | null; agency_id: number | null }) =>
    isTestName(j.title) || isTestName(agencies.find((a) => a.id === j.agency_id)?.name),
    [agencies]);

  const totals = useMemo(() => {
    const lg = logs.filter((l) => inPeriod(l.created_at));
    const cj = clientJobs
      .filter((j) => !isTestJob(j))
      .filter((j) => inPeriod(j.completed_on || j.picked_on || j.created_at));
    const fe = finance.filter((f) => inPeriod(f.entry_date));
    // Owed means signed off and unpaid; work still being checked isn't a debt yet.
    const owed = lg.filter((l) => !l.paid_on && l.verified_at).reduce((t, l) => t + num(l.amount), 0);
    const unverified = lg.filter((l) => !l.paid_on && !l.verified_at).reduce((t, l) => t + num(l.amount), 0);
    const paid = lg.filter((l) => l.paid_on).reduce((t, l) => t + num(l.amount), 0);
    // Revenue is only recognised once an invoice has been raised — until then a
    // job sits in "agencies owe me" and contributes nothing to profit.
    const jobRevenue = cj.filter((j) => j.invoice_status !== "not_sent").reduce((t, j) => t + num(j.amount), 0);
    const revenue = fe.filter((f) => f.kind === "revenue").reduce((t, f) => t + num(f.amount), 0) + jobRevenue;
    const expenses = fe.filter((f) => f.kind === "expense").reduce((t, f) => t + num(f.amount), 0);
    // An agency only owes once they've been invoiced. Work that's finished but
    // unbilled is money to chase up, not a debt they're carrying.
    const agenciesOwe = cj.filter((j) => j.invoice_status === "sent").reduce((t, j) => t + num(j.amount), 0);
    const uninvoiced = cj.filter((j) => j.invoice_status === "not_sent").reduce((t, j) => t + num(j.amount), 0);
    return { owed, unverified, paid, revenue, expenses, agenciesOwe, uninvoiced, profit: revenue - expenses - (owed + paid + unverified) };
  }, [logs, finance, clientJobs, inPeriod, isTestJob]);

  // Revenue and profit grouped by month for the finance chart.
  const trend = useMemo<TrendPoint[]>(() => {
    const buckets: Record<string, { revenue: number; cost: number }> = {};
    const key = (d: string) => {
      const dt = new Date(d);
      return Number.isNaN(dt.getTime()) ? null : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    };
    clientJobs.forEach((j) => {
      if (isTestJob(j)) return;                    // sandbox record, not real money
      if (j.invoice_status === "not_sent") return; // not revenue until invoiced
      const k = key(j.invoice_date || j.completed_on || j.picked_on || j.created_at);
      if (!k) return;
      buckets[k] = buckets[k] || { revenue: 0, cost: 0 };
      buckets[k].revenue += num(j.amount);
    });
    logs.forEach((l) => {
      const k = key(l.created_at);
      if (!k) return;
      buckets[k] = buckets[k] || { revenue: 0, cost: 0 };
      buckets[k].cost += num(l.amount);
    });
    finance.forEach((f) => {
      const k = key(f.entry_date);
      if (!k) return;
      buckets[k] = buckets[k] || { revenue: 0, cost: 0 };
      if (f.kind === "revenue") buckets[k].revenue += num(f.amount);
      else buckets[k].cost += num(f.amount);
    });
    return Object.keys(buckets).sort().map((k) => {
      const [y, m] = k.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
      return { month: label, revenue: Math.round(buckets[k].revenue * 100) / 100, profit: Math.round((buckets[k].revenue - buckets[k].cost) * 100) / 100 };
    });
  }, [clientJobs, logs, finance]);

  const postClient = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/portal/admin/clients", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!d.ok) { setMsg(d.error || "Save failed."); return false; }
    setMsg(""); load(true); return true;
  };
  const delClient = async (entity: string, id: number) => {
    const r = await fetch(`/api/portal/admin/clients?entity=${entity}&id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!d.ok) setMsg(d.error || "Delete failed."); else load(true);
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return logs;
    return logs.filter((l) => [l.worker_name, l.job_number, l.area_worked || "", l.notes || ""].join(" ").toLowerCase().includes(t));
  }, [logs, q]);

  const userTotals = (id: number) => {
    const mine = logs.filter((l) => l.user_id === id);
    return {
      owed: mine.filter((l) => !l.paid_on).reduce((t, l) => t + num(l.amount), 0),
      paid: mine.filter((l) => l.paid_on).reduce((t, l) => t + num(l.amount), 0),
      jobs: mine.length,
    };
  };

  const tabs = [
    { k: "clientjobs" as const, label: `Jobs (${clientJobs.length})` },
    { k: "agencies" as const, label: `Agencies (${agencies.length})` },
    { k: "workers" as const, label: `Workers (${users.length})` },
    { k: "shifts" as const, label: `Shifts (${logs.length})` },
    { k: "payments" as const, label: `Pay runs (${payments.length})` },
    { k: "finance" as const, label: "Finance" },
  ];

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16 2xl:max-w-[1700px]">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <PortalMark small />
        <div className="flex items-center gap-3">
          <Link href="/portal" className={btnGhost}>Log a shift</Link>
          <button onClick={onSignOut} className="text-sm font-semibold text-white/40 transition hover:text-white/80">Sign out</button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">Admin</p>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
          Work <span className="bg-gradient-to-r from-[#8b93ff] to-orchid bg-clip-text text-transparent">dashboard</span>
        </h1>
      </motion.div>

      <div className="mt-8 flex flex-wrap gap-2">
        {([["week","This week (Sun-Sat)"],["fortnight","Fortnight"],["month","This month"],["year","This year"],["all","All time"]] as const).map(([k,label]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`rounded-full border px-4 py-2 text-[13px] font-bold transition ${
              period === k ? "border-white/25 bg-white/[0.12] text-white" : "border-white/10 bg-white/[0.04] text-white/50 hover:text-white/80"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Stat label="Agencies owe me" value={money(totals.agenciesOwe)} tone="accent" />
        <Stat label="Not yet invoiced" value={money(totals.uninvoiced)} tone="owed" />
        <Stat label="Owed to team" value={money(totals.owed)} tone="owed" />
        <Stat label="Paid to team" value={money(totals.paid)} />
        <Stat label="Revenue" value={money(totals.revenue)} />
        <Stat label="Profit" value={money(totals.profit)} tone="paid" />
      </div>

      {(() => {
        const waiting = logs.filter((l) => !l.verified_at && !l.paid_on);
        if (!waiting.length) return null;
        return (
          <GlassCard className="mt-6 border-amber-400/30 bg-amber-500/[0.08] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg font-bold text-amber-200">
                  {waiting.length} shift{waiting.length === 1 ? "" : "s"} marked done, waiting on you
                </p>
                <p className="mt-1 text-sm text-amber-100/70">
                  {waiting.slice(0, 3).map((l) => l.worker_name).join(", ")}
                  {waiting.length > 3 ? ` and ${waiting.length - 3} more` : ""} — check the tracking, then they&apos;re ready to pay.
                </p>
              </div>
              <button onClick={() => setTab("shifts")}
                className="rounded-xl bg-amber-400/90 px-5 py-2.5 text-[13px] font-bold text-[#2b1a02] transition hover:bg-amber-300">
                Review shifts →
              </button>
            </div>
          </GlassCard>
        );
      })()}

      {!dbOn && (
        <GlassCard className="mt-6 border-amber-400/25 bg-amber-500/[0.07] p-6">
          <p className="font-display text-lg font-bold text-amber-200">Database not connected</p>
          <p className="mt-2 text-[15px] text-amber-100/70">Add POSTGRES_URL in Vercel and redeploy.</p>
        </GlassCard>
      )}

      {msg && <p className="mt-5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{msg}</p>}

      <div className="mt-8 flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === t.k ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_10px_26px_-12px_rgba(182,109,199,0.9)]" : "text-white/50 hover:text-white/80"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading label="Loading" />
      ) : tab === "clientjobs" ? (
        <ClientJobsTab agencies={agencies} agents={agents} jobs={clientJobs} workLogs={logs} users={users} assignments={assignments} post={postClient} del={delClient} />
      ) : tab === "agencies" ? (
        <ClientsTab agencies={agencies} agents={agents} jobs={clientJobs} agencyPayments={agencyPayments} post={postClient} del={delClient} />
      ) : tab === "shifts" ? (
        <JobsTab logs={filtered} q={q} setQ={setQ} post={post} assignments={assignments} jobs={clientJobs} users={users} del={delClient} />
      ) : tab === "workers" ? (
        <div className="space-y-4">
          <PublishToWorkers jobs={clientJobs} agencies={agencies} users={users} interest={interest} assignments={assignments} post={postClient} del={delClient} />
          <WorkersTab users={users} totals={userTotals} contracts={contracts} jobs={clientJobs} assignments={assignments} post={post} reload={load} setMsg={setMsg} />
        </div>
      ) : tab === "payments" ? (
        <PaymentsTab users={users} payments={payments} logs={logs} post={post} reload={load} setMsg={setMsg} />
      ) : (
        <FinanceTab entries={finance} totals={totals} post={post} reload={load} trend={trend} />
      )}
    </div>
  );
}

/* ---------------------------------- jobs ---------------------------------- */

function JobsTab({ logs, q, setQ, post, assignments, jobs, users, del }: {
  logs: WorkLog[]; q: string; setQ: (v: string) => void;
  post: (u: string, b: unknown) => Promise<boolean>;
  assignments: JobAssignment[]; jobs: ClientJob[]; users: PortalUser[];
  del: (entity: string, id: number) => Promise<void>;
}) {
  const exportCsv = () => {
    const head = ["Worker", "Job", "Area", "Started", "Finished", "Time", "Leaflets", "Amount", "Paid on", "Strava", "MapMy", "Notes"];
    const rows = logs.map((l) => [
      l.worker_name, l.job_number, l.area_worked || "", l.started_at, l.ended_at, l.time_spent || "",
      l.leaflet_count ?? "", l.amount ?? "", l.paid_on || "",
      unpackLinks(l.strava_urls).join(" | "), unpackLinks(l.mapmy_urls).join(" | "), (l.notes || "").replace(/\n/g, " "),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `infinite-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search worker, job, area or notes…" className={`${input} flex-1 min-w-[220px]`} />
        <button onClick={exportCsv} disabled={!logs.length} className={btn}>Export CSV</button>
      </div>
      {/* Work that's been handed out but not yet logged. */}
      {assignments.length > 0 && (
        <div className="mt-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">Assigned work</p>
          <div className="mt-3 space-y-2">
            {assignments.map((a) => {
              const job = jobs.find((j) => j.id === a.job_id);
              const who = users.find((u) => u.id === a.user_id)?.full_name || `User ${a.user_id}`;
              const logged = logs.some((l) => l.user_id === a.user_id && l.client_job_id === a.job_id);
              return (
                <GlassCard key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="font-semibold text-white">{who}</p>
                      <span className="rounded-lg bg-white/[0.08] px-2.5 py-1 text-[12px] text-white/70">
                        {job?.title || `Job #${a.job_id}`}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${
                        logged ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300"
                        : a.status === "accepted" ? "border-sky-400/30 bg-sky-500/12 text-sky-300"
                        : "border-amber-400/30 bg-amber-500/12 text-amber-300"}`}>
                        {logged ? "Shift logged" : a.status === "accepted" ? "Accepted" : "Awaiting acceptance"}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-white/45">
                      {a.leaflet_share ? `${a.leaflet_share.toLocaleString()} leaflets` : "share not set"}
                      {a.area_note ? ` · ${a.area_note}` : ""}
                      {a.start_date ? ` · starts ${day(a.start_date)}` : ""}
                      {a.due_date ? ` · due ${day(a.due_date)}` : ""}
                      {a.min_hours ? ` · min ${a.min_hours} hrs` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg font-extrabold text-emerald-300">{money(num(a.pay))}</span>
                    <button onClick={() => del("assignment", a.id)} className="text-[13px] text-white/30 transition hover:text-rose-300">Remove</button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        {assignments.length > 0 && (
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">Logged shifts</p>
        )}
        <div className="space-y-3">
          {!logs.length ? (
            <GlassCard className="p-14 text-center"><p className="text-white/50">No shifts logged yet.</p></GlassCard>
          ) : logs.map((l) => <JobRow key={l.id} log={l} post={post} />)}
        </div>
      </div>
    </>
  );
}

function JobRow({ log, post }: { log: WorkLog; post: (u: string, b: unknown) => Promise<boolean> }) {
  const [amount, setAmount] = useState(log.amount ?? "");
  const strava = unpackLinks(log.strava_urls);
  const mapmy = unpackLinks(log.mapmy_urls);
  const paid = Boolean(log.paid_on);

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-lg font-bold text-white">{log.worker_name}</h3>
            <span className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-mono text-[12px] text-white/70">{log.job_number}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${
              paid ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300" : "border-amber-400/30 bg-amber-500/12 text-amber-300"}`}>
              {paid ? `Paid ${day(log.paid_on)}` : "Unpaid"}
            </span>
          </div>
          <p className="mt-2 text-sm text-white/50">
            {stamp(log.started_at)} → {stamp(log.ended_at)}
            {log.time_spent && <span className="ml-2 text-white/75">· {log.time_spent}</span>}
          </p>
          <p className="mt-1 text-sm text-white/45">
            {log.area_worked || "Area not recorded"}{log.leaflet_count ? ` · ${log.leaflet_count} leaflets` : ""}
          </p>
          {log.notes && <p className="mt-2.5 max-w-2xl text-sm text-white/55">{log.notes}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {strava.map((u, i) => (
              <a key={u} href={u} target="_blank" rel="noreferrer" className="rounded-lg border border-[#fc4c02]/40 bg-[#fc4c02]/10 px-3 py-1.5 text-[12px] font-bold text-[#ff8b5e] hover:bg-[#fc4c02]/20">
                Strava {strava.length > 1 ? i + 1 : ""} ↗
              </a>
            ))}
            {mapmy.map((u, i) => (
              <a key={u} href={u} target="_blank" rel="noreferrer" className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-bold text-white/65 hover:bg-white/[0.1]">
                Map My {mapmy.length > 1 ? i + 1 : ""} ↗
              </a>
            ))}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-52">
          <div className="flex gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$ amount" inputMode="decimal" className={input} />
            <button onClick={() => post("/api/portal/admin/job", { id: log.id, amount: amount === "" ? null : amount })} className={btnGhost}>Save</button>
          </div>
          {/* Marked done by the worker; the office checks the tracking, then pays. */}
          <button onClick={() => post("/api/portal/admin/job", { id: log.id, verified: !log.verified_at })}
            className={log.verified_at
              ? "rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              : "rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-sm font-bold text-amber-200 transition hover:bg-amber-500/25"}>
            {log.verified_at ? "Verified ✓ — undo" : "Verify tracking"}
          </button>
          <button onClick={() => post("/api/portal/admin/job", { id: log.id, markPaid: !paid })}
            disabled={!paid && !log.verified_at}
            className={`${paid ? btnGhost : btn} disabled:cursor-not-allowed disabled:opacity-40`}
            title={!paid && !log.verified_at ? "Verify the tracking first" : undefined}>
            {paid ? "Mark unpaid" : "Mark as paid"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

/* --------------------------------- workers -------------------------------- */

function WorkersTab({ users, totals, contracts, jobs, assignments, post, reload, setMsg }: {
  users: PortalUser[];
  totals: (id: number) => { owed: number; paid: number; jobs: number };
  contracts: { id: number; job_id: number; user_id: number; signed_date: string }[];
  jobs: ClientJob[];
  assignments: JobAssignment[];
  post: (u: string, b: unknown) => Promise<boolean>;
  reload: () => void;
  setMsg: (m: string) => void;
}) {
  const [nw, setNw] = useState({ fullName: "", area: "", notes: "" });
  const [only, setOnly] = useState<"all" | "working" | "owed">("owed");

  const working = (id: number) =>
    assignments.some((a) => {
      if (a.user_id !== id) return false;
      const job = jobs.find((j) => j.id === a.job_id);
      return job ? job.status !== "completed" : true;
    });

  // Whoever is owed most sits at the top — that's the list you act on.
  const shown = users
    .filter((u) => (only === "working" ? working(u.id) : only === "owed" ? totals(u.id).owed > 0 : true))
    .sort((a, b) => {
      const d = totals(b.id).owed - totals(a.id).owed;
      return d !== 0 ? d : a.full_name.localeCompare(b.full_name);
    });

  const removeWorker = async (id: number, name: string) => {
    if (!window.confirm(`Delete ${name}? Their shifts stay in the ledger but are unlinked.`)) return;
    const r = await fetch(`/api/portal/admin/user?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!d.ok) setMsg(d.error || "Delete failed."); else reload();
  };

  return (
    <div className="mt-6 space-y-3">
      <GlassCard className="p-6">
        <h3 className="font-display text-lg font-bold text-white">Add a worker</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <input className={input} placeholder="Full name" value={nw.fullName} onChange={(e) => setNw({ ...nw, fullName: e.target.value })} />
          <input className={input} placeholder="Suburbs they cover" value={nw.area} onChange={(e) => setNw({ ...nw, area: e.target.value })} />
          <input className={input} placeholder="Notes" value={nw.notes} onChange={(e) => setNw({ ...nw, notes: e.target.value })} />
          <button className={btn} disabled={!nw.fullName.trim()}
            onClick={async () => { if (await post("/api/portal/admin/user", { action: "create", ...nw })) setNw({ fullName: "", area: "", notes: "" }); }}>
            Add worker
          </button>
        </div>
        <p className="mt-2 text-[13px] text-white/35">They sign in with this name and the team password until they set their own.</p>
      </GlassCard>

      {!users.length ? (
        <GlassCard className="p-14 text-center"><p className="text-white/50">No workers yet.</p></GlassCard>
      ) : users.map((u) => (
        <WorkerRow key={u.id} user={u} t={totals(u.id)} post={post}
          contracts={contracts.filter((c) => c.user_id === u.id)} jobs={jobs}
          mine={assignments.filter((a) => a.user_id === u.id)}
          onDelete={() => removeWorker(u.id, u.full_name)} />
      ))}
    </div>
  );
}

function WorkerRow({ user, t, post, contracts, jobs, mine, onDelete }: {
  user: PortalUser; t: { owed: number; paid: number; jobs: number };
  post: (u: string, b: unknown) => Promise<boolean>;
  contracts: { id: number; job_id: number; signed_date: string }[];
  jobs: ClientJob[];
  mine: JobAssignment[];
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showJobs, setShowJobs] = useState(false);

  // Where each of their jobs actually stands.
  const theirJobs = mine.map((a) => {
    const job = jobs.find((j) => j.id === a.job_id) || null;
    const signed = contracts.find((c) => c.job_id === a.job_id) || null;
    const state = job?.status === "completed" ? "done"
      : signed ? "signed"
      : a.status === "accepted" ? "accepted"
      : "waiting";
    return { a, job, signed, state };
  });
  const waiting = theirJobs.filter((x) => x.state === "waiting").length;
  const live = theirJobs.filter((x) => x.state === "signed" || x.state === "accepted").length;

  const STATE: Record<string, { label: string; cls: string }> = {
    waiting: { label: "Awaiting acceptance", cls: "border-amber-400/35 bg-amber-500/10 text-amber-300" },
    accepted: { label: "Accepted \— not signed", cls: "border-sky-400/35 bg-sky-500/10 text-sky-300" },
    signed: { label: "Signed \— on the job", cls: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300" },
    done: { label: "Completed", cls: "border-white/15 bg-white/[0.06] text-white/55" },
  };
  const [f, setF] = useState({
    bankName: user.bank_name || "", bankBsb: user.bank_bsb || "",
    bankAccount: user.bank_account || "", payid: user.payid || "",
  });
  const [n, setN] = useState({ fullName: user.full_name, area: user.area || "", notes: user.notes || "" });

  const viewAs = async () => {
    const r = await fetch("/api/portal/admin/impersonate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if ((await r.json()).ok) window.location.href = "/portal";
  };

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-white">{user.full_name}</h3>
          <p className="mt-1 text-sm text-white/45">
            {t.jobs} shift{t.jobs === 1 ? "" : "s"} logged · joined {day(user.created_at)}
          </p>
          {theirJobs.length > 0 && (
            <button onClick={() => setShowJobs((v) => !v)}
              className="mt-1.5 flex items-center gap-2 text-[13px] font-semibold text-orchid transition hover:text-white">
              {theirJobs.length} job{theirJobs.length === 1 ? "" : "s"}
              {live ? <span className="text-emerald-300/80">· {live} on the go</span> : null}
              {waiting ? <span className="text-amber-300/80">· {waiting} awaiting acceptance</span> : null}
              <span className={`transition-transform ${showJobs ? "rotate-180" : ""}`}>▾</span>
            </button>
          )}
          {user.area && <p className="mt-1 text-[13px] text-white/45">Covers: {user.area}</p>}
          {(user.payid || user.bank_account) && (
            <p className="mt-1 text-[13px] text-white/40">
              {user.payid ? `PayID ${user.payid}` : ""}{user.payid && user.bank_account ? " · " : ""}
              {user.bank_account ? `${user.bank_bsb || ""} ${user.bank_account}` : ""}
            </p>
          )}
          {user.notes && <p className="mt-1.5 max-w-xl text-[13px] text-white/50">{user.notes}</p>}
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">Owed</p>
            <p className="font-display text-xl font-extrabold text-amber-300">{money(t.owed)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">Paid</p>
            <p className="font-display text-xl font-extrabold text-emerald-300">{money(t.paid)}</p>
          </div>
          <button onClick={viewAs} className={btnGhost}>View as</button>
          <button onClick={() => setOpen((v) => !v)} className={btnGhost}>{open ? "Close" : "Edit"}</button>
        </div>
      </div>

      {showJobs && theirJobs.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {theirJobs.map(({ a, job, signed, state }) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
              <div>
                <p className="text-[14px] font-semibold text-white">
                  {job?.title || `Job #${a.job_id}`}
                  <span className={`ml-2 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase ${STATE[state].cls}`}>
                    {STATE[state].label}
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] text-white/45">
                  {a.leaflet_share ? `${a.leaflet_share.toLocaleString()} leaflets` : "share not set"}
                  {a.area_note ? ` · ${a.area_note}` : ""}
                  {a.due_date ? ` · due ${day(a.due_date)}` : ""}
                  {signed ? ` · signed ${day(signed.signed_date)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-[15px] font-extrabold text-emerald-300">
                  {a.pay ? `$${Number(a.pay).toFixed(2)}` : "—"}
                </span>
                {signed && (
                  <a href={`/portal/admin/contract/${a.job_id}`} className="text-[13px] font-semibold text-white/45 transition hover:text-white">
                    Contract ↗
                  </a>
                )}
                <a href={`/portal/admin/timesheet/${a.job_id}`} className="text-[13px] font-semibold text-white/45 transition hover:text-white">
                  Timesheet ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
          <input className={input} placeholder="PayID (email or phone)" value={f.payid} onChange={(e) => setF({ ...f, payid: e.target.value })} />
          <input className={input} placeholder="Bank name" value={f.bankName} onChange={(e) => setF({ ...f, bankName: e.target.value })} />
          <input className={input} placeholder="BSB" value={f.bankBsb} onChange={(e) => setF({ ...f, bankBsb: e.target.value })} />
          <input className={input} placeholder="Account number" value={f.bankAccount} onChange={(e) => setF({ ...f, bankAccount: e.target.value })} />
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-white/40">Full name</span>
            <input className={input} placeholder="Full name" value={n.fullName}
              onChange={(e) => setN({ ...n, fullName: e.target.value })} />
            <span className="mt-1 block text-[12px] text-white/30">
              This is the name they sign in with.
            </span>
          </label>
          <input className={input} placeholder="Suburbs they work / can work" value={n.area} onChange={(e) => setN({ ...n, area: e.target.value })} />
          <input className={input} placeholder="Notes about this worker" value={n.notes} onChange={(e) => setN({ ...n, notes: e.target.value })} />
          {contracts.length > 0 && (
            <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/40">Signed agreements</p>
              <div className="mt-2 space-y-1.5">
                {contracts.map((c) => {
                  const job = jobs.find((j) => j.id === c.job_id);
                  return (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        {job?.title || `Job #${c.job_id}`} — signed {day(c.signed_date)}
                      </span>
                      <Link href={`/portal/admin/contract/${c.job_id}`} className="text-[13px] font-bold text-orchid hover:text-white">
                        View / print ↗
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button onClick={() => post("/api/portal/admin/user", { id: user.id, ...f })} className={btn}>Save pay details</button>
            <button onClick={() => post("/api/portal/admin/user", { action: "notes", id: user.id, ...n })} className={btn}>Save name, notes &amp; suburbs</button>
            <button onClick={onDelete} className="rounded-xl border border-rose-400/30 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10">Delete worker</button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

/* -------------------------------- payments -------------------------------- */

function PaymentsTab({ users, payments, logs, post, reload, setMsg }: {
  users: PortalUser[]; payments: Payment[]; logs: WorkLog[];
  post: (u: string, b: unknown) => Promise<boolean>;
  reload: () => void; setMsg: (m: string) => void;
}) {
  const [f, setF] = useState({ userId: "", amount: "", paidOn: new Date().toISOString().slice(0, 10), method: "", note: "" });
  const [target, setTarget] = useState<"all" | string>("all");
  const name = (id: number) => users.find((u) => u.id === id)?.full_name || `User ${id}`;

  // Unpaid shifts for the chosen worker, and what they add up to.
  const unpaid = useMemo(
    () => (f.userId ? logs.filter((l) => String(l.user_id) === f.userId && !l.paid_on) : []),
    [logs, f.userId],
  );
  const owedTotal = useMemo(() => unpaid.reduce((t, l) => t + num(l.amount), 0), [unpaid]);

  // Choosing a worker fills in everything they are owed; choosing one job narrows it.
  const chooseWorker = (id: string) => {
    const mine = logs.filter((l) => String(l.user_id) === id && !l.paid_on);
    setF((p) => ({ ...p, userId: id, amount: mine.reduce((t, l) => t + num(l.amount), 0).toFixed(2) }));
    setTarget("all");
  };
  const chooseTarget = (v: string) => {
    setTarget(v);
    if (v === "all") setF((p) => ({ ...p, amount: owedTotal.toFixed(2) }));
    else {
      const l = unpaid.find((x) => String(x.id) === v);
      setF((p) => ({ ...p, amount: l ? num(l.amount).toFixed(2) : p.amount }));
    }
  };

  const remove = async (id: number) => {
    const r = await fetch(`/api/portal/admin/payment?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.ok) reload(); else setMsg(d.error || "Delete failed.");
  };

  return (
    <>
      <GlassCard className="mt-6 p-6">
        <h3 className="font-display text-lg font-bold text-white">Record a payment</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select className={input} value={f.userId} onChange={(e) => chooseWorker(e.target.value)}>
            <option value="">Worker…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>

          <select className={input} value={target} onChange={(e) => chooseTarget(e.target.value)} disabled={!f.userId}>
            <option value="all">Everything outstanding{f.userId ? ` — ${money(owedTotal)}` : ""}</option>
            {unpaid.map((l) => (
              <option key={l.id} value={l.id}>
                {l.job_number || `Shift #${l.id}`}{l.area_worked ? ` · ${l.area_worked}` : ""} — {money(num(l.amount))}
              </option>
            ))}
          </select>

          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-white/40">Amount (edit for a part payment)</span>
            <input className={input} placeholder="Amount" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          </label>

          <input className={input} type="date" value={f.paidOn} onChange={(e) => setF({ ...f, paidOn: e.target.value })} />
          <input className={input} placeholder="Method (PayID…)" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} />
          <button className={btn} disabled={!f.userId || !f.amount}
            onClick={async () => {
              const amt = Number(f.amount);
              // Only settle shifts when the payment actually covers them.
              const ids = target === "all"
                ? (amt >= owedTotal - 0.001 ? unpaid.map((l) => l.id) : [])
                : (amt >= num(unpaid.find((l) => String(l.id) === target)?.amount ?? null) - 0.001 ? [Number(target)] : []);
              if (await post("/api/portal/admin/payment", { ...f, userId: Number(f.userId), workLogIds: ids })) {
                setF({ ...f, amount: "", note: "" }); setTarget("all");
              }
            }}>
            Add payment
          </button>
        </div>
        {f.userId && (
          <p className="mt-2 text-[13px] text-white/40">
            {unpaid.length
              ? `${name(Number(f.userId))} is owed ${money(owedTotal)} across ${unpaid.length} shift${unpaid.length === 1 ? "" : "s"}. A smaller amount is recorded as a part payment and leaves the shift outstanding.`
              : `${name(Number(f.userId))} has nothing outstanding.`}
          </p>
        )}
      </GlassCard>

      <div className="mt-5 space-y-3">
        {!payments.length ? (
          <GlassCard className="p-14 text-center"><p className="text-white/50">No payments recorded yet.</p></GlassCard>
        ) : payments.map((p) => (
          <GlassCard key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-display text-lg font-bold text-white">{name(p.user_id)}</p>
              <p className="mt-0.5 text-sm text-white/50">{day(p.paid_on)}{p.method ? ` · ${p.method}` : ""}{p.note ? ` · ${p.note}` : ""}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-display text-xl font-extrabold text-emerald-300">{money(num(p.amount))}</p>
              <button onClick={() => remove(p.id)} className="text-sm text-white/30 transition hover:text-rose-300">Delete</button>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}

/* --------------------------------- finance -------------------------------- */

function FinanceTab({ entries, totals, post, reload, trend }: {
  entries: FinanceEntry[];
  totals: { revenue: number; expenses: number; owed: number; paid: number; profit: number };
  post: (u: string, b: unknown) => Promise<boolean>;
  reload: () => void;
  trend: TrendPoint[];
}) {
  const [f, setF] = useState({ kind: "revenue", amount: "", category: "", description: "", entryDate: new Date().toISOString().slice(0, 10) });

  const remove = async (id: number) => {
    await fetch(`/api/portal/admin/finance?id=${id}`, { method: "DELETE" });
    reload();
  };

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue" value={money(totals.revenue)} tone="accent" />
        <Stat label="Expenses (incl. labour)" value={money(totals.expenses + totals.owed + totals.paid)} />
        <Stat label="Profit" value={money(totals.profit)} tone={totals.profit >= 0 ? "paid" : "owed"} />
      </div>

      <div className="mt-5"><TrendChart points={trend} /></div>

      <GlassCard className="mt-5 p-6">
        <h3 className="font-display text-lg font-bold text-white">Add revenue or expense</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <select className={input} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
          </select>
          <input className={input} placeholder="Amount" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          <input className={input} placeholder="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <input className={input} type="date" value={f.entryDate} onChange={(e) => setF({ ...f, entryDate: e.target.value })} />
          <button className={btn} disabled={!f.amount}
            onClick={async () => { if (await post("/api/portal/admin/finance", f)) setF({ ...f, amount: "", category: "", description: "" }); }}>
            Add entry
          </button>
        </div>
      </GlassCard>

      <div className="mt-5 space-y-3">
        {!entries.length ? (
          <GlassCard className="p-14 text-center"><p className="text-white/50">No revenue or expenses recorded yet.</p></GlassCard>
        ) : entries.map((e) => (
          <GlassCard key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${
                  e.kind === "revenue" ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300" : "border-rose-400/30 bg-rose-500/12 text-rose-300"}`}>
                  {e.kind}
                </span>
                <p className="font-display text-lg font-bold text-white">{e.category || "Uncategorised"}</p>
              </div>
              <p className="mt-1 text-sm text-white/50">{day(e.entry_date)}{e.description ? ` · ${e.description}` : ""}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className={`font-display text-xl font-extrabold ${e.kind === "revenue" ? "text-emerald-300" : "text-rose-300"}`}>
                {e.kind === "revenue" ? "+" : "−"}{money(num(e.amount))}
              </p>
              <button onClick={() => remove(e.id)} className="text-sm text-white/30 transition hover:text-rose-300">Delete</button>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
