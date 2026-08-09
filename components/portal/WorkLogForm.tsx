"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./PortalShell";
import { parseStravaUrl, type StravaStatus } from "@/lib/portal/strava";
import { submitForm } from "@/lib/forms";

type CheckState = { status: StravaStatus | "checking" | "idle"; message: string };

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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

const inputCls =
  "w-full rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3.5 text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-orchid/15 [color-scheme:dark]";

/** Human-readable gap between two datetime-local values. */
function duration(start: string, end: string): string {
  if (!start || !end) return "";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default function WorkLogForm({ onSignOut }: { onSignOut: () => void }) {
  const [workerName, setWorkerName] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [stravaUrl, setStravaUrl] = useState("");
  const [mapmyUrl, setMapmyUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [check, setCheck] = useState<CheckState>({ status: "idle", message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { emailed: boolean; stored: boolean }>(null);

  const autoTime = useMemo(() => duration(startedAt, endedAt), [startedAt, endedAt]);
  const timeSpent = manualTime || autoTime;

  // Remember the worker's name between submissions on this device.
  useEffect(() => {
    const saved = localStorage.getItem("idp_worker_name");
    if (saved) setWorkerName(saved);
  }, []);

  // Debounced live Strava check.
  useEffect(() => {
    if (!stravaUrl.trim()) {
      setCheck({ status: "idle", message: "" });
      return;
    }
    const shape = parseStravaUrl(stravaUrl);
    if (!shape.ok) {
      setCheck({ status: "invalid-format", message: shape.message });
      return;
    }
    setCheck({ status: "checking", message: "Checking with Strava…" });
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/portal/strava-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: stravaUrl }),
        });
        const data = await res.json();
        setCheck({ status: data.status, message: data.message });
      } catch {
        setCheck({ status: "unverified", message: "Link format is valid (couldn't reach Strava)." });
      }
    }, 700);
    return () => clearTimeout(t);
  }, [stravaUrl]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/portal/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerName,
          jobNumber,
          startedAt,
          endedAt,
          timeSpent,
          stravaUrl,
          mapmyUrl,
          notes,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }

      // Web3Forms only accepts browser-side posts on the free plan, so the
      // email goes out from here rather than the API route.
      const emailed = await submitForm(
        {
          Worker: workerName,
          "Job number": jobNumber,
          Started: new Date(startedAt).toLocaleString("en-AU"),
          Finished: new Date(endedAt).toLocaleString("en-AU"),
          "Time spent": timeSpent || "—",
          "Strava activity": data.strava?.normalisedUrl || stravaUrl,
          "Strava check": data.strava?.status || "—",
          "Map My Activity": mapmyUrl || "—",
          Notes: notes || "—",
        },
        { subject: `Work log — ${workerName} — job ${jobNumber}`, from_name: "Infinite Distributions Portal" },
      );

      localStorage.setItem("idp_worker_name", workerName);
      setDone({ emailed, stored: Boolean(data.stored) });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setJobNumber("");
    setStartedAt("");
    setEndedAt("");
    setManualTime("");
    setStravaUrl("");
    setMapmyUrl("");
    setNotes("");
    setCheck({ status: "idle", message: "" });
    setDone(null);
  };

  const blocked = check.status === "invalid-format" || check.status === "not-found";

  if (done) {
    return (
      <GlassCard className="p-10 text-center sm:p-14">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_18px_50px_-16px_rgba(16,185,129,0.9)]"
        >
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h2 className="mt-7 font-display text-3xl font-extrabold tracking-tight text-white">Work log submitted</h2>
        <p className="mt-3 text-white/60">Thanks {workerName.split(" ")[0]} — your shift has been recorded.</p>
        <div className="mx-auto mt-7 flex max-w-sm flex-col gap-2 text-left text-sm">
          <span className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/70">
            <span className={done.emailed ? "text-emerald-400" : "text-amber-400"}>●</span>
            {done.emailed ? "Emailed to the office" : "Email couldn't be sent — the office still has your entry"}
          </span>
          <span className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/70">
            <span className={done.stored ? "text-emerald-400" : "text-amber-400"}>●</span>
            {done.stored ? "Saved to the work-log database" : "Database not connected yet — sent by email only"}
          </span>
        </div>
        <button
          onClick={reset}
          className="mt-8 rounded-2xl bg-gradient-to-r from-electric to-orchid px-7 py-3.5 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5"
        >
          Log another shift
        </button>
      </GlassCard>
    );
  }

  return (
    <form onSubmit={submit}>
      <GlassCard className="p-7 sm:p-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Your name" required>
            <input className={inputCls} value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="Sam Rhoades" required />
          </Field>
          <Field label="Job number" required>
            <input className={inputCls} value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} placeholder="e.g. JOB-1042" required />
          </Field>

          <Field label="Started work" required>
            <input type="datetime-local" className={inputCls} value={startedAt} onChange={(e) => setStartedAt(e.target.value)} required />
          </Field>
          <Field label="Finished work" required>
            <input type="datetime-local" className={inputCls} value={endedAt} onChange={(e) => setEndedAt(e.target.value)} required />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Time spent working" hint={autoTime ? "Calculated from your start and finish times — edit if it differs." : "Fill in your start and finish times and this fills itself in."}>
              <div className="relative">
                <input
                  className={inputCls}
                  value={manualTime || autoTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  placeholder="e.g. 2h 30m"
                />
                {autoTime && !manualTime && (
                  <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                    Auto
                  </span>
                )}
              </div>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Strava activity link" required hint="Open the activity in Strava and copy the URL — strava.com/activities/…">
              <input
                className={inputCls}
                value={stravaUrl}
                onChange={(e) => setStravaUrl(e.target.value)}
                placeholder="https://www.strava.com/activities/1234567890"
                inputMode="url"
                required
              />
            </Field>
            <AnimatePresence>
              {check.status !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
                    check.status === "valid"
                      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                      : check.status === "invalid-format" || check.status === "not-found"
                        ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
                        : check.status === "checking"
                          ? "border-white/12 bg-white/[0.04] text-white/60"
                          : "border-amber-400/25 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {check.status === "valid" ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                    ) : check.status === "checking" ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></svg>
                    )}
                  </span>
                  {check.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="sm:col-span-2">
            <Field label="Map My Activity link" hint="Optional — MapMyRun, MapMyRide or MapMyWalk.">
              <input className={inputCls} value={mapmyUrl} onChange={(e) => setMapmyUrl(e.target.value)} placeholder="https://www.mapmyrun.com/workout/…" inputMode="url" />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Notes" hint="Optional — anything the office should know about this run.">
              <textarea className={`${inputCls} resize-none`} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access issues, missed streets, weather…" />
            </Field>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></svg>
            {error}
          </motion.p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy || blocked}
            className="group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-electric to-orchid px-8 py-4 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            {busy ? "Submitting…" : "Submit work log"}
            {!busy && (
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            )}
          </button>
          {blocked && <span className="text-sm text-rose-300/80">Fix the Strava link to submit.</span>}
          <button type="button" onClick={onSignOut} className="ml-auto text-sm font-semibold text-white/40 transition hover:text-white/80">
            Sign out
          </button>
        </div>
      </GlassCard>
    </form>
  );
}
