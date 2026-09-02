"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "./PortalShell";
import BoundaryMap, { parseSpec, specHasDrawing, type AreaSpec } from "./BoundaryMap";
import JobContract from "./JobContract";
import { tidyHours } from "@/lib/portal/text";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";

const money = (v: string | null) => (v ? `$${Number(v).toFixed(2)}` : "—");
const shortDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) : "—";

const STEPS = ["The job", "Your hours", "The agreement", "Sign"];

type Flow = {
  scheduleOk: boolean;
  seen: boolean;
  ready: boolean;
  busy: boolean;
  submit: () => void;
};

/**
 * Taking a job, one screen at a time.
 *
 * All of it on one page meant scrolling past a map, a week of time boxes, an
 * agreement and a signature pad before anything could be pressed — on a phone,
 * which is where this is actually used. Each step asks for one thing and has
 * one button, in the same place every time.
 */
export default function TakeJobSteps({
  job, mine, workerName, onSigned,
}: {
  job: ClientJob;
  mine: JobAssignment;
  workerName: string;
  onSigned: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [flow, setFlow] = useState<Flow>({
    scheduleOk: false, seen: false, ready: false, busy: false, submit: () => {},
  });

  // Each step starts at the top, or the next screen opens halfway down where
  // the last one happened to be scrolled to.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const own = parseSpec(mine.boundary);
  const spec: AreaSpec = specHasDrawing(own) ? own : parseSpec(job.boundary);
  const name = mine.title?.trim() || mine.area_note?.trim() || job.area?.trim() || `Job #${job.id}`;

  if (done) {
    return (
      <GlassCard className="border-emerald-400/30 bg-emerald-500/[0.08] p-7 text-center sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 text-3xl text-emerald-300">
          ✓
        </div>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-white">Job accepted</h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-emerald-100/70">
          {name} is yours. The agreement is signed and the office has a copy.
        </p>
        <button
          onClick={onSigned}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-4 font-display text-[15px] font-bold text-white sm:w-auto sm:px-10"
        >
          Go to the job
        </button>
      </GlassCard>
    );
  }

  const facts: [string, string][] = [
    ["Your area", mine.area_note || job.area || "—"],
    ["Leaflets", mine.leaflet_share ? mine.leaflet_share.toLocaleString() : "—"],
    ["Your pay", money(mine.pay ?? job.worker_pay)],
    ["Minimum hours", tidyHours(mine.min_hours || job.min_hours) || "—"],
    ["By", shortDate(mine.due_date)],
    ["Junk mail", mine.junk_mail_allowed ? "Allowed" : "Not allowed"],
  ];

  const next = () => {
    if (step === 4) {
      flow.submit();
      return;
    }
    setStep(step + 1);
  };

  const blocked =
    step === 2 ? !flow.scheduleOk
      : step === 3 ? !flow.seen
        : step === 4 ? !flow.ready
          : false;

  const label =
    step === 1 ? "Accept this job →"
      : step === 2 ? (flow.scheduleOk ? "Next — the agreement →" : "Fill in your hours to continue")
        : step === 3 ? (flow.seen ? "Next — sign it →" : "Open the agreement to continue")
          : flow.busy ? "Signing…" : flow.ready ? "Sign & accept" : "Sign above to finish";

  return (
    <div>
      {/* Where they are, kept to one line so it doesn't crowd a phone. */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full transition ${
                i + 1 <= step ? "bg-gradient-to-r from-electric to-orchid" : "bg-white/12"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">
          Step {step} of 4 — {STEPS[step - 1]}
        </p>
      </div>

      <GlassCard className="p-5 sm:p-7">
        {step === 1 && (
          <>
            <h2 className="font-display text-[clamp(1.4rem,5vw,1.9rem)] font-extrabold leading-tight text-white">
              {name}
            </h2>
            <p className="mt-1.5 text-[14px] text-white/50">
              What the job is, before you take it on.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">{k}</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-white">{v}</p>
                </div>
              ))}
            </div>

            {specHasDrawing(spec) && (
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-white/35">
                  Where you&apos;ll be working
                </p>
                <BoundaryMap spec={spec} height={300} />
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display text-xl font-extrabold text-white">When will you do it?</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/50">
              Fill in the days you&apos;ll work. They go into the agreement you sign next.
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-display text-xl font-extrabold text-white">Read the agreement</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/50">
              It has your area, pay, hours and the days you just entered in it.
            </p>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-display text-xl font-extrabold text-white">Sign to accept</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-white/50">
              Sign with your finger, tick to agree, and the job is yours.
            </p>
          </>
        )}

        {/*
          One agreement, mounted for the whole walk-through and simply shown a
          step at a time. Rendering a fresh one per step threw the hours away on
          the way to the signature — the schedule lives in its state.
        */}
        <div className={step === 1 ? "hidden" : "mt-5"}>
          <JobContract
            job={job} workerName={workerName} mine={mine}
            step={(step >= 2 ? step : 2) as 2 | 3 | 4}
            onSigned={() => setDone(true)} onState={setFlow}
          />
        </div>

      </GlassCard>

      {/* One button, always in the same place. */}
      <div className="mt-4 flex items-center gap-2">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="shrink-0 rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-4 font-display text-[14px] font-bold text-white/60 transition hover:bg-white/[0.1] hover:text-white"
          >
            Back
          </button>
        )}
        <button
          onClick={next}
          disabled={blocked}
          className={`flex-1 rounded-2xl px-6 py-4 font-display text-[15px] font-bold transition ${
            blocked
              ? "cursor-not-allowed border border-white/10 bg-white/[0.06] text-white/35"
              : "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] hover:-translate-y-0.5"
          }`}
        >
          {label}
        </button>
      </div>

      {step === 1 && (
        <button
          onClick={() => router.push("/portal")}
          className="mt-3 w-full rounded-2xl px-6 py-3 text-[13px] font-semibold text-white/35 transition hover:text-white/70"
        >
          Not now — back to your work
        </button>
      )}
    </div>
  );
}
