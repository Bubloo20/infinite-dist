"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard, Loading } from "./PortalShell";
import BoundaryMap, { parseSpec, specHasDrawing } from "./BoundaryMap";
import JobContract from "./JobContract";
import WorkLogForm, { type EditableLog } from "./WorkLogForm";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";
import { submitForm } from "@/lib/forms";

const money = (v: string | null) => (v ? `$${Number(v).toFixed(2)}` : "—");
const parseCenter = (s: string | null): [number, number, number] | null => {
  if (!s) return null;
  try { const v = JSON.parse(s); return Array.isArray(v) && v.length === 3 ? (v as [number, number, number]) : null; } catch { return null; }
};

type MyLog = {
  id: number; jobId: number | null; assignmentId: number | null; jobNumber: string;
  startedAt: string; endedAt: string; timeSpent: string | null;
  leaflets: number | null; amount: string | null;
  paidOn: string | null; paidAt: string | null;
  areaWorked: string | null; notes: string | null;
  stravaUrls: string | null; mapmyUrls: string | null;
};

const stamp = (l: MyLog) =>
  l.paidAt
    ? new Date(l.paidAt).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : l.paidOn
      ? new Date(`${l.paidOn}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
      : "";

/**
 * Where this job's money stands, but only once there's something to say: a job
 * nobody has accepted or worked isn't awaiting payment, it just hasn't started.
 */
function PayState({ logs, accepted }: { logs: MyLog[]; accepted: boolean }) {
  if (!accepted || !logs.length) return null;

  const paid = logs.every((l) => l.paidOn);
  if (paid) {
    const latest = logs.slice().sort((a, b) =>
      (b.paidAt || b.paidOn || "").localeCompare(a.paidAt || a.paidOn || ""))[0];
    return (
      <div className="mt-2 inline-flex flex-col items-end rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-right">
        <span className="text-[12px] font-bold uppercase tracking-wide text-emerald-300">Paid</span>
        <span className="text-[12px] text-emerald-100/70">{stamp(latest)}</span>
      </div>
    );
  }

  // Work has been submitted — the office checks the tracking before paying.
  return (
    <div className="mt-2 inline-flex flex-col items-end rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-right">
      <span className="text-[12px] font-bold uppercase tracking-wide text-amber-300">
        Awaiting verification of tracking
      </span>
      <span className="text-[12px] text-amber-100/70">paid once your links check out</span>
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 sm:px-4 sm:py-3">
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

export default function JobMarket({ workerName, only }: {
  workerName: string;
  /** Pin to one list so both can be shown at once on a wide screen. */
  only?: "available" | "mine";
}) {
  const [open, setOpen] = useState<ClientJob[]>([]);
  const [mine, setMine] = useState<ClientJob[]>([]);
  const [interest, setInterest] = useState<number[]>([]);
  const [contracts, setContracts] = useState<{ jobId: number; assignmentId: number | null; signedDate: string }[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [logs, setLogs] = useState<MyLog[]>([]);
  const [loading, setLoading] = useState(true);
  // Phones land on the work they already have; the wide layout shows both.
  const [tabState, setTab] = useState<"available" | "mine">("mine");
  const tab = only ?? tabState;
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [logging, setLogging] = useState<number | null>(null);
  const [editingLog, setEditingLog] = useState<EditableLog | null>(null);
  const [mapOpen, setMapOpen] = useState<number | null>(null);

  /** Take back an unpaid submission so it can be redone. */
  const unmark = async (logId: number) => {
    if (!window.confirm("Un-mark this work as done? You can submit it again afterwards.")) return;
    await fetch(`/api/portal/me/log?id=${logId}`, { method: "DELETE" });
    load();
  };
  // Phones get a shorter map so the rest of the card isn't pushed off-screen.
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const [viewing, setViewing] = useState<number | null>(null);
  const [shut, setShut] = useState<number[]>([]);
  const isShut = (id: number) => shut.includes(id);
  const toggleShut = (id: number) =>
    setShut((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  /** Reveal the contract for this job, then slide down to it. */
  const viewJob = (jobId: number) => {
    setViewing(jobId);
    setTimeout(() => {
      document.getElementById(`contract-${jobId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

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

  // Coming back from the printable agreement lands on that job, ready to sign.
  useEffect(() => {
    if (loading) return;
    const want = Number(new URLSearchParams(window.location.search).get("job"));
    if (!want) return;
    setTab("mine");
    setViewing(want);
    setTimeout(() => {
      document.getElementById(`contract-${want}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [loading]);

  const accept = async (jobId: number, assignmentId?: number | null) => {
    setBusyId(jobId);
    try {
      const r = await fetch("/api/portal/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", jobId, assignmentId }),
      });
      const d = await r.json().catch(() => ({ ok: false }));
      if (d.ok) {
        // Tell the office straight away. Web3Forms only accepts browser posts,
        // so this is sent from here rather than the API route.
        const job = [...mine, ...open].find((j) => j.id === jobId);
        const a = assignments.find((x) => x.job_id === jobId);
        submitForm(
          {
            Worker: workerName || "A worker",
            Job: job?.title || `Job #${jobId}`,
            Area: a?.area_note || job?.area || "\—",
            Leaflets: a?.leaflet_share ? a.leaflet_share.toLocaleString() : (job?.quantity?.toLocaleString() ?? "\—"),
            Pay: money(a?.pay ?? job?.worker_pay ?? null),
            Start: a?.start_date || "\—",
            Due: a?.due_date || "\—",
            Status: "Accepted \— contract drawn up, awaiting their signature",
          },
          { subject: `Job accepted \— ${workerName || "worker"} \— ${job?.title || `#${jobId}`}`, from_name: "Infinite Distribution Portal" },
        ).catch(() => {});
      }
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
    const q = window.prompt("What would you like to ask about this job?");
    if (q && q.trim()) act(jobId, "interest", q.trim());
  };

  const decline = (jobId: number) => {
    const why = window.prompt("Why are you passing on this one? (optional)") ?? "";
    act(jobId, "interest", `[declined] ${why}`.trim());
  };

  if (loading) {
    return <Loading label="Your jobs" />;
  }

  /**
   * A sub-contract is signed only when it was signed for itself. No falling
   * back to another agreement on the same job — a new piece of work always
   * goes through view, accept, sign and timesheet from scratch, even when the
   * same worker is already on that job.
   */
  const signedFor = (jobId: number, assignmentId?: number | null) =>
    contracts.find((c) => (assignmentId ? c.assignmentId === assignmentId : c.jobId === jobId && !c.assignmentId))
      ?.signedDate ?? null;
  const mineFor = (id: number) => assignments.find((a) => a.job_id === id) ?? null;

  /**
   * One card per sub-contract, not per job. A second sub-contract on a job the
   * worker is already on is a separate piece of work: its own agreement to
   * sign, its own tracking to submit. Unaccepted ones sort to the top so new
   * work is the first thing they see.
   */
  const entries = (() => {
    const out: { key: string; job: ClientJob; a: JobAssignment | null; part?: string }[] = [];
    for (const j of mine) {
      const parts = assignments.filter((x) => x.job_id === j.id);
      if (parts.length) parts.forEach((a) => out.push({ key: `a${a.id}`, job: j, a }));
      else out.push({ key: `j${j.id}`, job: j, a: null });
    }
    // Several parts of one job all carry the job's title, so number them.
    for (const e of out) {
      const siblings = out.filter((o) => o.job.id === e.job.id);
      if (siblings.length > 1) {
        (e as { part?: string }).part = `Part ${siblings.indexOf(e) + 1} of ${siblings.length}`;
      }
    }
    const rank = (e: { a: JobAssignment | null }) => (e.a?.status === "accepted" ? 1 : 0);
    return out.sort((x, y) => rank(x) - rank(y) || (y.a?.id ?? 0) - (x.a?.id ?? 0));
  })();
  const logsFor = (jobId: number, assignmentId?: number | null) =>
    logs.filter((l) => (assignmentId ? l.assignmentId === assignmentId : l.jobId === jobId && !l.assignmentId));

  return (
    <div>
      <div className={`mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 ${only ? "hidden" : ""}`}>
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
            <p className="mt-2 text-white/50">You can accept listed jobs here — anything available will show up in this list.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {open.map((j, i) => {
              const keen = interest.includes(j.id);
              const spec = parseSpec(j.boundary);
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

                    {specHasDrawing(spec) && (
                      <button onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                        className="mt-4 text-sm font-semibold text-orchid transition hover:text-white">
                        {expanded === j.id ? "Hide map" : "View delivery area map"}
                      </button>
                    )}
                    {expanded === j.id && (
                      <div className="mt-4"><BoundaryMap spec={spec} center={parseCenter(j.map_center)} height={340} /></div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() => act(j.id, keen ? "withdraw" : "interest")}
                        disabled={busyId === j.id}
                        className={`rounded-2xl px-6 py-3 font-display text-[15px] font-bold transition hover:-translate-y-0.5 disabled:opacity-50 ${busyId === j.id ? "idp-loading" : ""} ${
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
                    {keen && <p className="mt-2 text-[13px] text-white/40">Your response has been recorded — you&apos;ll be assigned the job if it&apos;s yours.</p>}
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )
      ) : !mine.length ? (
        <GlassCard className="p-14 text-center">
          <p className="font-display text-lg font-bold text-white">Nothing assigned yet</p>
          <p className="mt-2 text-white/50">Show interest in an available job and it&apos;ll be assigned to you.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {entries.map(({ key, job: j, a, part }) => {
            const own = parseSpec(a?.boundary ?? null);
            const spec = specHasDrawing(own) ? own : parseSpec(j.boundary);
            const signed = signedFor(j.id, a?.id);
            const accepted = a?.status === "accepted" || Boolean(signed);
            const shifts = logsFor(j.id, a?.id);
            const cardId = a?.id ?? j.id;
            return (
              <div key={key} className="rounded-[22px] border border-white/10 bg-white/[0.02] p-1.5 sm:rounded-[26px] sm:p-3">
                {!accepted && (
                  <div className="mb-2 overflow-hidden rounded-[20px] border border-orchid/40 bg-gradient-to-br from-electric/25 to-orchid/20 p-6 sm:p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">New job for you</p>
                    <h3 className="mt-2 font-display text-[clamp(1.5rem,4.5vw,2rem)] font-extrabold leading-tight tracking-tight text-white">
                      {j.title || `Job #${j.id}`}
                      {a?.area_note ? <span className="text-white/65"> — {a.area_note}</span> : null}
                    </h3>
                    {part && (
                      <p className="mt-1 text-[13px] font-bold uppercase tracking-wide text-orchid">{part} — sign this one separately</p>
                    )}
                    <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/65">
                      Have a look at the agreement — the pay, hours and dates are already filled in. You can
                      accept it once you&apos;ve read it through and signed.
                    </p>
                    <button onClick={() => viewJob(cardId)}
                      className="mt-5 w-full rounded-2xl bg-white px-8 py-4 font-display text-[16px] font-extrabold text-ink shadow-[0_18px_44px_-14px_rgba(255,255,255,0.5)] transition hover:-translate-y-0.5 sm:w-auto">
                      {viewing === cardId ? "Agreement below ↓" : "View job →"}
                    </button>
                  </div>
                )}
                <GlassCard className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-bold text-white">
                        {j.title || `Job #${j.id}`}
                        {a?.area_note ? <span className="text-white/55"> — {a.area_note}</span> : null}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/50">
                        {part && (
                          <span className="rounded-md bg-orchid/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-orchid">
                            {part}
                          </span>
                        )}
                        {a?.leaflet_share ? `${a.leaflet_share.toLocaleString()} leaflets` : j.area || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl font-extrabold text-emerald-300">
                        {money(mineFor(j.id)?.pay ?? j.worker_pay)}
                      </p>
                      <PayState logs={shifts} accepted={accepted} />
                      <button onClick={() => toggleShut(cardId)}
                        className="mt-2 flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-bold text-white/60 transition hover:bg-white/[0.1] hover:text-white">
                        {isShut(cardId) ? "Expand" : "Collapse"}
                        <span className={`transition-transform ${isShut(cardId) ? "" : "rotate-180"}`}>▾</span>
                      </button>
                    </div>
                  </div>
                  {!isShut(cardId) && (
                  <div className="mt-5"><BriefWithCountdown job={j} mine={a} /></div>
                  )}
                  {!isShut(cardId) && specHasDrawing(spec) && (
                    <div className="mt-5">
                      <button onClick={() => setMapOpen(mapOpen === cardId ? null : cardId)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.08]">
                        <span>
                          <span className="block text-[14px] font-bold text-white">Your delivery area</span>
                          <span className="mt-0.5 block text-[12px] text-white/45">Zoom, pan and see where you are</span>
                        </span>
                        <span className={`shrink-0 text-white/40 transition-transform ${mapOpen === cardId ? "rotate-180" : ""}`}>▾</span>
                      </button>
                      {mapOpen === cardId && (
                      <div className="mt-2">
                      <BoundaryMap spec={spec} center={parseCenter(a?.map_center ?? j.map_center)} height={phone ? 260 : 400} locate />
                      </div>
                      )}
                    </div>
                  )}
                  {!isShut(cardId) && shifts.length > 0 && (
                    <div className="mt-5">
                      <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">
                        Your shifts on this job ({shifts.length})
                      </p>
                      <div className="space-y-2">
                        {shifts.map((l) => (
                          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
                            <span className="text-[13px] text-white/70">
                              {new Date(l.startedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                              {l.timeSpent ? ` · ${l.timeSpent}` : ""}
                              {l.leaflets ? ` · ${l.leaflets.toLocaleString()} leaflets` : ""}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                                l.paidOn ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                                {l.paidOn ? `Paid ${stamp(l)}` : "Awaiting verification"}
                              </span>
                              {!l.paidOn && (
                                <button onClick={() => { setLogging(null); setEditingLog(l as EditableLog); }}
                                  className="text-[12px] font-bold text-orchid transition hover:text-white">
                                  Edit
                                </button>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!isShut(cardId) && a?.map_image && (
                    <div className="mt-5">
                      <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Your area diagram</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mineFor(j.id)!.map_image!} alt="Area diagram for your section"
                        className="w-full rounded-2xl border border-white/12" />
                    </div>
                  )}
                </GlassCard>

                {!isShut(cardId) && (accepted || viewing === cardId) && (
                  <div id={`contract-${cardId}`} className="mt-2 space-y-2 border-l-2 border-orchid/35 pl-3 sm:pl-4">
                    <p className="pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/30">
                      For {j.title || `Job #${j.id}`}
                    </p>
                    <JobContract job={j} workerName={workerName} signedDate={signed} mine={a}
                      autoOpen={viewing === cardId && !signed}
                      onClose={accepted ? undefined : () => setViewing(null)}
                      onSigned={() => { setViewing(null); load(); }} />
                    {signed && (
                      <div>
                        {shifts.length === 0 ? (
                          <button onClick={() => setLogging(logging === cardId ? null : cardId)}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-orchid/40 bg-gradient-to-r from-electric/20 to-orchid/15 px-5 py-4 text-left transition hover:from-electric/30 hover:to-orchid/25">
                            <span>
                              <span className="block font-display text-[15px] font-bold text-white">Mark work as done</span>
                              <span className="mt-0.5 block text-[13px] text-white/55">
                                Upload your hours, leaflets and tracking links
                              </span>
                            </span>
                            <span className={`shrink-0 text-white/40 transition-transform ${logging === cardId ? "rotate-180" : ""}`}>▾</span>
                          </button>
                        ) : (
                          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] px-5 py-4">
                            <p className="font-display text-[15px] font-bold text-emerald-200">Marked as done</p>
                            <p className="mt-1 text-[13px] text-emerald-100/65">
                              {shifts.some((l) => l.paidOn)
                                ? "This has been paid, so it's settled."
                                : "Waiting on your tracking being checked. You can still change it."}
                            </p>
                            {!shifts.some((l) => l.paidOn) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button onClick={() => { setLogging(null); setEditingLog(shifts[0] as EditableLog); }}
                                  className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.12]">
                                  Edit or add links
                                </button>
                                <button onClick={() => unmark(shifts[0].id)}
                                  className="rounded-xl border border-rose-400/30 px-4 py-2 text-[13px] font-bold text-rose-300 transition hover:bg-rose-500/10">
                                  Un-mark as done
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {logging === cardId && (
                          <div className="mt-2">
                            <WorkLogForm job={j} mine={a} signedDate={signed}
                              onDone={() => { setLogging(null); load(); }}
                              onCancel={() => setLogging(null)} />
                          </div>
                        )}
                        {editingLog && shifts.some((l) => l.id === editingLog.id) && (
                          <div className="mt-2">
                            <WorkLogForm job={j} mine={a} editing={editingLog}
                              onDone={() => { setEditingLog(null); load(); }}
                              onCancel={() => setEditingLog(null)} />
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
