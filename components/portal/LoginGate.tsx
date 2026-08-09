"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { GlassCard, PortalMark } from "./PortalShell";

export default function LoginGate({
  role,
  title,
  subtitle,
  onSuccess,
}: {
  role: "worker" | "admin";
  title: string;
  subtitle: string;
  onSuccess: (role: "worker" | "admin") => void;
}) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role }),
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess(data.role);
      } else {
        setError(data.error || "Incorrect password.");
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-9 flex justify-center"
        >
          <PortalMark />
        </motion.div>

        <GlassCard className="p-9 sm:p-10" delay={0.08}>
          <div className="flex justify-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/12 bg-white/[0.06]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#c4b5fd" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
                <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
                <circle cx="12" cy="15" r="1.4" />
              </svg>
            </span>
          </div>

          <h1 className="mt-6 text-center font-display text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-3 text-center text-[15px] leading-relaxed text-white/55">{subtitle}</p>

          <form onSubmit={submit} className="mt-8">
            <label htmlFor="portal-password" className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.12em] text-white/50">
              Password
            </label>
            <div className="relative">
              <input
                id="portal-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
                required
                placeholder="••••••••••"
                className="w-full rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-4 pr-14 text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-orchid/15"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-white/45 transition hover:bg-white/[0.06] hover:text-white/80"
              >
                {show ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8" />
                    <path d="M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4.5 9 7 0 .9-.7 2.2-1.8 3.4M6.2 6.7C4.1 8.1 3 10 3 12c0 2.5 4 7 9 7 1.2 0 2.3-.2 3.3-.7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" />
                    <circle cx="12" cy="12" r="2.6" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4.5M12 16h.01" />
                </svg>
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={busy || !password}
              className="group mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-4 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              {busy ? "Checking…" : "Sign in"}
              {!busy && (
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>
        </GlassCard>

        <p className="mt-7 text-center text-[13px] text-white/35">
          Private area for Infinite Distributions team members.
        </p>
      </div>
    </div>
  );
}
