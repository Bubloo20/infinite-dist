"use client";

import { useState } from "react";
import { GlassCard, ActionButton } from "./PortalShell";
import { SignaturePad } from "./JobContract";

const money = (v: number | null) =>
  v == null ? "—" : `$${v.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The pay on this job isn't what they signed for.
 *
 * Everything else in the agreement stands — the area, the dates, the days they
 * already put down — so the only thing to do here is read the new figure and
 * put their name to it. Making them fill the whole schedule in again to agree
 * to a number would be a good way to have nobody agree to anything.
 */
export default function PayChangeNotice({
  jobId, assignmentId, workerName, agreedPay, nowPay, onAgreed,
}: {
  jobId: number;
  assignmentId: number | null;
  workerName: string;
  agreedPay: number | null;
  nowPay: number | null;
  onAgreed: () => void;
}) {
  const [name, setName] = useState(workerName);
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const better = (nowPay ?? 0) > (agreedPay ?? 0);

  const agree = async () => {
    setErr("");
    if (!name.trim()) { setErr("Put your name in."); return; }
    if (!signature) { setErr("Sign in the box to agree."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/portal/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign", jobId, assignmentId,
          signedName: name.trim(), signaturePng: signature,
          signedDate: new Date().toISOString().slice(0, 10),
          // Signing the new figure is the agreement.
          agreed: true,
          // No schedule: the days already agreed are kept as they are.
        }),
      });
      const d = await r.json().catch(() => ({ ok: false }));
      if (!d.ok) { setErr(d.error || "Couldn't record that — try again."); return; }
      onAgreed();
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="border-amber-400/40 bg-amber-500/[0.07] p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Your pay for this job has changed</p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">You signed for</p>
          <p className="font-display text-2xl font-extrabold text-white/40 line-through">{money(agreedPay)}</p>
        </div>
        <span aria-hidden className="pb-2 text-xl text-white/30">&rarr;</span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">Now</p>
          <p className={`font-display text-3xl font-extrabold ${better ? "text-emerald-300" : "text-amber-200"}`}>
            {money(nowPay)}
          </p>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-white/70">
        Nothing else has changed — the area, the dates and the days you put down all stand. Read the new
        amount, then sign to agree to it. You don&apos;t need to fill your hours in again.
      </p>

      <label className="mt-5 block max-w-sm">
        <span className="mb-1.5 block text-[12px] font-semibold text-white/45">Your full name</span>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[15px] text-white outline-none transition focus:border-orchid/60" />
      </label>

      <div className="mt-4">
        <span className="mb-1.5 block text-[12px] font-semibold text-white/45">Sign here</span>
        <SignaturePad onChange={setSignature} />
      </div>

      {err && (
        <p className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-2.5 text-[13px] text-rose-200">
          {err}
        </p>
      )}

      <ActionButton
        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-3.5 font-display text-[15px] font-bold text-white sm:w-auto"
        busyLabel="Saving…"
        onClick={agree}
      >
        {busy ? "Saving…" : `Agree to ${money(nowPay)}`}
      </ActionButton>
    </GlassCard>
  );
}
