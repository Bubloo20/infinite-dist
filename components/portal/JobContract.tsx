"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard } from "./PortalShell";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";

/** Terms transcribed from the Independent Contractor Agreement. */
export const CONTRACT_TERMS = [
  "The contractor agrees to complete the leaflet distribution job within the allocated time stated above.",
  "Contractor must provide a clear schedule of their time to be spent on the job and must inform when starting an activity, pausing or finishing.",
  "Failure to start on time (40 minute window) or start on scheduled days may result in a penalty such as a reduction in pay (5%) per day missed.",
  "Contractor must work the minimum hours stated above, and cover the job area/distance.",
  "Payment will be made within 1 week after Infinite Distributions verifies the tracking data.",
  "The contractor must use the tracking apps specified by Infinite Distributions: MAP MY WALK & STRAVA.",
  "Failure to use both correct apps, failure to track the walk, or suspicious activity such as letting the activity run while stationary or in a vehicle, results in no payment.",
  "If complaints of leaflets being placed in junk mail, or multiple leaflets in a single mailbox, are received: each complaint carries a 2% reduction penalty on pay unless otherwise exempted with permission. Over 5 complaints voids the contract.",
  "If it rains on the assigned day, the contractor may postpone to the next suitable day but must notify Infinite Distributions.",
  "Contractor must take 10 photos of random letterboxes per 1000 leaflets.",
  "Leaflets must remain undamaged. Lost or damaged leaflets may incur a charge.",
  "The contractor is responsible for their own travel, phone battery, and safety.",
  "Contractor must keep client information confidential and must not attempt to contact the client, or it may result in legal action.",
  "If the contractor cancels without a valid reason or without notice, they may lose eligibility for future work.",
  "The contractor is an independent subcontractor, not an employee.",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  job, workerName, signedDate, mine, onSigned,
}: {
  job: ClientJob; workerName: string; signedDate?: string | null;
  mine?: JobAssignment | null; onSigned: () => void;
}) {
  const [name, setName] = useState(workerName);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sig, setSig] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, { start: string; end: string }>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/portal/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign", jobId: job.id, signedName: name, signedDate: date,
          signaturePng: sig, agreed, schedule: JSON.stringify(schedule),
        }),
      });
      const d = await r.json();
      if (!d.ok) setErr(d.error || "Couldn't submit.");
      else onSigned();
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  };

  if (signedDate) {
    return (
      <GlassCard className="border-emerald-400/25 bg-emerald-500/[0.06] p-6">
        <p className="font-display text-lg font-bold text-emerald-200">Agreement signed</p>
        <p className="mt-1.5 text-sm text-emerald-100/70">
          You signed this contract on {new Date(signedDate).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" })}. A copy is with the office.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">Independent contractor agreement</p>
      <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white">Terms for this job</h3>
      <p className="mt-2 text-sm text-white/50">Infinite Distributions · ABN 66 177 274 211</p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-2">
        {[
          ["Contractor", workerName],
          ["Job area", mine?.area_note || job.area || "—"],
          ["Leaflet amount", (mine?.leaflet_share ?? job.quantity) ? (mine?.leaflet_share ?? job.quantity)!.toLocaleString() : "—"],
          ["Allocated time", mine?.allocated_time ? mine.allocated_time : mine?.start_date || mine?.due_date
            ? `${mine?.start_date ? new Date(mine.start_date).toLocaleDateString("en-AU") : "—"} to ${mine?.due_date ? new Date(mine.due_date).toLocaleDateString("en-AU") : "—"}`
            : job.allocated_time || "—"],
          ["Payment amount", (mine?.pay ?? job.worker_pay) ? `$${Number(mine?.pay ?? job.worker_pay).toFixed(2)}` : "—"],
          ["Minimum hours of work", mine?.min_hours || job.min_hours || "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">{k}</p>
            <p className="mt-0.5 font-semibold text-white">{v}</p>
          </div>
        ))}
      </div>

      <ol className="mt-6 space-y-2.5">
        {CONTRACT_TERMS.map((t, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/70">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orchid" />
            <span>{t}</span>
          </li>
        ))}
      </ol>

      <div className="mt-7">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Your working schedule</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DAYS.map((d) => (
            <div key={d} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <span className="w-24 shrink-0 text-[13px] text-white/60">{d}</span>
              <input type="time" value={schedule[d]?.start || ""} aria-label={`${d} start`}
                onChange={(e) => setSchedule((s) => ({ ...s, [d]: { start: e.target.value, end: s[d]?.end || "" } }))}
                className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-[13px] text-white [color-scheme:dark]" />
              <input type="time" value={schedule[d]?.end || ""} aria-label={`${d} end`}
                onChange={(e) => setSchedule((s) => ({ ...s, [d]: { start: s[d]?.start || "", end: e.target.value } }))}
                className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-[13px] text-white [color-scheme:dark]" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3 text-white outline-none focus:border-orchid/60" />
        </div>
        <div>
          <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3 text-white outline-none focus:border-orchid/60 [color-scheme:dark]" />
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

      <button onClick={submit} disabled={busy || !agreed || !sig || !name.trim()}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-4 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0">
        {busy ? "Submitting…" : "Sign and accept the agreement"}
      </button>
    </GlassCard>
  );
}
