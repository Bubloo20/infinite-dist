"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./PortalShell";
import BoundaryMap, { type LatLng } from "./BoundaryMap";
import JobContract from "./JobContract";
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
        ["Minimum hours", job.min_hours || "—"],
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

export default function JobMarket({ workerName }: { workerName: string }) {
  const [open, setOpen] = useState<ClientJob[]>([]);
  const [mine, setMine] = useState<ClientJob[]>([]);
  const [interest, setInterest] = useState<number[]>([]);
  const [contracts, setContracts] = useState<{ jobId: number; signedDate: string }[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"available" | "mine">("available");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/portal/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setOpen(d.open || []); setMine(d.mine || []);
        setInterest(d.interest || []); setContracts(d.contracts || []);
        setAssignments(d.assignments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

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
                      <p className="font-display text-2xl font-extrabold text-emerald-300">{money(j.worker_pay)}</p>
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
            const pts = parsePts(j.boundary);
            return (
              <div key={j.id} className="space-y-4">
                <GlassCard className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">{j.title || `Job #${j.id}`}</h3>
                      <p className="mt-1 text-sm text-white/50">{j.area || "—"}</p>
                    </div>
                    <p className="font-display text-2xl font-extrabold text-emerald-300">{money(j.worker_pay)}</p>
                  </div>
                  <div className="mt-5"><Brief job={j} mine={mineFor(j.id)} /></div>
                  {pts.length >= 3 && (
                    <div className="mt-5">
                      <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Delivery area — zoom and pan</p>
                      <BoundaryMap boundary={pts} center={parseCenter(j.map_center)} height={400} />
                    </div>
                  )}
                </GlassCard>

                <JobContract job={j} workerName={workerName} signedDate={signedFor(j.id)} mine={mineFor(j.id)} onSigned={load} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
