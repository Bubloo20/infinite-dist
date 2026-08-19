"use client";

import { useState } from "react";
import { GlassCard, ActionButton } from "./PortalShell";

const field =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder-white/30 outline-none transition focus:border-orchid/60";

/**
 * Your account.
 *
 * Everyone starts on a password the office handed out — their first name — so
 * the one thing this needs to do well is let someone replace it with something
 * only they know.
 */
export default function AccountSettings({ fullName }: { fullName: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const save = async () => {
    setMsg(""); setOk(false);
    if (next !== again) { setMsg("The two new passwords don't match."); return; }
    if (next.trim().length < 4) { setMsg("Use at least four characters."); return; }
    const r = await fetch("/api/portal/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const d = await r.json();
    if (!d.ok) { setMsg(d.error || "Couldn't change your password."); return; }
    setOk(true);
    setMsg("Password changed. Use the new one next time you sign in.");
    setCurrent(""); setNext(""); setAgain("");
  };

  return (
    <GlassCard className="p-5 sm:p-7">
      <h2 className="font-display text-lg font-bold text-white">Settings</h2>
      <p className="mt-1 text-[13px] text-white/45">
        Signed in as <span className="font-semibold text-white/70">{fullName || "you"}</span>
      </p>

      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="font-display text-[15px] font-bold text-white">Change your password</h3>
        <p className="mt-1 text-[13px] text-white/45">
          If you&apos;ve never changed it, your current password is your first name with a capital letter.
        </p>

        <div className="mt-4 grid gap-3 sm:max-w-md">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-white/40">Current password</span>
            <input type="password" className={field} value={current} autoComplete="current-password"
              onChange={(e) => setCurrent(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-white/40">New password</span>
            <input type="password" className={field} value={next} autoComplete="new-password"
              onChange={(e) => setNext(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-white/40">New password again</span>
            <input type="password" className={field} value={again} autoComplete="new-password"
              onChange={(e) => setAgain(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }} />
          </label>

          {msg && (
            <p className={`rounded-xl border px-4 py-3 text-[13px] ${
              ok ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                 : "border-rose-400/25 bg-rose-500/10 text-rose-200"}`}>
              {msg}
            </p>
          )}

          <ActionButton
            className="rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-3 font-display text-[14px] font-bold text-white"
            busyLabel="Saving…"
            onClick={save}
          >
            Change password
          </ActionButton>
        </div>
      </div>
    </GlassCard>
  );
}
