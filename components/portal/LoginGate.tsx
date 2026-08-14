"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { GlassCard, PortalMark } from "./PortalShell";

const inputCls =
  "w-full rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3.5 text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-orchid/15";

export default function LoginGate({
  mode,
  onSuccess,
}: {
  mode: "worker" | "admin";
  onSuccess: (role: "worker" | "admin") => void;
}) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = mode === "admin";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const signingUp = !isAdmin && tab === "signup";
      const res = await fetch(signingUp ? "/api/portal/register" : "/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isAdmin
            ? { password, role: "admin" }
            : signingUp
              ? { fullName, password, teamPassword }
              : { fullName, password },
        ),
      });
      const data = await res.json();
      if (data.ok) onSuccess(data.role);
      else {
        setError(data.error || "Something went wrong.");
        setPassword("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-9 flex justify-center">
          <PortalMark />
        </motion.div>

        <GlassCard className="p-8 sm:p-10" delay={0.08}>
          {!isAdmin && (
            <div className="mb-7 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setError(""); }}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${
                    tab === t ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_10px_26px_-12px_rgba(182,109,199,0.9)]" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {t === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          )}

          <h1 className="text-center font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {isAdmin ? "Admin access" : tab === "signin" ? "Welcome back" : "Join the team portal"}
          </h1>
          <p className="mt-3 text-center text-[15px] leading-relaxed text-white/55">
            {isAdmin
              ? "Enter the admin password to manage work logs and payments."
              : tab === "signin"
                ? "Sign in with your name and password to log a run."
                : "Create your account with the team password."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {!isAdmin && (
              <div>
                <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Full name</label>
                <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sam Rhoades" autoComplete="name" required />
              </div>
            )}

            {!isAdmin && tab === "signup" && (
              <div>
                <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Team password</label>
                <input className={inputCls} type="password" value={teamPassword} onChange={(e) => setTeamPassword(e.target.value)} placeholder="Ask the office" required />
              </div>
            )}

            <div>
              <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">
                {isAdmin ? "Admin password" : tab === "signup" ? "Choose a password" : "Your password"}
              </label>
              <input
                className={inputCls}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                required
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-4 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5 disabled:opacity-45 disabled:hover:translate-y-0"
            >
              {busy ? "Please wait…" : isAdmin ? "Sign in" : tab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </GlassCard>

        <p className="mt-7 text-center text-[13px] text-white/35">Private area for Infinite Distributions team members.</p>
      </div>
    </div>
  );
}
