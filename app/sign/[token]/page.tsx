"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SignaturePad } from "@/components/portal/JobContract";
import { CONTRACT_TERMS, junkMailTerm } from "@/lib/portal/contractTerms";
import { tidyHours, parseHours, formatHours, clockLabel } from "@/lib/portal/text";

type Day = { start?: string; end?: string };

type Deal = {
  ok: boolean;
  workerName: string;
  title: string;
  area: string | null;
  leaflets: number | null;
  pay: string | null;
  minHours: string | null;
  startDate: string | null;
  dueDate: string | null;
  junkMailAllowed: boolean;
  scheduleOptional: boolean;
  signed: { name: string; date: string | null; schedule: string | null } | null;
};

const money = (v: string | null) => (v ? `$${Number(v).toFixed(2)}` : "—");
const longDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—";
const shortDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "—";
const iso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const spanHours = (a?: string, b?: string) => {
  if (!a || !b) return 0;
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  let mins = bh * 60 + bm - (ah * 60 + am);
  if (mins < 0) mins += 1440;
  return mins / 60;
};

/**
 * One agreement, on its own link.
 *
 * No job behind it and no account in front of it: somebody is sent this,
 * reads what they are agreeing to, puts down the days if days were asked for,
 * and signs. The link is the credential, so whoever holds it signs as the
 * person it was written for — send it to them, not to a group.
 */
export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "ok" | "gone">("loading");
  const [error, setError] = useState("");
  const [d, setD] = useState<Deal | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, Day>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ emailed: boolean } | null>(null);
  const [arrivedSigned, setArrivedSigned] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/sign/${token}`)
      .then((r) => r.json())
      .then((v) => {
        if (!v.ok) { setError(v.error || "That link isn't valid."); setState("gone"); return; }
        setD(v);
        setName(v.workerName || "");
        if (v.signed) {
          setArrivedSigned(true);
          try { setSchedule(v.signed.schedule ? JSON.parse(v.signed.schedule) : {}); } catch { /* ignore */ }
        }
        setState("ok");
      })
      .catch(() => { setError("Couldn't load that link."); setState("gone"); });
  }, [token]);

  if (state === "loading") {
    return <main className="grid min-h-[100svh] place-items-center bg-[#0b0713] text-white/50">Loading…</main>;
  }
  if (state === "gone" || !d) {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-[#0b0713] px-6 text-center">
        <div>
          <p className="font-display text-xl font-bold text-white">{error || "Link not found"}</p>
          <p className="mt-2 text-white/50">Ask the office for a new one.</p>
        </div>
      </main>
    );
  }

  const days = Object.entries(schedule).filter(([, v]) => v?.start || v?.end);
  const totalHours = days.reduce((t, [, v]) => t + spanHours(v.start, v.end), 0);
  const halfEntered = days.some(([, v]) => (v.start && !v.end) || (!v.start && v.end));
  const minHours = parseHours(d.minHours);
  const scheduleOk = d.scheduleOptional
    ? !halfEntered
    : minHours === 0 ? !halfEntered && days.length > 0 : totalHours + 1e-9 >= minHours && !halfEntered;

  const week = Array.from({ length: 7 }, (_, i) => {
    const t = new Date();
    t.setDate(t.getDate() + i);
    t.setHours(0, 0, 0, 0);
    return t;
  });

  const signed = Boolean(d.signed) || Boolean(done);

  const facts: [string, string][] = [
    ["Pay", money(d.pay)],
    ["Leaflets", d.leaflets ? d.leaflets.toLocaleString() : "—"],
    ["Area", d.area || "—"],
    ["Minimum hours", tidyHours(d.minHours) || "—"],
    [d.scheduleOptional ? "Do it by" : "Due", shortDate(d.dueDate)],
    ["Junk mail", d.junkMailAllowed ? "Allowed" : "Not allowed"],
  ];

  const submit = async () => {
    setNotice("");
    if (!name.trim()) { setNotice("Type your full name as it should appear on the agreement."); return; }
    if (!sig) { setNotice("Draw your signature in the box."); return; }
    if (!agreed) { setNotice("Tick the box to confirm you agree to the terms."); return; }
    if (!scheduleOk) {
      setNotice(halfEntered
        ? "One of your days has a start but no finish — fill in both, or clear it."
        : minHours > 0
          ? `Your hours don't meet the minimum yet — put down at least ${formatHours(minHours)}.`
          : "Put down at least one day you'll be working.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/portal/sign/${token}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          signedName: name.trim(), email: email.trim(), signaturePng: sig,
          schedule: JSON.stringify(schedule), agreed: true,
        }),
      });
      const v = await r.json();
      if (!v.ok) { setNotice(v.error || "Couldn't record that — try again."); return; }
      setDone({ emailed: Boolean(v.emailedWorker) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setNotice("Couldn't reach the office — check your signal and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-[#0b0713]">
      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orchid">Infinite Distribution</p>

        <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
          {signed ? (
            <>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-xl text-emerald-300">✓</span>
                <div className="min-w-0">
                  <h1 className="font-display text-xl font-extrabold text-white">
                    {arrivedSigned && !done ? "Already signed" : "Signed"}
                  </h1>
                  <p className="mt-1 text-[13px] text-emerald-100/65">
                    {d.title} — signed by {done ? name.trim() : d.signed?.name}
                    {d.signed?.date ? ` on ${longDate(d.signed.date)}` : ""}.
                  </p>
                </div>
              </div>
              {done && (
                <p className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-3.5 text-[14px] leading-relaxed text-emerald-100">
                  {done.emailed
                    ? "A copy has been emailed to you, and the office has one."
                    : "The office has a copy. Keep this link — it's your copy of what you signed."}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="font-display text-[clamp(1.5rem,6vw,2.1rem)] font-extrabold leading-tight text-white">
                {d.title}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">
                {d.workerName ? `${d.workerName}, this` : "This"} is the work being offered to you, and what
                it pays. Read it through, then sign at the bottom.
              </p>
            </>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {facts.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">{k}</p>
                <p className="mt-0.5 text-[15px] font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-7 font-display text-lg font-bold text-white">Terms</h2>
          <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-white/65">
            <li className="font-semibold text-white">{junkMailTerm(d.junkMailAllowed)}</li>
            {CONTRACT_TERMS.map((t) => <li key={t}>{t}</li>)}
          </ul>

          {!signed && !d.scheduleOptional && (
            <>
              <h2 className="mt-7 font-display text-lg font-bold text-white">When will you do it?</h2>
              <p className="mt-1 text-[13px] text-white/45">
                These go into the agreement you sign.
                {minHours > 0 ? ` At least ${formatHours(minHours)} in total.` : ""}
              </p>
              <div className="mt-3 space-y-2">
                {week.map((day) => {
                  const key = iso(day);
                  const v = schedule[key] || { start: "", end: "" };
                  const hrs = spanHours(v.start, v.end);
                  return (
                    <div key={key} className={`rounded-xl border px-4 py-3 ${
                      hrs ? "border-emerald-400/25 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[14px] font-semibold text-white">
                          {DAY_NAMES[day.getDay()]}
                          <span className="ml-2 text-[12px] font-normal text-white/40">
                            {day.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                          </span>
                        </span>
                        <span className="text-[13px] text-white/50">
                          {hrs ? `${formatHours(hrs)} · ${clockLabel(v.start)} – ${clockLabel(v.end)}` : ""}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input type="time" value={v.start || ""} aria-label={`${DAY_NAMES[day.getDay()]} start`}
                          onChange={(e) => setSchedule({ ...schedule, [key]: { ...v, start: e.target.value } })}
                          className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-[15px] text-white outline-none focus:border-orchid/60" />
                        <input type="time" value={v.end || ""} aria-label={`${DAY_NAMES[day.getDay()]} finish`}
                          onChange={(e) => setSchedule({ ...schedule, [key]: { ...v, end: e.target.value } })}
                          className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-[15px] text-white outline-none focus:border-orchid/60" />
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalHours > 0 && (
                <p className="mt-2 text-[13px] font-semibold text-white/55">
                  {formatHours(totalHours)} in total
                  {minHours > 0 ? ` of ${formatHours(minHours)} needed` : ""}
                </p>
              )}
            </>
          )}

          {!signed && (
            <>
              <h2 className="mt-7 font-display text-lg font-bold text-white">Sign it</h2>

              <label className="mt-3 block">
                <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-white/40">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                  className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[16px] text-white outline-none focus:border-orchid/60" />
              </label>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-white/40">
                  Your email <span className="text-white/25">— so we can send you a copy</span>
                </span>
                <input type="email" inputMode="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[16px] text-white outline-none focus:border-orchid/60" />
              </label>

              <div className="mt-4">
                <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-white/40">Signature</span>
                <SignaturePad onChange={setSig} />
              </div>

              <p className="mt-3 text-[13px] text-white/45">Dated {longDate(iso(new Date()))}.</p>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/12 bg-white/[0.04] p-4">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-orchid" />
                <span className="text-[13px] leading-relaxed text-white/70">
                  I confirm I have read and agree to the terms, that I am engaged as an independent
                  subcontractor and not an employee, and that this electronic signature is binding.
                </span>
              </label>
            </>
          )}
        </div>

        {notice && (
          <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-400/40 bg-amber-500/12 px-4 py-3.5 text-[14px] leading-relaxed text-amber-100">
            <span aria-hidden className="mt-0.5 shrink-0 font-bold">!</span>
            <span>{notice}</span>
          </p>
        )}

        {!signed && (
          <button onClick={submit} disabled={busy}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-4 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)]">
            {busy ? "Signing…" : "Sign & accept"}
          </button>
        )}

        <p className="mt-6 text-center text-[12px] text-white/25">
          Infinite Distribution · ABN 66 177 274 211
        </p>
      </div>
    </main>
  );
}
