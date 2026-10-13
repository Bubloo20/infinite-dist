"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BoundaryMap, { parseSpec, specHasDrawing, type AreaSpec } from "@/components/portal/BoundaryMap";
import { CONTRACT_TERMS, junkMailTerm, SignaturePad } from "@/components/portal/JobContract";
import { tidyHours, parseHours, formatHours, clockLabel } from "@/lib/portal/text";

type Invite = {
  workerName: string;
  title: string;
  area: string | null;
  leaflets: number | null;
  pay: string | null;
  minHours: string | null;
  startDate: string | null;
  dueDate: string | null;
  allocatedTime: string | null;
  junkMailAllowed: boolean;
  scheduleOptional: boolean;
  boundary: string | null;
  mapCenter: string | null;
  signed: { name: string; date: string; schedule: string | null } | null;
};

const money = (v: string | null) => (v ? `$${Number(v).toFixed(2)}` : "—");
const longDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—";
const shortDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) : "—";
const parseCenter = (s: string | null): [number, number, number] | null => {
  if (!s) return null;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) && v.length === 3 ? (v as [number, number, number]) : null;
  } catch {
    return null;
  }
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Hours between two "HH:MM" times, counting past midnight. */
const spanHours = (start?: string, end?: string) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return 0;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  return mins / 60;
};

type Day = { start: string; end: string };

/**
 * A job offered by link, to someone with no account.
 *
 * The whole thing on a phone: what it pays and when it's due, the hours
 * they'll work, the agreement, their signature, and only then the map. The
 * link is the credential — there's nothing to log into and nothing to install.
 */
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "ok" | "gone">("loading");
  const [error, setError] = useState("");
  const [d, setD] = useState<Invite | null>(null);

  const [at, setAt] = useState(0);
  const [notice, setNotice] = useState("");
  const [schedule, setSchedule] = useState<Record<string, Day>>({});
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const t = new Date();
    t.setDate(t.getDate() - t.getDay());
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [name, setName] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [readTerms, setReadTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [located, setLocated] = useState(false);
  // What became of their copy once it was signed.
  const [sentTo, setSentTo] = useState<string | null>(null);
  // True only when the link was opened on a job that was already signed.
  const [arrivedSigned, setArrivedSigned] = useState(false);
  const [savedCopy, setSavedCopy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/invite/${token}`)
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

  useEffect(() => { setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }, [at]);

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

  const spec: AreaSpec = parseSpec(d.boundary);
  const alreadySigned = Boolean(d.signed);

  /* ------------------------------ the steps ------------------------------ */
  const steps = d.scheduleOptional
    ? (["terms", "agreement", "sign", "map"] as const)
    : (["terms", "hours", "agreement", "sign", "map"] as const);
  const key = alreadySigned ? "map" : steps[at];
  const total = steps.length;

  const days = Object.entries(schedule).filter(([, v]) => v?.start || v?.end);
  const totalHours = days.reduce((t, [, v]) => t + spanHours(v.start, v.end), 0);
  const halfEntered = days.some(([, v]) => (v.start && !v.end) || (!v.start && v.end));
  const minHours = parseHours(d.minHours);
  const scheduleOk = d.scheduleOptional
    ? !halfEntered
    : minHours === 0 ? !halfEntered && days.length > 0 : totalHours + 1e-9 >= minHours && !halfEntered;

  const week = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });
  const weekLabel = `${week[0].toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${
    week[6].toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`;
  const shiftWeek = (by: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + by * 7);
    setWeekStart(next);
  };

  const sign = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/portal/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedName: name.trim(),
          email: email.trim(),
          signaturePng: sig,
          signedDate: iso(new Date()),
          schedule: JSON.stringify(schedule),
          agreed,
        }),
      });
      const v = await r.json();
      if (!v.ok) { setNotice(v.error || "Couldn't record that — try again."); return; }
      setSentTo(v.emailedWorker ? email.trim() : null);
      setD({ ...d, signed: { name: name.trim(), date: iso(new Date()), schedule: JSON.stringify(schedule) } });
      setAt(steps.length - 1);
    } catch {
      setNotice("Couldn't record that — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Save the agreement to the phone as a PDF.
   *
   * Built from a printable sheet rendered off-screen rather than a second
   * layout, so what they keep is the same document the office gets — the same
   * trap as the invoice, where a separately drawn PDF drifted from the page.
   */
  const saveCopy = async () => {
    setSaving(true);
    try {
      const sheet = document.getElementById("contract-sheet");
      if (!sheet) return;
      const { elementToPdf } = await import("@/lib/invoicePdf");
      const blob = await elementToPdf(sheet);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Agreement - ${(d.signed?.name || name || "signed").trim()}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setSavedCopy(true);
    } catch {
      setNotice("Couldn't make the file. Take a screenshot of this page instead, or give us an email above.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (key === "hours" && !scheduleOk) {
      setNotice(halfEntered
        ? "One of your days has a start time but no end time (or the other way round). Open that day and fill in both, or clear it."
        : minHours === 0
          ? "Put down at least one day you'll be working."
          : `You've put down ${formatHours(totalHours) || "0 mins"}, and this job needs at least ${formatHours(minHours)}. Add another ${formatHours(minHours - totalHours)} on any day.`);
      return;
    }
    if (key === "agreement" && !readTerms) {
      setNotice("Read the agreement above, then tick to say you have.");
      return;
    }
    if (key === "sign") {
      if (!name.trim()) { setNotice("Put your full name in the box above."); return; }
      if (!sig) { setNotice("Draw your signature in the box above with your finger."); return; }
      if (!agreed) { setNotice("Tick the box to say you've read and agree to the terms."); return; }
      void sign();
      return;
    }
    setAt(at + 1);
  };

  const label =
    key === "terms" ? "Looks good — continue →"
      : key === "hours" ? "Next — the agreement →"
        : key === "agreement" ? "Next — sign it →"
          : busy ? "Signing…" : "Sign & accept";

  const facts: [string, string][] = [
    ["Your pay", money(d.pay)],
    ["Leaflets", d.leaflets ? d.leaflets.toLocaleString() : "—"],
    ["Your area", d.area || "—"],
    ["Minimum hours", tidyHours(d.minHours) || "—"],
    [d.scheduleOptional ? "Do it by" : "Due", shortDate(d.dueDate)],
    ["Junk mail", d.junkMailAllowed ? "Allowed" : "Not allowed"],
  ];

  return (
    <main className="min-h-[100svh] bg-[#0b0713]">
      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orchid">Infinite Distribution</p>

        {key !== "map" && (
          <div className="mt-3 mb-4">
            <div className="flex items-center gap-1.5">
              {steps.slice(0, -1).map((s, i) => (
                <span key={s} className={`h-1 flex-1 rounded-full transition ${
                  i <= at ? "bg-gradient-to-r from-electric to-orchid" : "bg-white/12"}`} />
              ))}
            </div>
            <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">
              Step {at + 1} of {total - 1}
            </p>
          </div>
        )}

        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
          {/* ----------------------------- terms ----------------------------- */}
          {key === "terms" && (
            <>
              <h1 className="font-display text-[clamp(1.5rem,6vw,2.1rem)] font-extrabold leading-tight text-white">
                {d.title}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">
                {d.workerName ? `${d.workerName}, this` : "This"} is the work being offered to you, and what
                it pays. Read it through — you&apos;ll sign for it in a moment.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {facts.map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">{k}</p>
                    <p className="mt-0.5 text-[15px] font-semibold text-white">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-white/60">
                {d.startDate || d.dueDate ? (
                  <>Run it between <span className="font-semibold text-white/85">{longDate(d.startDate)}</span> and{" "}
                    <span className="font-semibold text-white/85">{longDate(d.dueDate)}</span>.</>
                ) : (
                  <>Dates will be confirmed by the office.</>
                )}
                {" "}Payment is made within a week of your tracking being checked.
              </div>
            </>
          )}

          {/* ----------------------------- hours ----------------------------- */}
          {key === "hours" && (
            <>
              <h2 className="font-display text-xl font-extrabold text-white">When will you do it?</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">
                Put down the days you&apos;ll work. They go into the agreement you sign next.
              </p>

              <div className="mt-5 flex items-center justify-between gap-2">
                <button onClick={() => shiftWeek(-1)} aria-label="Previous week"
                  className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-[14px] font-bold text-white/60">←</button>
                <span className="text-[13px] font-semibold text-white/75">{weekLabel}</span>
                <button onClick={() => shiftWeek(1)} aria-label="Next week"
                  className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-[14px] font-bold text-white/60">→</button>
              </div>

              <div className="mt-3 space-y-2">
                {week.map((day) => {
                  const dayKey = iso(day);
                  const v = schedule[dayKey] || { start: "", end: "" };
                  const hrs = spanHours(v.start, v.end);
                  const isOpen = openDay === dayKey;
                  return (
                    <div key={dayKey} className={`overflow-hidden rounded-xl border ${
                      hrs ? "border-emerald-400/25 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
                      <button
                        onClick={() => setOpenDay(isOpen ? null : dayKey)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block text-[14px] font-semibold text-white">{DAY_NAMES[day.getDay()]}</span>
                          <span className="block text-[12px] text-white/40">
                            {day.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                          </span>
                        </span>
                        <span className="text-[13px] text-right">
                          {v.start && v.end
                            ? <span className="text-emerald-200">{clockLabel(v.start)} – {clockLabel(v.end)}</span>
                            : v.start || v.end
                              ? <span className="text-amber-300">Needs both times</span>
                              : <span className="text-white/30">Not working</span>}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-4 py-3">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/40">Start</span>
                            <input type="time" value={v.start}
                              onChange={(e) => setSchedule((sc) => ({ ...sc, [dayKey]: { start: e.target.value, end: sc[dayKey]?.end || "" } }))}
                              className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-2 py-2 text-[14px] text-white [color-scheme:dark]" />
                            <span className="mt-1 block text-[11px] font-semibold text-orchid">{clockLabel(v.start) || " "}</span>
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/40">End</span>
                            <input type="time" value={v.end}
                              onChange={(e) => setSchedule((sc) => ({ ...sc, [dayKey]: { start: sc[dayKey]?.start || "", end: e.target.value } }))}
                              className="w-full rounded-lg border border-white/12 bg-white/[0.05] px-2 py-2 text-[14px] text-white [color-scheme:dark]" />
                            <span className="mt-1 block text-[11px] font-semibold text-orchid">{clockLabel(v.end) || " "}</span>
                          </label>
                          {(v.start || v.end) && (
                            <button
                              onClick={() => setSchedule((sc) => {
                                const copy = { ...sc };
                                delete copy[dayKey];
                                return copy;
                              })}
                              className="col-span-2 text-left text-[12px] font-semibold text-white/40"
                            >
                              Clear this day
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
                <span className="font-bold">{formatHours(totalHours) || "Nothing"} scheduled</span>
                {minHours > 0 && (
                  <span className="mt-1 block">
                    {scheduleOk
                      ? `That meets the ${formatHours(minHours)} minimum.`
                      : `This job needs at least ${formatHours(minHours)}.`}
                  </span>
                )}
              </div>
            </>
          )}

          {/* --------------------------- agreement --------------------------- */}
          {key === "agreement" && (
            <>
              <h2 className="font-display text-xl font-extrabold text-white">The agreement</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">
                Independent Contractor Agreement · Sarvesh Mohanrajh, operating under Infinite Distribution ·
                ABN 66 177 274 211
              </p>

              <div className="mt-4 max-h-[52vh] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <ul className="space-y-2.5 text-[13px] leading-relaxed text-white/70">
                  <li className="font-semibold text-white/90">{junkMailTerm(d.junkMailAllowed)}</li>
                  <li>
                    This covers {d.leaflets ? `${d.leaflets.toLocaleString()} leaflets` : "the leaflets"} in{" "}
                    {d.area || "the area shown"}, paying {money(d.pay)}
                    {d.dueDate ? `, to be completed by ${longDate(d.dueDate)}` : ""}.
                  </li>
                  {!d.scheduleOptional && days.length > 0 && (
                    <li>
                      Days agreed:{" "}
                      {days.sort(([a], [b]) => a.localeCompare(b)).map(([k2, v]) =>
                        `${new Date(`${k2}T00:00:00`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })} ${clockLabel(v.start)}–${clockLabel(v.end)}`
                      ).join("; ")}.
                    </li>
                  )}
                  {d.scheduleOptional && (
                    <li>No fixed schedule for this job — the drop is to be completed by the due date.</li>
                  )}
                  {CONTRACT_TERMS.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/12 bg-white/[0.04] p-4">
                <input type="checkbox" checked={readTerms} onChange={(e) => setReadTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-orchid" />
                <span className="text-[13px] leading-relaxed text-white/70">I&apos;ve read the agreement above.</span>
              </label>
            </>
          )}

          {/* ------------------------------ sign ------------------------------ */}
          {key === "sign" && (
            <>
              <h2 className="font-display text-xl font-extrabold text-white">Sign to accept</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">
                Sign with your finger, tick to agree, and the job is yours.
              </p>

              <label className="mt-5 block">
                <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-white/40">Your full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[16px] text-white outline-none focus:border-orchid/60" />
              </label>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-white/40">
                  Your email <span className="text-white/25">— so we can send you a copy</span>
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[16px] text-white outline-none focus:border-orchid/60"
                />
                {!email.trim() && (
                  <span className="mt-1.5 block text-[12px] text-white/40">
                    Leave it blank and you&apos;ll need to save a copy to your phone instead.
                  </span>
                )}
              </label>

              <div className="mt-4">
                <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wide text-white/40">Signature</span>
                <SignaturePad onChange={setSig} />
              </div>

              <p className="mt-3 text-[13px] text-white/45">
                Dated {longDate(iso(new Date()))}.
              </p>

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

          {/* ------------------------------- map ------------------------------- */}
          {key === "map" && (
            <>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-xl text-emerald-300">✓</span>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-extrabold text-white">
                    {arrivedSigned ? "Already signed" : "Job accepted"}
                  </h2>
                  <p className="mt-1 text-[13px] text-emerald-100/65">
                    {d.title} is yours{d.signed?.date ? ` — signed ${longDate(d.signed.date)}` : ""}. Here&apos;s
                    where you&apos;ll be working.
                  </p>
                </div>
              </div>

              {/*
                Everyone leaves with a copy. Emailed where they gave an address,
                and where they didn't, saved to the phone before the map — the
                agreement is theirs as much as it is the office's.
              */}
              {!arrivedSigned && (
              <div className={`mt-5 rounded-2xl border px-4 py-4 ${
                sentTo || savedCopy
                  ? "border-emerald-400/30 bg-emerald-500/[0.08]"
                  : "border-amber-400/40 bg-amber-500/[0.1]"}`}>
                {sentTo ? (
                  <p className="text-[14px] leading-relaxed text-emerald-100">
                    A copy has been emailed to <span className="font-semibold">{sentTo}</span>, and the
                    office has one.
                  </p>
                ) : savedCopy ? (
                  <p className="text-[14px] leading-relaxed text-emerald-100">
                    Saved to your phone. The office has a copy too.
                  </p>
                ) : (
                  <>
                    <p className="font-display text-[15px] font-bold text-white">Keep a copy</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-amber-100/80">
                      {d.signed?.name && !email.trim()
                        ? "You didn't give an email, so save the agreement to your phone now."
                        : "Save the agreement to your phone so you have your own copy."}
                    </p>
                  </>
                )}
                {!sentTo && (
                  <button
                    onClick={saveCopy}
                    disabled={saving}
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-electric to-orchid px-5 py-3 font-display text-[14px] font-bold text-white"
                  >
                    {saving ? "Preparing…" : savedCopy ? "Save it again" : "Save a copy to my phone"}
                  </button>
                )}
              </div>
              )}

              {!located && specHasDrawing(spec) && (
                <button
                  onClick={() => setLocated(true)}
                  className="mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-orchid/40 bg-gradient-to-r from-electric/20 to-orchid/15 px-5 py-4 text-left"
                >
                  <span>
                    <span className="block font-display text-[15px] font-bold text-white">Show where I am</span>
                    <span className="mt-0.5 block text-[13px] text-white/55">
                      Your phone will ask to share your location — it stays on your phone.
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 text-white/45">&rarr;</span>
                </button>
              )}

              <div className={`mt-4 ${sentTo || savedCopy || arrivedSigned ? "" : "pointer-events-none opacity-30"}`}>
                {specHasDrawing(spec) ? (
                  <BoundaryMap spec={spec} center={parseCenter(d.mapCenter)} height={420} locate={located} />
                ) : (
                  <div className="grid h-48 place-items-center rounded-2xl border border-white/12 bg-white/[0.03] px-6 text-center text-[14px] text-white/45">
                    No area has been drawn for this job yet — the office will send it through.
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {facts.map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">{k}</p>
                    <p className="mt-0.5 text-[15px] font-semibold text-white">{v}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-white/40">
                Keep this link — it&apos;s how you get back to your area and your terms.
              </p>
            </>
          )}
        </div>

        {notice && (
          <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-400/40 bg-amber-500/12 px-4 py-3.5 text-[14px] leading-relaxed text-amber-100">
            <span aria-hidden className="mt-0.5 shrink-0 font-bold">!</span>
            <span>{notice}</span>
          </p>
        )}

        {key !== "map" && (
          <div className="mt-4 flex items-center gap-2">
            {at > 0 && (
              <button onClick={() => setAt(at - 1)}
                className="shrink-0 rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-4 font-display text-[14px] font-bold text-white/60">
                Back
              </button>
            )}
            <button onClick={next} disabled={busy}
              className="flex-1 rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-4 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)]">
              {label}
            </button>
          </div>
        )}

        {/*
          Off-screen, and only once there's something to keep. Positioned rather
          than hidden: a display:none element has no size, and nothing can be
          captured from it.
        */}
        {d.signed && (
          <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0">
            <div id="contract-sheet" style={{ width: 820 }} className="bg-white px-12 py-12 text-ink">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                Independent Contractor Agreement
              </h1>
              <p className="mt-2 text-[15px] text-ink/70">
                Sarvesh Mohanrajh, operating under Infinite Distribution · ABN 66 177 274 211
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
                {([
                  ["Contractor", d.signed.name],
                  ["Job", d.title],
                  ["Area", d.area || "—"],
                  ["Leaflets", d.leaflets ? d.leaflets.toLocaleString() : "—"],
                  ["Payment", money(d.pay)],
                  ["Minimum hours", tidyHours(d.minHours) || "—"],
                  ["Start", longDate(d.startDate)],
                  ["Due", longDate(d.dueDate)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">{k}</p>
                    <p className="mt-0.5 font-semibold text-ink">{v}</p>
                  </div>
                ))}
              </div>

              <h2 className="mt-8 font-display text-xl font-bold text-ink">Agreed schedule</h2>
              {d.scheduleOptional ? (
                <p className="mt-2 text-[15px] text-ink/70">
                  No fixed schedule for this job — the drop is to be completed by the due date above.
                </p>
              ) : days.length ? (
                <table className="mt-3 w-full border-collapse text-[14px]">
                  <tbody>
                    {days.sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => (
                      <tr key={k}>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">
                          {new Date(`${k}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                        </td>
                        <td className="border border-slate-300 px-3 py-2">Start: {clockLabel(v.start) || "—"}</td>
                        <td className="border border-slate-300 px-3 py-2">End: {clockLabel(v.end) || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-[15px] text-ink/70">No days were recorded.</p>
              )}

              <h2 className="mt-8 font-display text-xl font-bold text-ink">Terms</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-ink/80">
                <li className="font-semibold text-ink">{junkMailTerm(d.junkMailAllowed)}</li>
                {CONTRACT_TERMS.map((t) => <li key={t}>{t}</li>)}
              </ul>

              <h2 className="mt-8 font-display text-xl font-bold text-ink">Signatures</h2>
              <div className="mt-3 grid grid-cols-2 gap-8 text-[15px]">
                <div>
                  <p className="text-[13px] font-bold uppercase tracking-wide text-ink/50">Contractor</p>
                  {sig && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={sig} alt="Signature"
                      className="mt-2 h-24 w-full rounded border border-slate-300 bg-slate-900 object-contain p-2" />
                  )}
                  <p className="mt-2 font-semibold text-ink">{d.signed.name}</p>
                  <p className="text-[14px] text-ink/70">Date: {longDate(d.signed.date)}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold uppercase tracking-wide text-ink/50">
                    Infinite Distribution representative
                  </p>
                  <p className="mt-[72px] font-semibold text-ink">Sarvesh Mohanrajh</p>
                  <p className="text-[14px] text-ink/70">Date: {longDate(d.signed.date)}</p>
                </div>
              </div>

              <p className="mt-8 text-[13px] leading-relaxed text-ink/55">
                Signed electronically through the Infinite Distribution team portal. By signing, the
                contractor confirmed they had read and agreed to these terms and that they are engaged as
                an independent subcontractor, not an employee.
              </p>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[12px] text-white/25">
          Infinite Distribution · ABN 66 177 274 211
        </p>
      </div>
    </main>
  );
}
