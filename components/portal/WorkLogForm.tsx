"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./PortalShell";
import { parseStravaUrl, type StravaStatus } from "@/lib/portal/strava";
import { submitForm } from "@/lib/forms";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";

type Check = { status: StravaStatus | "checking" | "idle"; message: string };

const inputCls =
  "w-full rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3.5 text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-orchid/15 [color-scheme:dark]";

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">
        {label} {required && <span className="text-orchid">*</span>}
      </label>
      {children}
      {hint && <p className="mt-2 text-[13px] text-white/35">{hint}</p>}
    </div>
  );
}

function duration(start: string, end: string): string {
  if (!start || !end) return "";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Logging a shift. Passed a `job`, it becomes that job's own log form —
 * the job number and area are already filled in and the entry is filed against it.
 */
export default function WorkLogForm({ onDone, job, mine }: {
  onDone?: () => void;
  job?: ClientJob | null;
  mine?: JobAssignment | null;
}) {
  const jobRef = job ? job.job_number || `JOB-${job.id}` : "";
  const [jobNumber, setJobNumber] = useState(jobRef);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [leafletCount, setLeafletCount] = useState("");
  const [areaWorked, setAreaWorked] = useState(job ? mine?.area_note || job.area || "" : "");
  const [stravaUrls, setStravaUrls] = useState<string[]>([""]);
  const [mapmyUrls, setMapmyUrls] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");

  const [checks, setChecks] = useState<Record<number, Check>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { emailed: boolean; stored: boolean }>(null);

  const autoTime = useMemo(() => duration(startedAt, endedAt), [startedAt, endedAt]);
  const timeSpent = manualTime || autoTime;

  // Debounced live Strava check per link.
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    stravaUrls.forEach((url, i) => {
      if (!url.trim()) {
        setChecks((c) => ({ ...c, [i]: { status: "idle", message: "" } }));
        return;
      }
      const shape = parseStravaUrl(url);
      if (!shape.ok) {
        setChecks((c) => ({ ...c, [i]: { status: "invalid-format", message: shape.message } }));
        return;
      }
      setChecks((c) => ({ ...c, [i]: { status: "checking", message: "Checking with Strava…" } }));
      timers.push(
        setTimeout(async () => {
          try {
            const res = await fetch("/api/portal/strava-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url, startedAt, endedAt }),
            });
            const d = await res.json();
            setChecks((c) => ({ ...c, [i]: { status: d.status, message: d.message } }));
          } catch {
            setChecks((c) => ({ ...c, [i]: { status: "unverified", message: "Couldn't reach Strava." } }));
          }
        }, 700),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [stravaUrls, startedAt, endedAt]);

  const setAt = (arr: string[], i: number, v: string) => arr.map((x, k) => (k === i ? v : x));
  const blocked = Object.values(checks).some((c) => c.status === "invalid-format" || c.status === "not-found");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const cleanStrava = stravaUrls.map((u) => u.trim()).filter(Boolean);
      const cleanMapmy = mapmyUrls.map((u) => u.trim()).filter(Boolean);

      const res = await fetch("/api/portal/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobNumber, startedAt, endedAt, timeSpent,
          leafletCount, areaWorked, clientJobId: job?.id ?? null,
          stravaUrls: cleanStrava, mapmyUrls: cleanMapmy, notes,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Something went wrong.");
        setBusy(false);
        return;
      }

      // Web3Forms only accepts browser-side posts on the free plan.
      const emailed = await submitForm(
        {
          Worker: data.workerName || "—",
          "Job number": jobNumber,
          Area: areaWorked || "—",
          Started: new Date(startedAt).toLocaleString("en-AU"),
          Finished: new Date(endedAt).toLocaleString("en-AU"),
          "Time spent": timeSpent || "—",
          Leaflets: leafletCount || "—",
          "Strava links": cleanStrava.join("  |  "),
          "Map My Activity": cleanMapmy.join("  |  ") || "—",
          Notes: notes || "—",
        },
        { subject: `Work log — ${data.workerName} — job ${jobNumber}`, from_name: "Infinite Distribution Portal" },
      );

      setDone({ emailed, stored: Boolean(data.stored) });
      onDone?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setJobNumber(jobRef); setStartedAt(""); setEndedAt(""); setManualTime("");
    setLeafletCount(""); setAreaWorked(job ? mine?.area_note || job.area || "" : "");
    setStravaUrls([""]); setMapmyUrls([""]);
    setNotes(""); setChecks({}); setDone(null);
  };

  if (done && job) {
    return (
      <GlassCard className="border-emerald-400/25 bg-emerald-500/[0.06] p-6">
        <p className="font-display text-lg font-bold text-emerald-200">Shift logged</p>
        <p className="mt-1.5 text-sm text-emerald-100/70">
          {done.stored ? "Saved against this job — it'll show in your earnings." : "Sent to the office, but not saved to the database."}
          {done.emailed ? " The office has been emailed." : ""}
        </p>
        <button onClick={reset}
          className="mt-4 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 px-5 py-2.5 font-display text-[14px] font-bold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-white">
          Log another shift on this job
        </button>
      </GlassCard>
    );
  }

  if (done) {
    return (
      <GlassCard className="p-10 text-center sm:p-14">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_18px_50px_-16px_rgba(16,185,129,0.9)]">
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
        </motion.div>
        <h2 className="mt-7 font-display text-3xl font-extrabold tracking-tight text-white">Work log submitted</h2>
        <div className="mx-auto mt-7 flex max-w-sm flex-col gap-2 text-left text-sm">
          <span className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/70">
            <span className={done.emailed ? "text-emerald-400" : "text-amber-400"}>●</span>
            {done.emailed ? "Emailed to the office" : "Email failed — the office still has your entry"}
          </span>
          <span className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/70">
            <span className={done.stored ? "text-emerald-400" : "text-amber-400"}>●</span>
            {done.stored ? "Saved — it'll show in your earnings" : "Not saved to the database"}
          </span>
        </div>
        <button onClick={reset} className="mt-8 rounded-2xl bg-gradient-to-r from-electric to-orchid px-7 py-3.5 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5">
          Log another shift
        </button>
      </GlassCard>
    );
  }

  return (
    <form onSubmit={submit}>
      <GlassCard className={job ? "p-6 sm:p-7" : "p-7 sm:p-10"}>
        {job && (
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">Log your work</p>
            <h3 className="mt-2 font-display text-xl font-extrabold tracking-tight text-white">
              Hours and leaflets for this job
            </h3>
            <p className="mt-1.5 text-[14px] text-white/50">
              Fill in the times you actually worked, how many leaflets went out and your tracking links.
              Log as many shifts as you need — one for each time you go out.
            </p>
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Job number" hint={job ? "Set by the office for this job." : "Optional."}>
            <input className={`${inputCls} ${job ? "cursor-not-allowed opacity-60" : ""}`} value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)} placeholder="e.g. JOB-1042" readOnly={Boolean(job)} />
          </Field>
          <Field label="Area worked" hint="Suburb or streets covered.">
            <input className={inputCls} value={areaWorked} onChange={(e) => setAreaWorked(e.target.value)} placeholder="e.g. Northcote — High St" />
          </Field>

          <Field label="Started work" required>
            <input type="datetime-local" className={inputCls} value={startedAt} onChange={(e) => setStartedAt(e.target.value)} required />
          </Field>
          <Field label="Finished work" required>
            <input type="datetime-local" className={inputCls} value={endedAt} onChange={(e) => setEndedAt(e.target.value)} required />
          </Field>

          <Field label="Time spent working" hint={autoTime ? "Calculated for you — edit if it differs." : "Fills in from your start and finish times."}>
            <div className="relative">
              <input className={inputCls} value={manualTime || autoTime} onChange={(e) => setManualTime(e.target.value)} placeholder="e.g. 2h 30m" />
              {autoTime && !manualTime && (
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300">Auto</span>
              )}
            </div>
          </Field>
          <Field label="Leaflets delivered"
            hint={mine?.leaflet_share ? `How many went out on this run — you're allocated ${mine.leaflet_share.toLocaleString()} in total.` : "How many went out on this run."}>
            <input className={inputCls} value={leafletCount} onChange={(e) => setLeafletCount(e.target.value)} placeholder="e.g. 450" inputMode="numeric" />
          </Field>

          {/* Strava links — at least one required */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">
              Strava activity links <span className="text-orchid">*</span>
            </label>
            <div className="space-y-3">
              {stravaUrls.map((url, i) => {
                const c = checks[i];
                return (
                  <div key={i}>
                    <div className="flex gap-2">
                      <input
                        className={inputCls}
                        value={url}
                        onChange={(e) => setStravaUrls((a) => setAt(a, i, e.target.value))}
                        placeholder="https://www.strava.com/activities/1234567890"
                        inputMode="url"
                        required={i === 0}
                      />
                      {stravaUrls.length > 1 && (
                        <button type="button" onClick={() => setStravaUrls((a) => a.filter((_, k) => k !== i))} aria-label="Remove link"
                          className="shrink-0 rounded-2xl border border-white/12 px-4 text-white/45 transition hover:bg-white/[0.07] hover:text-white">×</button>
                      )}
                    </div>
                    <AnimatePresence>
                      {c && c.status !== "idle" && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`mt-2 rounded-xl border px-4 py-2.5 text-[13px] ${
                            c.status === "valid" ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                            : c.status === "invalid-format" || c.status === "not-found" ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
                            : c.status === "checking" ? "border-white/12 bg-white/[0.04] text-white/60"
                            : "border-amber-400/25 bg-amber-500/10 text-amber-200"}`}>
                          {c.message}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => setStravaUrls((a) => [...a, ""])}
              className="mt-3 text-sm font-semibold text-orchid transition hover:text-white">+ Add another Strava link</button>
          </div>

          {/* Map My Activity — optional, multiple */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Map My Walk / Run links</label>
            <div className="space-y-3">
              {mapmyUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input className={inputCls} value={url} onChange={(e) => setMapmyUrls((a) => setAt(a, i, e.target.value))}
                    placeholder="https://www.mapmywalk.com/workout/…" inputMode="url" />
                  {mapmyUrls.length > 1 && (
                    <button type="button" onClick={() => setMapmyUrls((a) => a.filter((_, k) => k !== i))} aria-label="Remove link"
                      className="shrink-0 rounded-2xl border border-white/12 px-4 text-white/45 transition hover:bg-white/[0.07] hover:text-white">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setMapmyUrls((a) => [...a, ""])}
              className="mt-3 text-sm font-semibold text-orchid transition hover:text-white">+ Add another Map My link</button>
            <p className="mt-2 text-[13px] text-white/35">Optional.</p>
          </div>

          <div className="sm:col-span-2">
            <Field label="Notes" hint="Optional — anything the office should know.">
              <textarea className={`${inputCls} resize-none`} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access issues, missed streets, weather…" />
            </Field>
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</motion.p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy || blocked}
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-electric to-orchid px-8 py-4 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0">
            {busy ? "Submitting…" : "Submit work log"}
          </button>
          {blocked && <span className="text-sm text-rose-300/80">Fix the Strava link(s) to submit.</span>}
        </div>
      </GlassCard>
    </form>
  );
}
