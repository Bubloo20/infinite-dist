"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./PortalShell";
import BoundaryMap, { type LatLng } from "./BoundaryMap";
import JobContract from "./JobContract";
import WorkLogForm from "./WorkLogForm";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";

const money = (v: string | null) => (v ? `$${Number(v).toFixed(2)}` : "—");
const parsePts = (s: string | null): LatLng[] => {
  if (!s) return [];
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
};
const parseCenter = (s: string | null): [number, number, number] | null => {
  if (!s) return null;
  try { const v = JSON.parse(s); return Array.isArray(v) && v.length === 3 ? (v as [number, number, number]) : null; } catch { return null; }
};

type MyLog = {
  id: number; jobId: number | null; jobNumber: string;
  startedAt: string; endedAt: string; timeSpent: string | null;
  leaflets: number | null; amount: string | null;
  paidOn: string | null; paidAt: string | null;
};

const stamp = (l: MyLog) =>
  l.paidAt
    ? new Date(l.paidAt).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : l.paidOn
      ? new Date(`${l.paidOn}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
      : "";

/** Orange until the office has paid for this job, green once they have. */
function PayState({ logs, owed }: { logs: MyLog[]; owed: string | null }) {
  const paid = logs.length > 0 && logs.every((l) => l.paidOn);
  const when = paid ? stamp(logs.slice().sort((a, b) => (b.paidAt || b.paidOn || "").localeCompare(a.paidAt || a.paidOn || ""))[0]) : "";
  return (
    <div className={`mt-2 inline-flex flex-col items-end rounded-xl border px-3 py-1.5 text-right ${
      paid ? "border-emerald-400/30 bg-emerald-500/10" : "border-amber-400/30 bg-amber-500/10"}`}>
      <span className={`text-[12px] font-bold uppercase tracking-wide ${paid ? "text-emerald-300" : "text-amber-300"}`}>
        {paid ? "Paid" : "Awaiting payment"}
      </span>
      <span className={`text-[12px] ${paid ? "text-emerald-100/70" : "text-amber-100/70"}`}>
        {paid ? when : logs.length ? `${owed || ""} owing`.trim() : "log your shifts below"}
      </span>
    </div>
  );
}

/** Ticking time-left to the due date — the deadline is the end of that day. */
function Countdown({ due }: { due: string | null | undefined }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!due || now === null) return null;
  const deadline = new Date(`${due}T23:59:59`).getTime();
  if (!Number.isFinite(deadline)) return null;

  const ms = deadline - now;
  const over = ms <= 0;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const sec = Math.floor((abs % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const tone = over
    ? "border-rose-400/35 bg-rose-500/10 text-rose-200"
    : ms < 86400000
      ? "border-amber-400/35 bg-amber-500/10 text-amber-200"
      : "border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-200";

  return (
    <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${tone}`}>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
        {over ? "Overdue by" : "Time remaining"}
      </span>
      <span className="font-display text-lg font-extrabold tabular-nums tracking-tight">
        {d > 0 && `${d}d `}{pad(h)}:{pad(m)}:{pad(sec)}
      </span>
    </div>
  );
}

function Brief({ job, mine }: { job: ClientJob; mine?: JobAssignment | null }) {
  const shortDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) : "—";
  // A sub-contract overrides the job-level figures for this worker.
  const items: [string, string][] = mine
    ? [
        ["Your area", mine.area_note || job.area || "—"],
        ["Your leaflets", mine.leaflet_share ? mine.leaflet_share.toLocaleString() : (job.quantity ? job.quantity.toLocaleString() : "—")],
        ["Your pay", money(mine.pay ?? job.worker_pay)],
        ["Start", shortDate(mine.start_date)],
        ["Due", shortDate(mine.due_date)],
        ["Minimum hours", mine.min_hours || job.min_hours || "—"],
        ["Allocated time", mine.start_date || mine.due_date
          ? `${shortDate(mine.start_date)} – ${shortDate(mine.due_date)}`
          : mine.allocated_time || job.allocated_time || "—"],
      ]
    : [
        ["Area", job.area || "—"],
        ["Leaflets", job.quantity ? job.quantity.toLocaleString() : "—"],
        ["Your pay", money(job.worker_pay)],
        ["Allocated time", job.allocated_time || "—"],
        ["Minimum hours", job.min_hours || "—"],
      ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">{k}</p>
          <p className="mt-0.5 font-semibold text-white">{v}</p>
        </div>
      ))}
    </div>
  );
}

function BriefWithCountdown({ job, mine }: { job: ClientJob; mine?: JobAssignment | null }) {
  return (
    <>
      <Brief job={job} mine={mine} />
      <Countdown due={mine?.due_date} />
    </>
  );
}

export default function JobMarket({ workerName }: { workerName: string }) {
  const [open, setOpen] = useState<ClientJob[]>([]);
  const [mine, setMine] = useState<ClientJob[]>([]);
  const [interest, setInterest] = useState<number[]>([]);
  const [contracts, setContracts] = useState<{ jobId: number; signedDate: string }[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [logs, setLogs] = useState<MyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"available" | "mine">("available");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [logging, setLogging] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/portal/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setOpen(d.open || []); setMine(d.mine || []);
        setInterest(d.interest || []); setContracts(d.contracts || []);
        setAssignments(d.assignments || []); setLogs(d.logs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const accept = async (jobId: number) => {
    setBusyId(jobId);
    try {
      await fetch("/api/portal/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", jobId }),
      });
      load();
    } finally { setBusyId(null); }
  };

  const act = async (jobId: number, action: "interest" | "withdraw", note?: string) => {
    setBusyId(jobId);
    try {
      await fetch("/api/portal/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, jobId, note }),
      });
      load();
    } finally { setBusyId(null); }
  };

  const askQuestion = (jobId: number) => {
    const q = window.prompt("What would you like to ask the office about this job?");
    if (q && q.trim()) act(jobId, "interest", q.trim());
  };

  const decline = (jobId: number) => {
    const why = window.prompt("Let the office know why you're passing (optional):") ?? "";
    act(jobId, "interest", `[declined] ${why}`.trim());
  };

  if (loading) {
    return <div className="grid place-items-center py-20"><span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-orchid" /></div>;
  }

  const signedFor = (id: number) => contracts.find((c) => c.jobId === id)?.signedDate ?? null;
  const mineFor = (id: number) => assignments.find((a) => a.job_id === id) ?? null;
  const logsFor = (id: number) => logs.filter((l) => l.jobId === id);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        {([["available", `Available (${open.length})`], ["mine", `My jobs (${mine.length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${
              tab === k ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_10px_26px_-12px_rgba(182,109,199,0.9)]" : "text-white/50 hover:text-white/80"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "available" ? (
        !open.length ? (
          <GlassCard className="p-14 text-center">
            <p className="font-display text-lg font-bold text-white">No jobs posted right now</p>
            <p className="mt-2 text-white/50">When the office publishes a job it&apos;ll appear here to put your hand up for.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {open.map((j, i) => {
              const keen = interest.includes(j.id);
              const pts = parsePts(j.boundary);
              return (
                <motion.div key={j.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}>
                  <GlassCard className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-xl font-bold text-white">{j.title || `Job #${j.id}`}</h3>
                        <p className="mt-1 text-sm text-white/50">{j.area || "Area to be confirmed"}</p>
                      </div>
                      <p className="font-display text-2xl font-extrabold text-emerald-300">
                        {money(mineFor(j.id)?.pay ?? j.worker_pay)}
                      </p>
                    </div>

                    <div className="mt-5"><Brief job={j} mine={mineFor(j.id)} /></div>

                    {pts.length >= 3 && (
                      <button onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                        className="mt-4 text-sm font-semibold text-orchid transition hover:text-white">
                        {expanded === j.id ? "Hide map" : "View delivery area map"}
                      </button>
                    )}
                    {expanded === j.id && (
                      <div className="mt-4"><BoundaryMap boundary={pts} center={parseCenter(j.map_center)} height={340} /></div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() => act(j.id, keen ? "withdraw" : "interest")}
                        disabled={busyId === j.id}
                        className={`rounded-2xl px-6 py-3 font-display text-[15px] font-bold transition hover:-translate-y-0.5 disabled:opacity-50 ${
                          keen ? "border border-white/15 bg-white/[0.06] text-white/70"
                               : "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_14px_34px_-14px_rgba(182,109,199,0.9)]"}`}>
                        {busyId === j.id ? "…" : keen ? "Interested ✓ — withdraw" : "I'm interested"}
                      </button>
                      <button onClick={() => askQuestion(j.id)} disabled={busyId === j.id}
                        className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 font-display text-[15px] font-bold text-white/75 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-50">
                        Ask a question
                      </button>
                      <button onClick={() => decline(j.id)} disabled={busyId === j.id}
                        className="rounded-2xl border border-rose-400/30 px-5 py-3 font-display text-[15px] font-bold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50">
                        Decline
                      </button>
                    </div>
                    {keen && <p className="mt-2 text-[13px] text-white/40">The office can see your response and will assign it if it&apos;s yours.</p>}
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )
      ) : !mine.length ? (
        <GlassCard className="p-14 text-center">
          <p className="font-display text-lg font-bold text-white">Nothing assigned yet</p>
          <p className="mt-2 text-white/50">Show interest in an available job and the office will assign it to you.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {mine.map((j) => {
            const a = mineFor(j.id);
            const pts = parsePts(a?.boundary ?? null).length >= 3 ? parsePts(a?.boundary ?? null) : parsePts(j.boundary);
            const signed = signedFor(j.id);
            const accepted = a?.status === "accepted" || Boolean(signed);
            return (
              <div key={j.id} className="rounded-[26px] border border-white/10 bg-white/[0.02] p-2 sm:p-3">
                {!accepted && (
                  <div className="mb-2 overflow-hidden rounded-[20px] border border-orchid/40 bg-gradient-to-br from-electric/25 to-orchid/20 p-6 sm:p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">New job for you</p>
                    <h3 className="mt-2 font-display text-[clamp(1.5rem,4.5vw,2rem)] font-extrabold leading-tight tracking-tight text-white">
                      {j.title || `Job #${j.id}`}
                    </h3>
                    <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/65">
                      Accepting draws up your contractor agreement with the pay, hours and dates below filled in.
                      You&apos;ll read the terms and sign it electronically, and a copy goes to the office.
                    </p>
                    <button onClick={() => accept(j.id)} disabled={busyId === j.id}
                      className="mt-5 w-full rounded-2xl bg-white px-8 py-4 font-display text-[16px] font-extrabold text-ink shadow-[0_18px_44px_-14px_rgba(255,255,255,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50 sm:w-auto">
                      {busyId === j.id ? "Accepting…" : "Accept this job →"}
                    </button>
                  </div>
                )}
                <GlassCard className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">{j.title || `Job #${j.id}`}</h3>
                      <p className="mt-1 text-sm text-white/50">{j.area || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-extrabold text-emerald-300">
                        {money(mineFor(j.id)?.pay ?? j.worker_pay)}
                      </p>
                      <PayState logs={logsFor(j.id)} owed={money(mineFor(j.id)?.pay ?? j.worker_pay)} />
                    </div>
                  </div>
                  <div className="mt-5"><BriefWithCountdown job={j} mine={mineFor(j.id)} /></div>
                  {pts.length >= 3 && (
                    <div className="mt-5">
                      <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">
                        Your delivery area — zoom, pan, and see where you are
                      </p>
                      <BoundaryMap boundary={pts} center={parseCenter(a?.map_center ?? j.map_center)} height={400} locate />
                    </div>
                  )}
                  {logsFor(j.id).length > 0 && (
                    <div className="mt-5">
                      <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">
                        Your shifts on this job ({logsFor(j.id).length})
                      </p>
                      <div className="space-y-2">
                        {logsFor(j.id).map((l) => (
                          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
                            <span className="text-[13px] text-white/70">
                              {new Date(l.startedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                              {l.timeSpent ? ` · ${l.timeSpent}` : ""}
                              {l.leaflets ? ` · ${l.leaflets.toLocaleString()} leaflets` : ""}
                            </span>
                            <span className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                              l.paidOn ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                              {l.paidOn ? `Paid ${stamp(l)}` : "Awaiting payment"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {mineFor(j.id)?.map_image && (
                    <div className="mt-5">
                      <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Your area diagram</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mineFor(j.id)!.map_image!} alt="Area diagram for your section"
                        className="w-full rounded-2xl border border-white/12" />
                    </div>
                  )}
                </GlassCard>

                {accepted && (
                  <div className="mt-2 space-y-2 border-l-2 border-orchid/35 pl-3 sm:pl-4">
                    <p className="pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/30">
                      For {j.title || `Job #${j.id}`}
                    </p>
                    <JobContract job={j} workerName={workerName} signedDate={signed} mine={a} onSigned={load} />
                    {signed && (
                      <div>
                        <button onClick={() => setLogging(logging === j.id ? null : j.id)}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-4 text-left transition hover:bg-white/[0.08]">
                          <span>
                            <span className="block font-display text-[15px] font-bold text-white">Log your work on this job</span>
                            <span className="mt-0.5 block text-[13px] text-white/45">
                              {logsFor(j.id).length
                                ? `${logsFor(j.id).length} shift${logsFor(j.id).length === 1 ? "" : "s"} logged — add another`
                                : "Hours, leaflets and your tracking links"}
                            </span>
                          </span>
                          <span className={`shrink-0 text-white/40 transition-transform ${logging === j.id ? "rotate-180" : ""}`}>▾</span>
                        </button>
                        {logging === j.id && (
                          <div className="mt-2">
                            <WorkLogForm job={j} mine={a} onDone={load} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
