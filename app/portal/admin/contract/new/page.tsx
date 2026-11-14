"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { smsHref, todayAu, tidyHours } from "@/lib/portal/text";

const input =
  "w-full rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2.5 text-[15px] text-white outline-none transition focus:border-orchid/60";

type Made = { token: string; id: number };

type Form = {
  workerName: string; title: string; area: string;
  leaflets: string; pay: string; minHours: string;
  startDate: string; dueDate: string;
  junkMailAllowed: boolean; scheduleOptional: boolean;
};

const EMPTY: Form = {
  workerName: "", title: "", area: "",
  leaflets: "", pay: "", minHours: "",
  startDate: "", dueDate: "",
  junkMailAllowed: false, scheduleOptional: false,
};

function Toggle({ label, hint, value, onChange }: {
  label: string; hint: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
        value ? "border-orchid/45 bg-orchid/10" : "border-white/12 bg-white/[0.04]"}`}>
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[12px] font-bold ${
        value ? "border-orchid bg-orchid text-white" : "border-white/25 text-transparent"}`}>✓</span>
      <span>
        <span className="block text-[14px] font-bold text-white">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-white/45">{hint}</span>
      </span>
    </button>
  );
}

/**
 * An agreement typed by hand, with a link to sign it.
 *
 * For work that never became a job — a one-off, someone helping for a day,
 * a favour being done properly. The terms are the same ones every other
 * agreement carries; only who it is for and what it pays get typed. What
 * comes back is a link: whoever opens it reads it and signs, with no account
 * and nothing to install.
 */
export default function NewContractPage() {
  const [f, setF] = useState<Form>(EMPTY);
  const [made, setMade] = useState<Made | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    setF((p) => ({ ...p, startDate: p.startDate || todayAu() }));
  }, []);

  const link = made ? `${origin}/sign/${made.token}` : "";

  const create = async () => {
    setErr("");
    if (!f.title.trim() && !f.area.trim()) {
      setErr("Give the work a name or an area — that's what they'll see at the top.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/portal/admin/adhoc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...f,
          leaflets: f.leaflets === "" ? null : Number(f.leaflets),
          pay: f.pay === "" ? null : Number(f.pay),
        }),
      });
      const v = await r.json();
      if (!v.ok) { setErr(v.error || "Couldn't create that."); return; }
      setMade({ token: v.token, id: v.id });
    } catch {
      setErr("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { /* no clipboard */ }
    setTimeout(() => setCopied(false), 2600);
    try {
      const a = document.createElement("a");
      a.href = smsHref(`${f.title.trim() || f.area.trim()}\n${link}`);
      a.rel = "noopener";
      a.click();
    } catch {
      window.prompt("Copy this link", link);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0713] py-8">
      <div className="mx-auto w-full max-w-2xl px-5">
        <Link href="/portal/admin" className="text-sm font-semibold text-white/45 hover:text-white">
          ← Back to dashboard
        </Link>

        <h1 className="mt-4 font-display text-[clamp(1.6rem,5vw,2.2rem)] font-extrabold text-white">
          A contract on its own
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/50">
          For work that never became a job. Type the terms, send the link — they read it and sign on
          their phone, with no account.
        </p>

        {made ? (
          <div className="mt-6 rounded-[26px] border border-emerald-400/30 bg-emerald-500/[0.08] p-5 sm:p-7">
            <p className="font-display text-lg font-extrabold text-white">Ready to send</p>
            <p className="mt-1 text-[14px] text-emerald-100/70">
              {f.workerName.trim() ? `${f.workerName.trim()} ` : "Whoever you send this to "}
              opens it, reads the terms and signs. Both of you get a copy by email.
            </p>

            <p className="mt-4 break-all rounded-xl border border-white/12 bg-black/30 px-4 py-3 font-mono text-[12px] text-white/70">
              {link}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={send}
                className="rounded-xl bg-gradient-to-r from-electric to-orchid px-5 py-3 font-display text-[14px] font-bold text-white">
                {copied ? "Copied — opening messages" : "Send it"}
              </button>
              <a href={link} target="_blank" rel="noreferrer"
                className="rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 font-display text-[14px] font-bold text-white/75 transition hover:text-white">
                Open it myself
              </a>
              <button onClick={() => { setMade(null); setF({ ...EMPTY, startDate: todayAu() }); }}
                className="rounded-xl border border-white/12 px-5 py-3 font-display text-[14px] font-bold text-white/50 transition hover:text-white">
                Write another
              </button>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-white/40">
              The link is the only way in, and whoever holds it can sign as {f.workerName.trim() || "the person named"} —
              send it to them, not to a group. It doesn&apos;t expire.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[13px] font-semibold text-white/50">Who it&apos;s for</span>
                <input className={input} value={f.workerName} placeholder="Their name"
                  onChange={(e) => setF({ ...f, workerName: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-semibold text-white/50">What the work is</span>
                <input className={input} value={f.title} placeholder="Leaflet drop"
                  onChange={(e) => setF({ ...f, title: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-semibold text-white/50">Area</span>
                <input className={input} value={f.area} placeholder="Kew East"
                  onChange={(e) => setF({ ...f, area: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-semibold text-white/50">Leaflets</span>
                <input className={input} inputMode="numeric" value={f.leaflets} placeholder="1000"
                  onChange={(e) => setF({ ...f, leaflets: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-semibold text-white/50">Pay ($)</span>
                <input className={input} inputMode="decimal" value={f.pay} placeholder="65.00"
                  onChange={(e) => setF({ ...f, pay: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-semibold text-white/50">
                  Minimum hours {tidyHours(f.minHours) ? <span className="text-white/35">— {tidyHours(f.minHours)}</span> : null}
                </span>
                <input className={input} value={f.minHours} placeholder="3.5"
                  onChange={(e) => setF({ ...f, minHours: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-semibold text-white/50">Starts</span>
                <input type="date" className={input} value={f.startDate}
                  onChange={(e) => setF({ ...f, startDate: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[13px] font-semibold text-white/50">Due</span>
                <input type="date" className={input} value={f.dueDate}
                  onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
              </label>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Toggle label="Junk mail allowed" value={f.junkMailAllowed}
                hint="Whether they may put leaflets in letterboxes marked No Junk Mail."
                onChange={(v) => setF({ ...f, junkMailAllowed: v })} />
              <Toggle label="No schedule needed" value={f.scheduleOptional}
                hint="Skip the timesheet — they just finish it by the due date."
                onChange={(v) => setF({ ...f, scheduleOptional: v })} />
            </div>

            {err && (
              <p className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/12 px-4 py-3 text-[14px] text-amber-100">
                {err}
              </p>
            )}

            <button onClick={create} disabled={busy}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-4 font-display text-[15px] font-bold text-white">
              {busy ? "Writing it…" : "Create the contract & get a link"}
            </button>
            <p className="mt-2 text-[13px] text-white/35">
              The standard terms are added for you — this only asks for what changes.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
