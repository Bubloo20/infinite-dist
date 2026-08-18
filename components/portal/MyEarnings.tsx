"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard, Loading } from "./PortalShell";
import type { WorkLog, Payment } from "@/lib/portal/db";
import { unpackLinks } from "@/lib/portal/text";

const money = (v: number) => `$${v.toFixed(2)}`;
const num = (v: string | null) => (v === null ? 0 : Number(v) || 0);
const day = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const stamp = (d: string) =>
  new Date(d).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

type Totals = {
  owed: number; paid: number; jobCount: number;
  unpaidCount: number; paidCount: number; awaitingRate: number; leaflets: number;
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "owed" | "paid" }) {
  return (
    <GlassCard className="min-w-0 p-4 sm:p-5">
      {/* Sits in a narrow column beside the jobs list, so the label holds one
          line and the figure scales rather than spilling out of the tile. */}
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 sm:text-[11px]">
        {label}
      </p>
      <p className={`mt-2 font-display font-extrabold leading-none tracking-tight tabular-nums ${
        // A four-figure total is far wider than "$0.00" — step the size down so
        // it still fits the tile instead of running past it.
        value.length > 9 ? "text-[clamp(0.95rem,3.2vw,1.35rem)]"
          : value.length > 6 ? "text-[clamp(1.1rem,4vw,1.65rem)]"
          : "text-[clamp(1.3rem,5vw,2.1rem)]"} ${
        tone === "owed" ? "text-amber-300" : tone === "paid" ? "text-emerald-300" : "text-white"}`}>
        {value}
      </p>
    </GlassCard>
  );
}

const editInput =
  "w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] [color-scheme:dark]";

/** Inline editor — only reachable while a shift is unpaid. */
function EditShift({ job, onDone, onCancel }: { job: WorkLog; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({
    jobNumber: job.job_number || "",
    startedAt: (job.started_at || "").slice(0, 16),
    endedAt: (job.ended_at || "").slice(0, 16),
    timeSpent: job.time_spent || "",
    leafletCount: job.leaflet_count ?? "",
    areaWorked: job.area_worked || "",
    notes: job.notes || "",
  });
  const [strava, setStrava] = useState<string[]>(unpackLinks(job.strava_urls).length ? unpackLinks(job.strava_urls) : [""]);
  const [mapmy, setMapmy] = useState<string[]>(unpackLinks(job.mapmy_urls).length ? unpackLinks(job.mapmy_urls) : [""]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/portal/me/log", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, ...f, stravaUrls: strava, mapmyUrls: mapmy }),
      });
      const d = await r.json();
      if (!d.ok) setErr(d.error || "Couldn't save.");
      else onDone();
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  };

  const setAt = (arr: string[], i: number, v: string) => arr.map((x, k) => (k === i ? v : x));

  return (
    <GlassCard className="p-5 sm:p-6">
      <p className="font-display text-lg font-bold text-white">Edit shift</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input className={editInput} placeholder="Job number" value={f.jobNumber} onChange={(e) => setF({ ...f, jobNumber: e.target.value })} />
        <input className={editInput} placeholder="Area worked" value={f.areaWorked} onChange={(e) => setF({ ...f, areaWorked: e.target.value })} />
        <input className={editInput} type="datetime-local" value={f.startedAt} onChange={(e) => setF({ ...f, startedAt: e.target.value })} />
        <input className={editInput} type="datetime-local" value={f.endedAt} onChange={(e) => setF({ ...f, endedAt: e.target.value })} />
        <input className={editInput} placeholder="Time spent" value={f.timeSpent} onChange={(e) => setF({ ...f, timeSpent: e.target.value })} />
        <input className={editInput} placeholder="Leaflets" inputMode="numeric" value={String(f.leafletCount)} onChange={(e) => setF({ ...f, leafletCount: e.target.value })} />
        <div className="sm:col-span-2 space-y-2">
          {strava.map((u, i) => (
            <div key={i} className="flex gap-2">
              <input className={editInput} placeholder="Strava link" value={u} onChange={(e) => setStrava((a) => setAt(a, i, e.target.value))} />
              {strava.length > 1 && <button onClick={() => setStrava((a) => a.filter((_, k) => k !== i))} className="rounded-xl border border-white/12 px-3 text-white/45">×</button>}
            </div>
          ))}
          <button onClick={() => setStrava((a) => [...a, ""])} className="text-[13px] font-semibold text-orchid">+ Strava link</button>
        </div>
        <div className="sm:col-span-2 space-y-2">
          {mapmy.map((u, i) => (
            <div key={i} className="flex gap-2">
              <input className={editInput} placeholder="Map My link (optional)" value={u} onChange={(e) => setMapmy((a) => setAt(a, i, e.target.value))} />
              {mapmy.length > 1 && <button onClick={() => setMapmy((a) => a.filter((_, k) => k !== i))} className="rounded-xl border border-white/12 px-3 text-white/45">×</button>}
            </div>
          ))}
          <button onClick={() => setMapmy((a) => [...a, ""])} className="text-[13px] font-semibold text-orchid">+ Map My link</button>
        </div>
        <textarea className={`${editInput} sm:col-span-2 resize-none`} rows={3} placeholder="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </div>
      {err && <p className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">{err}</p>}
      <div className="mt-4 flex gap-2">
        <button onClick={save} disabled={busy}
          className="rounded-xl bg-gradient-to-r from-electric to-orchid px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40">
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button onClick={onCancel} className="rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/60 transition hover:text-white">Cancel</button>
      </div>
    </GlassCard>
  );
}

function JobCard({ job, onEdit }: { job: WorkLog; onEdit?: () => void }) {
  const strava = unpackLinks(job.strava_urls);
  const mapmy = unpackLinks(job.mapmy_urls);
  const paid = Boolean(job.paid_on);
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-mono text-[12px] text-white/75">{job.job_number}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              paid ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300" : "border-amber-400/30 bg-amber-500/12 text-amber-300"}`}>
              {paid ? `Paid ${day(job.paid_on)}` : "Awaiting payment"}
            </span>
          </div>
          <p className="mt-2.5 text-sm text-white/50">
            {stamp(job.started_at)} → {stamp(job.ended_at)}
            {job.time_spent && <span className="ml-2 text-white/75">· {job.time_spent}</span>}
          </p>
          <p className="mt-1 text-sm text-white/45">
            {job.area_worked || "Area not recorded"}
            {job.leaflet_count ? ` · ${job.leaflet_count} leaflets` : ""}
          </p>
          {(strava.length > 0 || mapmy.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {strava.map((u, i) => (
                <a key={u} href={u} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-[#fc4c02]/40 bg-[#fc4c02]/10 px-3 py-1.5 text-[12px] font-bold text-[#ff8b5e] transition hover:bg-[#fc4c02]/20">
                  Strava {strava.length > 1 ? i + 1 : ""} ↗
                </a>
              ))}
              {mapmy.map((u, i) => (
                <a key={u} href={u} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-bold text-white/65 transition hover:bg-white/[0.1]">
                  Map My {mapmy.length > 1 ? i + 1 : ""} ↗
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className={`font-display text-2xl font-extrabold ${paid ? "text-emerald-300" : "text-white"}`}>
            {job.amount === null ? "—" : money(num(job.amount))}
          </p>
          {job.amount === null && <p className="mt-1 text-[12px] text-white/35">rate pending</p>}
          {onEdit && !paid && (
            <button onClick={onEdit} className="mt-3 rounded-lg border border-white/12 bg-white/[0.05] px-3.5 py-1.5 text-[12px] font-bold text-white/70 transition hover:bg-white/[0.1] hover:text-white">
              Edit
            </button>
          )}
          {paid && <p className="mt-3 text-[11px] uppercase tracking-wide text-white/25">Locked — paid</p>}
        </div>
      </div>
    </GlassCard>
  );
}

export default function MyEarnings() {
  const [jobs, setJobs] = useState<WorkLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"unpaid" | "paid" | "payments">("unpaid");
  const [editing, setEditing] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.jobs || []);
        setPayments(d.payments || []);
        setTotals(d.totals || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reloadKey]);

  if (loading) {
    return <Loading label="Earnings" />;
  }

  const unpaid = jobs.filter((j) => !j.paid_on);
  const paidJobs = jobs.filter((j) => j.paid_on);

  const tabs = [
    { k: "unpaid" as const, label: `Owed (${unpaid.length})` },
    { k: "paid" as const, label: `Paid (${paidJobs.length})` },
    { k: "payments" as const, label: `Payments (${payments.length})` },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="You're owed" value={money(totals?.owed ?? 0)} tone="owed" />
        <Stat label="Paid to you" value={money(totals?.paid ?? 0)} tone="paid" />
        <Stat label="Jobs logged" value={String(totals?.jobCount ?? 0)} />
      </div>

      {totals && totals.awaitingRate > 0 && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/55">
          {totals.awaitingRate} job{totals.awaitingRate > 1 ? "s" : ""} still to be priced — they&apos;ll appear in your owed total once a rate is set.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === t.k ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_10px_26px_-12px_rgba(182,109,199,0.9)]" : "text-white/50 hover:text-white/80"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {tab === "payments" ? (
          payments.length === 0 ? (
            <GlassCard className="p-12 text-center"><p className="text-white/50">No payments recorded yet.</p></GlassCard>
          ) : (
            payments.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}>
                <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-display text-lg font-bold text-white">{day(p.paid_on)}</p>
                    <p className="mt-0.5 text-sm text-white/50">{p.method || "Payment"}{p.note ? ` · ${p.note}` : ""}</p>
                  </div>
                  <p className="font-display text-2xl font-extrabold text-emerald-300">{money(num(p.amount))}</p>
                </GlassCard>
              </motion.div>
            ))
          )
        ) : (tab === "unpaid" ? unpaid : paidJobs).length === 0 ? (
          <GlassCard className="p-12 text-center">
            <p className="text-white/50">{tab === "unpaid" ? "Nothing outstanding — you're all paid up." : "No paid jobs yet."}</p>
          </GlassCard>
        ) : (
          (tab === "unpaid" ? unpaid : paidJobs).map((j, i) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}>
              {editing === j.id ? (
                <EditShift
                  job={j}
                  onCancel={() => setEditing(null)}
                  onDone={() => { setEditing(null); setReloadKey((n) => n + 1); }}
                />
              ) : (
                <JobCard job={j} onEdit={() => setEditing(j.id)} />
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
