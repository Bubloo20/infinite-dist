"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PortalBackdrop, PortalMark, GlassCard, Loading } from "@/components/portal/PortalShell";
import BoundaryMap, { parseSpec, specHasDrawing } from "@/components/portal/BoundaryMap";
import JobContract from "@/components/portal/JobContract";
import WorkLogForm, { type EditableLog } from "@/components/portal/WorkLogForm";
import JobTracker from "@/components/portal/JobTracker";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";
import { tidyHours } from "@/lib/portal/text";

type MyLog = {
  id: number; jobId: number | null; assignmentId: number | null; jobNumber: string;
  startedAt: string; endedAt: string; timeSpent: string | null;
  leaflets: number | null; amount: string | null;
  paidOn: string | null; paidAt: string | null; verifiedAt: string | null;
  areaWorked: string | null; notes: string | null;
  stravaUrls: string | null; mapmyUrls: string | null;
};

const money = (v: string | null) => (v ? `$${Number(v).toFixed(2)}` : "—");
const shortDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) : "—";
const parseCenter = (s: string | null): [number, number, number] | null => {
  if (!s) return null;
  try { const v = JSON.parse(s); return Array.isArray(v) && v.length === 3 ? (v as [number, number, number]) : null; } catch { return null; }
};

/**
 * One piece of work, on its own page.
 *
 * Reading the agreement, signing it and submitting the tracking all need room,
 * and doing them inside a card in a three-column dashboard left almost none.
 */
export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const assignmentId = Number(id);

  const [job, setJob] = useState<ClientJob | null>(null);
  const [mine, setMine] = useState<JobAssignment | null>(null);
  const [signedDate, setSignedDate] = useState<string | null>(null);
  const [logs, setLogs] = useState<MyLog[]>([]);
  const [workerName, setWorkerName] = useState("");
  const [state, setState] = useState<"loading" | "ok" | "gone">("loading");
  const [logging, setLogging] = useState(false);
  const [editingLog, setEditingLog] = useState<EditableLog | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/portal/jobs").then((r) => r.json()),
      fetch("/api/portal/session").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([d, sess]) => {
        if (!d.ok) { setState("gone"); return; }
        const a = (d.assignments || []).find((x: JobAssignment) => x.id === assignmentId) ?? null;
        const j = (d.mine || []).find((x: ClientJob) => x.id === a?.job_id) ?? null;
        if (!a || !j) { setState("gone"); return; }
        setMine(a);
        setJob(j);
        setWorkerName(sess.fullName || "");
        setSignedDate(
          (d.contracts || []).find((c: { assignmentId: number | null }) => c.assignmentId === a.id)?.signedDate ?? null,
        );
        setLogs((d.logs || []).filter((l: MyLog) => l.assignmentId === a.id));
        setState("ok");
      })
      .catch(() => setState("gone"));
  }, [assignmentId]);

  useEffect(load, [load]);

  const accept = async () => {
    if (!job) return;
    setBusy(true);
    try {
      await fetch("/api/portal/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", jobId: job.id, assignmentId }),
      });
      load();
    } finally { setBusy(false); }
  };

  if (state === "loading") {
    return (
      <main className="relative min-h-[100svh]">
        <PortalBackdrop />
        <div className="relative z-10 grid min-h-[100svh] place-items-center"><Loading label="Your job" /></div>
      </main>
    );
  }

  if (state === "gone" || !job || !mine) {
    return (
      <main className="relative min-h-[100svh]">
        <PortalBackdrop />
        <div className="relative z-10 grid min-h-[100svh] place-items-center px-6 text-center">
          <div>
            <p className="font-display text-xl font-bold text-white">This work isn&apos;t yours</p>
            <p className="mt-2 text-white/50">It may have been reassigned or removed.</p>
            <Link href="/portal" className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-3 font-display text-[15px] font-bold text-white">
              Back to your work
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const own = parseSpec(mine.boundary);
  const spec = specHasDrawing(own) ? own : parseSpec(job.boundary);
  const accepted = mine.status === "accepted" || Boolean(signedDate);
  const paid = logs.length > 0 && logs.every((l) => l.paidOn);

  const facts: [string, string][] = [
    ["Your area", mine.area_note || job.area || "—"],
    ["Your leaflets", mine.leaflet_share ? mine.leaflet_share.toLocaleString() : "—"],
    ["Your pay", money(mine.pay ?? job.worker_pay)],
    ["Minimum hours", tidyHours(mine.min_hours || job.min_hours) || "—"],
    ["Allocated time", mine.start_date || mine.due_date
      ? `${shortDate(mine.start_date)} – ${shortDate(mine.due_date)}`
      : mine.allocated_time || job.allocated_time || "—"],
  ];

  return (
    <main className="relative min-h-[100svh]">
      <PortalBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <PortalMark small />
          <Link href="/portal" className="text-sm font-semibold text-white/45 transition hover:text-white">
            ← All your work
          </Link>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">
          {accepted ? (paid ? "Completed" : "Your job") : "New job for you"}
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3rem)] font-extrabold leading-[1.05] tracking-tight text-white">
          {/* Their own name for this piece — the job's title is the office's. */}
          {mine.title?.trim() || mine.area_note?.trim() || job.area?.trim() || `Job #${job.id}`}
        </h1>

        <GlassCard className="mt-7 p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">{k}</p>
                <p className="mt-0.5 font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>

          {specHasDrawing(spec) && (
            <div className="mt-5">
              <button onClick={() => setMapOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.08]">
                <span>
                  <span className="block text-[14px] font-bold text-white">Your delivery area</span>
                  <span className="mt-0.5 block text-[12px] text-white/45">Zoom, pan and see where you are</span>
                </span>
                <span className={`shrink-0 text-white/40 transition-transform ${mapOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {mapOpen && (
                <div className="mt-2">
                  <BoundaryMap spec={spec} center={parseCenter(mine.map_center ?? job.map_center)} height={420} locate
                    fullHref={`/portal/job/${assignmentId}/map`} />
                </div>
              )}
            </div>
          )}

          {mine.map_image && (
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Your area diagram</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mine.map_image} alt="Area diagram for your section" className="w-full rounded-2xl border border-white/12" />
            </div>
          )}
        </GlassCard>

        {!accepted && (
          <GlassCard className="mt-4 border-orchid/40 bg-gradient-to-br from-electric/20 to-orchid/15 p-6 sm:p-7">
            <p className="max-w-2xl text-[15px] leading-relaxed text-white/75">
              Read the agreement below, fill in the days you&apos;ll work and sign it. Accepting is the last
              step — it&apos;s enabled once everything above it is done.
            </p>
            <button onClick={accept} disabled={busy}
              className="mt-4 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 font-display text-[14px] font-bold text-white transition hover:bg-white/20 disabled:opacity-50">
              {busy ? "…" : "Take this job now (sign below to confirm)"}
            </button>
          </GlassCard>
        )}

        <div className="mt-4">
          <JobContract job={job} workerName={workerName} signedDate={signedDate} mine={mine} onSigned={load} />
        </div>

        {/* Once they've signed, they can start the shift and be checked against
            the area as they walk. */}
        {signedDate && !paid && (
          <div className="mt-4">
            <JobTracker assignmentId={assignmentId} spec={spec} onFinished={load} />
          </div>
        )}

        {signedDate && (
          <div className="mt-4">
            {logs.length === 0 ? (
              <>
                <button onClick={() => setLogging((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-orchid/40 bg-gradient-to-r from-electric/20 to-orchid/15 px-5 py-4 text-left transition hover:from-electric/30 hover:to-orchid/25">
                  <span>
                    <span className="block font-display text-[15px] font-bold text-white">Mark work as done</span>
                    <span className="mt-0.5 block text-[13px] text-white/55">Upload your hours, leaflets and tracking links</span>
                  </span>
                  <span className={`shrink-0 text-white/40 transition-transform ${logging ? "rotate-180" : ""}`}>▾</span>
                </button>
                {logging && (
                  <div className="mt-2">
                    <WorkLogForm job={job} mine={mine} signedDate={signedDate}
                      onDone={() => { setLogging(false); load(); }} onCancel={() => setLogging(false)} />
                  </div>
                )}
              </>
            ) : (
              <GlassCard className="border-emerald-400/25 bg-emerald-500/[0.06] p-5 sm:p-6">
                <p className="font-display text-lg font-bold text-emerald-200">Marked as done</p>
                <p className="mt-1 text-[13px] text-emerald-100/65">
                  {paid ? "This has been paid, so it's settled."
                        : logs.some((l) => l.verifiedAt) ? "Tracking checked — waiting on payment."
                        : "Waiting on your tracking being checked. You can still change it."}
                </p>
                {!paid && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setEditingLog(logs[0] as unknown as EditableLog)}
                      className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.12]">
                      Edit or add links
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm("Un-mark this work as done? You can submit it again afterwards.")) return;
                        await fetch(`/api/portal/me/log?id=${logs[0].id}`, { method: "DELETE" });
                        load();
                      }}
                      className="rounded-xl border border-rose-400/30 px-4 py-2 text-[13px] font-bold text-rose-300 transition hover:bg-rose-500/10">
                      Un-mark as done
                    </button>
                  </div>
                )}
              </GlassCard>
            )}

            {editingLog && (
              <div className="mt-2">
                <WorkLogForm job={job} mine={mine} editing={editingLog}
                  onDone={() => { setEditingLog(null); load(); }} onCancel={() => setEditingLog(null)} />
              </div>
            )}
          </div>
        )}

        <button onClick={() => router.push("/portal")}
          className="mt-6 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-6 py-3.5 font-display text-[14px] font-bold text-white/60 transition hover:bg-white/[0.1] hover:text-white">
          Back to all your work
        </button>
      </div>
    </main>
  );
}
