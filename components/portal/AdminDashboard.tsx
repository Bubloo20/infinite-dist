"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard, PortalMark } from "./PortalShell";
import { unpackLinks, type WorkLog, type Payment, type PortalUser, type FinanceEntry } from "@/lib/portal/db";

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
  const [dbOn, setDbOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"jobs" | "workers" | "payments" | "finance">("jobs");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/portal/logs").then((r) => r.json()),
      fetch("/api/portal/admin/finance").then((r) => r.json()).catch(() => ({ entries: [] })),
    ])
      .then(([d, f]) => {
        setLogs(d.logs || []); setUsers(d.users || []); setPayments(d.payments || []);
        setDbOn(Boolean(d.dbConfigured)); setFinance(f.entries || []);
      })
      .catch(() => setMsg("Couldn't load data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const post = async (url: string, body: unknown) => {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!d.ok) { setMsg(d.error || "Action failed."); return false; }
    setMsg(""); load(); return true;
  };

  const totals = useMemo(() => {
    const owed = logs.filter((l) => !l.paid_on).reduce((t, l) => t + num(l.amount), 0);
    const paid = logs.filter((l) => l.paid_on).reduce((t, l) => t + num(l.amount), 0);
    const revenue = finance.filter((f) => f.kind === "revenue").reduce((t, f) => t + num(f.amount), 0);
    const expenses = finance.filter((f) => f.kind === "expense").reduce((t, f) => t + num(f.amount), 0);
    return { owed, paid, revenue, expenses, profit: revenue - expenses - (owed + paid) };
  }, [logs, finance]);

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
    { k: "jobs" as const, label: `Jobs (${logs.length})` },
    { k: "workers" as const, label: `Workers (${users.length})` },
    { k: "payments" as const, label: `Payments (${payments.length})` },
    { k: "finance" as const, label: "Finance" },
  ];

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-14 sm:py-20">
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

      <div className="mt-9 grid gap-4 sm:grid-cols-4">
        <Stat label="Owed to team" value={money(totals.owed)} tone="owed" />
        <Stat label="Paid to team" value={money(totals.paid)} tone="paid" />
        <Stat label="Revenue" value={money(totals.revenue)} tone="accent" />
        <Stat label="Profit" value={money(totals.profit)} />
      </div>

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
        <div className="grid place-items-center py-20"><span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-orchid" /></div>
      ) : tab === "jobs" ? (
        <JobsTab logs={filtered} q={q} setQ={setQ} post={post} />
      ) : tab === "workers" ? (
        <WorkersTab users={users} totals={userTotals} post={post} />
      ) : tab === "payments" ? (
        <PaymentsTab users={users} payments={payments} post={post} reload={load} setMsg={setMsg} />
      ) : (
        <FinanceTab entries={finance} totals={totals} post={post} reload={load} />
      )}
    </div>
  );
}

/* ---------------------------------- jobs ---------------------------------- */

function JobsTab({ logs, q, setQ, post }: {
  logs: WorkLog[]; q: string; setQ: (v: string) => void;
  post: (u: string, b: unknown) => Promise<boolean>;
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
      <div className="mt-5 space-y-3">
        {!logs.length ? (
          <GlassCard className="p-14 text-center"><p className="text-white/50">No work logs yet.</p></GlassCard>
        ) : logs.map((l) => <JobRow key={l.id} log={l} post={post} />)}
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
          <button onClick={() => post("/api/portal/admin/job", { id: log.id, markPaid: !paid })}
            className={paid ? btnGhost : btn}>
            {paid ? "Mark unpaid" : "Mark as paid"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

/* --------------------------------- workers -------------------------------- */

function WorkersTab({ users, totals, post }: {
  users: PortalUser[];
  totals: (id: number) => { owed: number; paid: number; jobs: number };
  post: (u: string, b: unknown) => Promise<boolean>;
}) {
  if (!users.length) return <GlassCard className="mt-6 p-14 text-center"><p className="text-white/50">No accounts yet. Workers create their own at /portal.</p></GlassCard>;
  return (
    <div className="mt-6 space-y-3">
      {users.map((u) => <WorkerRow key={u.id} user={u} t={totals(u.id)} post={post} />)}
    </div>
  );
}

function WorkerRow({ user, t, post }: {
  user: PortalUser; t: { owed: number; paid: number; jobs: number };
  post: (u: string, b: unknown) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    bankName: user.bank_name || "", bankBsb: user.bank_bsb || "",
    bankAccount: user.bank_account || "", payid: user.payid || "",
  });

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-white">{user.full_name}</h3>
          <p className="mt-1 text-sm text-white/45">{t.jobs} job{t.jobs === 1 ? "" : "s"} · joined {day(user.created_at)}</p>
          {(user.payid || user.bank_account) && (
            <p className="mt-1 text-[13px] text-white/40">
              {user.payid ? `PayID ${user.payid}` : ""}{user.payid && user.bank_account ? " · " : ""}
              {user.bank_account ? `${user.bank_bsb || ""} ${user.bank_account}` : ""}
            </p>
          )}
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
          <button onClick={() => setOpen((v) => !v)} className={btnGhost}>{open ? "Close" : "Pay details"}</button>
        </div>
      </div>

      {open && (
        <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
          <input className={input} placeholder="PayID (email or phone)" value={f.payid} onChange={(e) => setF({ ...f, payid: e.target.value })} />
          <input className={input} placeholder="Bank name" value={f.bankName} onChange={(e) => setF({ ...f, bankName: e.target.value })} />
          <input className={input} placeholder="BSB" value={f.bankBsb} onChange={(e) => setF({ ...f, bankBsb: e.target.value })} />
          <input className={input} placeholder="Account number" value={f.bankAccount} onChange={(e) => setF({ ...f, bankAccount: e.target.value })} />
          <div className="sm:col-span-2">
            <button onClick={() => post("/api/portal/admin/user", { id: user.id, ...f })} className={btn}>Save pay details</button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

/* -------------------------------- payments -------------------------------- */

function PaymentsTab({ users, payments, post, reload, setMsg }: {
  users: PortalUser[]; payments: Payment[];
  post: (u: string, b: unknown) => Promise<boolean>;
  reload: () => void; setMsg: (m: string) => void;
}) {
  const [f, setF] = useState({ userId: "", amount: "", paidOn: new Date().toISOString().slice(0, 10), method: "", note: "" });
  const name = (id: number) => users.find((u) => u.id === id)?.full_name || `User ${id}`;

  const remove = async (id: number) => {
    const r = await fetch(`/api/portal/admin/payment?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.ok) reload(); else setMsg(d.error || "Delete failed.");
  };

  return (
    <>
      <GlassCard className="mt-6 p-6">
        <h3 className="font-display text-lg font-bold text-white">Record a payment</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <select className={input} value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}>
            <option value="">Worker…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <input className={input} placeholder="Amount" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          <input className={input} type="date" value={f.paidOn} onChange={(e) => setF({ ...f, paidOn: e.target.value })} />
          <input className={input} placeholder="Method (PayID…)" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} />
          <button className={btn} disabled={!f.userId || !f.amount}
            onClick={async () => { if (await post("/api/portal/admin/payment", { ...f, userId: Number(f.userId) })) setF({ ...f, amount: "", note: "" }); }}>
            Add payment
          </button>
        </div>
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

function FinanceTab({ entries, totals, post, reload }: {
  entries: FinanceEntry[];
  totals: { revenue: number; expenses: number; owed: number; paid: number; profit: number };
  post: (u: string, b: unknown) => Promise<boolean>;
  reload: () => void;
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
