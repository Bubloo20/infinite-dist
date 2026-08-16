"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard } from "./PortalShell";
import { submitForm } from "@/lib/forms";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";

/** Terms transcribed from the Independent Contractor Agreement. */
export const CONTRACT_TERMS = [
  "The contractor agrees to complete the leaflet distribution job within the allocated time stated above.",
  "Contractor must provide a clear schedule of their time to be spent on the job and must inform when starting an activity, pausing or finishing.",
  "Failure to start on time (40 minute window) or start on scheduled days may result in a penalty such as a reduction in pay (5%) per day missed.",
  "Contractor must work the minimum hours stated above, and cover the job area/distance.",
  "Payment will be made within 1 week after Infinite Distribution verifies the tracking data.",
  "The contractor must use the tracking apps specified by Infinite Distribution: MAP MY WALK & STRAVA.",
  "Failure to use both correct apps, failure to track the walk, or suspicious activity such as letting the activity run while stationary or in a vehicle, results in no payment.",
  "If complaints of leaflets being placed in junk mail, or multiple leaflets in a single mailbox, are received: each complaint carries a 2% reduction penalty on pay unless otherwise exempted with permission. Over 5 complaints voids the contract.",
  "If it rains on the assigned day, the contractor may postpone to the next suitable day but must notify Infinite Distribution.",
  "Contractor must take 10 photos of random letterboxes per 1000 leaflets.",
  "Leaflets must remain undamaged. Lost or damaged leaflets may incur a charge.",
  "The contractor is responsible for their own travel, phone battery, and safety.",
  "Contractor must keep client information confidential and must not attempt to contact the client, or it may result in legal action.",
  "If the contractor cancels without a valid reason or without notice, they may lose eligibility for future work.",
  "The contractor is an independent subcontractor, not an employee.",
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Sunday of the week containing `d`. */
function weekStartOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}

/** Hours between two "HH:MM" values; handles a shift running past midnight. */
function hoursBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

/** 6.5 -> "6h 30m" */
function fmtHours(h: number): string {
  const mins = Math.round(h * 60);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  if (!hh) return `${mm}m`;
  return mm ? `${hh}h ${mm}m` : `${hh}h`;
}

/** "6", "6 hrs", "6.5 hours" -> 6 / 6.5 */
function parseMinHours(v: string | null | undefined): number {
  const m = String(v ?? "").match(/[\d.]+/);
  return m ? Number(m[0]) || 0 : 0;
}

function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    // Match the backing store to the CSS size so strokes aren't blurry.
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#ffffff";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    canvas.current!.setPointerCapture(e.pointerId);
    const ctx = canvas.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(hasInk || true ? canvas.current!.toDataURL("image/png") : null);
  };

  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange(null);
  };

  return (
    <div>
      <canvas
        ref={canvas}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-40 w-full cursor-crosshair touch-none rounded-2xl border border-dashed border-white/25 bg-white/[0.04]"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[13px] text-white/40">{hasInk ? "Signed" : "Draw your signature above"}</span>
        <button type="button" onClick={clear} className="text-[13px] font-semibold text-white/50 transition hover:text-white">Clear</button>
      </div>
    </div>
  );
}

export default function JobContract({
  job, workerName, signedDate, mine, onSigned, onClose, autoOpen = false,
}: {
  job: ClientJob; workerName: string; signedDate?: string | null;
  mine?: JobAssignment | null; onSigned: () => void;
  onClose?: () => void;
  /** Opened straight from "View job" — send them to the agreement immediately. */
  autoOpen?: boolean;
}) {
  const [name, setName] = useState(workerName);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sig, setSig] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, { start: string; end: string }>>({});
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [toast, setToast] = useState(false);
  const [weekStart, setWeekStart] = useState(() => weekStartOf(mine?.start_date ? new Date(mine.start_date) : new Date()));

  const minHours = parseMinHours(mine?.min_hours || job.min_hours);
  const totalHours = Object.values(schedule).reduce((t, v) => t + hoursBetween(v?.start, v?.end), 0);
  const daysFilled = Object.values(schedule).filter((v) => v?.start && v?.end).length;
  const shortBy = Math.max(0, minHours - totalHours);
  const halfEntered = Object.values(schedule).some((v) => (v?.start && !v?.end) || (!v?.start && v?.end));
  const scheduleOk = minHours === 0 ? true : totalHours + 1e-9 >= minHours && !halfEntered;

  // Pick up an unfinished draft, and open the agreement if they came here to read it.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`idp_contract_draft_${job.id}`);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.name) setName(d.name);
        if (d.date) setDate(d.date);
        if (d.schedule) setSchedule(d.schedule);
      }
    } catch { /* nothing saved */ }
  }, [job.id]);

  // Let them know the signing date is fixed, once, rather than leaving them
  // hunting for a field that isn't editable.
  useEffect(() => {
    if (signedDate) return;
    setToast(true);
    const t = setTimeout(() => setToast(false), 5000);
    return () => clearTimeout(t);
  }, [signedDate]);

  useEffect(() => {
    if (!autoOpen || signedDate) return;
    try { localStorage.setItem(seenKey, "1"); } catch {}
    const w = window.open(contractHref, "_blank", "noreferrer");
    if (w) setSeen(true);
  }, [autoOpen, signedDate, job.id]);

  const saveDraft = () => {
    try {
      localStorage.setItem(`idp_contract_draft_${job.id}`, JSON.stringify({ name, date, schedule }));
      setSaved("Saved — you can come back and finish this later.");
      setTimeout(() => setSaved(""), 4000);
    } catch {
      setSaved("Couldn't save on this device.");
    }
  };

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
    setOpenDay(null);
  };
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekKeys = new Set(weekDays.map(iso));
  const otherWeeksHours = Object.entries(schedule)
    .filter(([k]) => !weekKeys.has(k))
    .reduce((t, [, v]) => t + hoursBetween(v?.start, v?.end), 0);
  const fmtDay = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const weekLabel = `${fmtDay(weekDays[0])} – ${fmtDay(weekDays[6])}`;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // The agreement must actually be opened before it can be signed.
  const [seen, setSeen] = useState(false);

  // Everything about reading and signing hangs off the sub-contract, so two
  // pieces of work on one job never share a signature or a "already read" flag.
  const seenKey = `idp_contract_seen_${mine?.id ?? `job${job.id}`}`;
  const contractHref = `/portal/contract/${job.id}${mine?.id ? `?a=${mine.id}` : ""}`;

  const blocker = !seen ? "Read the agreement first"
    : !name.trim() ? "Add your full name"
    : !sig ? "Sign above to continue"
    : !scheduleOk ? "Your hours don't meet the minimum yet"
    : !agreed ? "Tick the box to agree"
    : "Accept job & sign";
  const ready = !busy && seen && Boolean(name.trim()) && Boolean(sig) && scheduleOk && agreed;

  useEffect(() => {
    const check = () => {
      try { setSeen(localStorage.getItem(seenKey) === "1"); } catch { /* private mode */ }
    };
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [job.id]);

  const submit = async () => {
    if (!scheduleOk) {
      setErr(halfEntered
        ? "One of your days has only a start or only an end time — fill in both, or clear it."
        : `Your schedule adds up to ${totalHours.toFixed(1)} hours but this job requires at least ${minHours}. Add ${shortBy.toFixed(1)} more hours across any days.`);
      return;
    }
    setBusy(true); setErr("");
    try {
      // Signing is the acceptance — take the job, then record the agreement.
      if (mine?.status !== "accepted") {
        await fetch("/api/portal/jobs", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept", jobId: job.id, assignmentId: mine?.id ?? null }),
        });
      }
      const r = await fetch("/api/portal/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign", jobId: job.id, assignmentId: mine?.id ?? null,
          signedName: name, signedDate: date,
          signaturePng: sig, agreed, schedule: JSON.stringify(schedule),
        }),
      });
      const d = await r.json();
      if (!d.ok) setErr(d.error || "Couldn't submit.");
      else {
        // The signed agreement is stored; let the office know it's waiting.
        // Web3Forms only accepts browser posts, so it's sent from here.
        submitForm(
          {
            Worker: name.trim() || workerName,
            Job: job.title || `Job #${job.id}`,
            Area: mine?.area_note || job.area || "—",
            Leaflets: (mine?.leaflet_share ?? job.quantity)?.toLocaleString() ?? "—",
            Pay: (mine?.pay ?? job.worker_pay) ? `$${Number(mine?.pay ?? job.worker_pay).toFixed(2)}` : "—",
            "Minimum hours": mine?.min_hours || job.min_hours || "—",
            "Hours they scheduled": fmtHours(totalHours),
            "Signed on": date,
            "Signed copy": `${window.location.origin}/portal/admin/contract/${job.id}`,
          },
          {
            subject: `Contract signed — ${name.trim() || workerName} — ${job.title || `job #${job.id}`}`,
            from_name: "Infinite Distribution Portal",
          },
        ).catch(() => {});
        try { localStorage.removeItem(`idp_contract_draft_${job.id}`); } catch {}
        onSigned();
      }
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  };

  if (signedDate) {
    return (
      <GlassCard className="border-emerald-400/25 bg-emerald-500/[0.06] p-6">
        <p className="font-display text-lg font-bold text-emerald-200">Agreement signed</p>
        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-4">
          <p className="text-sm text-emerald-100/70">
            You signed this contract on {new Date(signedDate).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" })}. A signed copy has been saved.
          </p>
          <a href={contractHref} target="_blank" rel="noreferrer"
            className="shrink-0 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 px-5 py-2.5 font-display text-[14px] font-bold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-white">
            View signed agreement ↗
          </a>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="relative p-6 sm:p-8">
      {toast && (
        <div className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-orchid/40 bg-[#1b1430] px-4 py-2.5 text-[13px] font-semibold text-white/85 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)]">
          <span className="text-orchid">●</span>
          Date set to today for signing
        </div>
      )}
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">Independent contractor agreement</p>
      <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white">Terms for this job</h3>
      <p className="mt-2 text-sm text-white/50">
        Infinite Distribution · ABN 66 177 274 211 · for {workerName || "you"}
      </p>

      <div className={`mt-6 rounded-2xl border p-5 ${
        seen ? "border-emerald-400/30 bg-emerald-500/[0.07]" : "border-orchid/40 bg-orchid/[0.08]"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-base font-bold text-white">
              {seen ? "Agreement read ✓" : "Read the agreement first"}
            </p>
            <p className="mt-1 text-[13px] text-white/55">
              {seen
                ? "You can open it again any time before signing."
                : "Open the full agreement — you need to read it before you can sign."}
            </p>
          </div>
          <a
            href={contractHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => { try { localStorage.setItem(seenKey, "1"); } catch {} setTimeout(() => setSeen(true), 400); }}
            className="rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-3 font-display text-[15px] font-bold text-white shadow-[0_14px_34px_-14px_rgba(182,109,199,0.9)] transition hover:-translate-y-0.5"
          >
            {seen ? "View agreement again ↗" : "View agreement (PDF) ↗"}
          </a>
        </div>
      </div>

      <div className={`mt-7 transition ${seen ? "" : "pointer-events-none select-none opacity-40"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Your working schedule</p>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => shiftWeek(-1)} aria-label="Previous week"
              className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[13px] font-bold text-white/60 transition hover:bg-white/[0.1] hover:text-white">←</button>
            <span className="min-w-[168px] text-center text-[13px] font-semibold text-white/75">{weekLabel}</span>
            <button type="button" onClick={() => shiftWeek(1)} aria-label="Next week"
              className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[13px] font-bold text-white/60 transition hover:bg-white/[0.1] hover:text-white">→</button>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-white/40">
          Every day is optional — page back and forward through the weeks and fill in whichever days or weekends suit you.
        </p>

        <div className="mt-3 space-y-1.5">
          {weekDays.map((d) => {
            const key = iso(d);
            const v = schedule[key] || { start: "", end: "" };
            const hrs = hoursBetween(v.start, v.end);
            const half = (v.start && !v.end) || (!v.start && v.end);
            const isOpen = openDay === key;
            return (
              <div key={key}
                className={`overflow-hidden rounded-xl border transition ${
                  half ? "border-amber-400/35 bg-amber-500/[0.07]"
                  : hrs ? "border-emerald-400/25 bg-emerald-500/[0.06]"
                  : isOpen ? "border-white/20 bg-white/[0.06]"
                  : "border-white/10 bg-white/[0.03]"}`}>
                {/* Closed by default — open a day only when there's time to add. */}
                <button type="button" onClick={() => setOpenDay(isOpen ? null : key)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.04]">
                  <span className="w-[104px] shrink-0">
                    <span className="block text-[13px] font-semibold text-white/80">{DAY_NAMES[d.getDay()]}</span>
                    <span className="block text-[11px] text-white/35">
                      {d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                  <span className="flex-1 text-[13px]">
                    {half ? (
                      <span className="text-amber-300">Needs both a start and an end</span>
                    ) : hrs ? (
                      <span className="text-emerald-200">{v.start} – {v.end}</span>
                    ) : (
                      <span className="text-white/30">Not working — tap to add times</span>
                    )}
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-white/45">
                    {hrs ? fmtHours(hrs) : ""}
                  </span>
                  <span className={`shrink-0 text-white/35 transition-transform ${isOpen ? "rotate-180" : ""}`}>\▾</span>
                </button>

                {isOpen && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-3 py-2.5">
                    <label className="flex min-w-[140px] flex-1 items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/40">Start</span>
                      <input type="time" value={v.start} aria-label={`${DAY_NAMES[d.getDay()]} ${key} start`}
                        onChange={(ev) => setSchedule((sc) => ({ ...sc, [key]: { start: ev.target.value, end: sc[key]?.end || "" } }))}
                        className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-[13px] text-white [color-scheme:dark]" />
                    </label>
                    <label className="flex min-w-[140px] flex-1 items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/40">End</span>
                      <input type="time" value={v.end} aria-label={`${DAY_NAMES[d.getDay()]} ${key} end`}
                        onChange={(ev) => setSchedule((sc) => ({ ...sc, [key]: { start: sc[key]?.start || "", end: ev.target.value } }))}
                        className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-[13px] text-white [color-scheme:dark]" />
                    </label>
                    {(v.start || v.end) && (
                      <button type="button"
                        onClick={() => setSchedule((sc) => { const n = { ...sc }; delete n[key]; return n; })}
                        className="shrink-0 rounded-lg border border-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/45 transition hover:text-rose-300">
                        Clear day
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`mt-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${
          scheduleOk ? "border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-200"
                     : "border-amber-400/30 bg-amber-500/[0.08] text-amber-200"}`}>
          <span className="font-bold">
            {fmtHours(totalHours)} scheduled{daysFilled ? ` across ${daysFilled} day${daysFilled === 1 ? "" : "s"}` : ""}
          </span>
          {otherWeeksHours > 0 && (
            <span className="text-white/45"> · {fmtHours(otherWeeksHours)} of that in other weeks</span>
          )}
          <span className="mt-1 block">
            {halfEntered
              ? "One day has only a start or only an end time — fill in both times, or clear the day."
              : minHours === 0
                ? "No minimum hours were set for this job, so any schedule is fine."
                : scheduleOk
                  ? `That meets the ${fmtHours(minHours)} minimum for this job.`
                  : `This job requires at least ${fmtHours(minHours)}, so you're ${fmtHours(shortBy)} short. Add more time on any day — it doesn't have to be this week.`}
          </span>
        </div>
      </div>

      <div className={`mt-7 grid gap-4 transition sm:grid-cols-2 ${seen ? "" : "pointer-events-none select-none opacity-40"}`}>
        <div>
          <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3 text-white outline-none focus:border-orchid/60" />
        </div>
        <div>
          <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Date</label>
          {/* The date a contract is signed is the day it's signed — not a choice. */}
          <p className="w-full cursor-default rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-3 text-white/70">
            {new Date(`${date}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="mt-1.5 text-[12px] text-white/35">Set to today automatically.</p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Contractor signature</label>
          <SignaturePad onChange={setSig} />
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#7c3aed]" />
        <span className="text-sm leading-relaxed text-white/70">
          By ticking this box and signing above, I confirm I have read and agree to the terms of this Independent Contractor Agreement,
          that I am engaged as an independent subcontractor and not an employee, and that this electronic signature is legally binding.
        </span>
      </label>

      {err && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{err}</p>}

      {saved && <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{saved}</p>}

      {/* Accept stays dim until it's been read, signed and the hours add up. */}
      <button onClick={submit} disabled={!ready}
        className={`mt-6 w-full rounded-2xl px-6 py-4 font-display text-[15px] font-bold transition ${busy ? "idp-loading" : ""} ${
          ready
            ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] hover:-translate-y-0.5"
            : "cursor-not-allowed border border-white/10 bg-white/[0.06] text-white/35"}`}>
        {busy ? "Submitting…" : ready ? "Accept job & sign" : blocker}
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={saveDraft}
          className="flex-1 rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3 font-display text-[14px] font-bold text-white/75 transition hover:bg-white/[0.1] hover:text-white">
          Save for later
        </button>
        {onClose && (
          <button type="button" onClick={onClose}
            className="flex-1 rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3 font-display text-[14px] font-bold text-white/55 transition hover:bg-white/[0.1] hover:text-white">
            Close
          </button>
        )}
      </div>
    </GlassCard>
  );
}
