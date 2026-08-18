"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PortalMark } from "./PortalShell";

const inputCls =
  "w-full rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3.5 text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] focus:ring-4 focus:ring-orchid/15";

function PasswordField({
  label, value, onChange, autoComplete, placeholder = "••••••••",
}: {
  label: string; value: string; onChange: (v: string) => void;
  autoComplete: string; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className={`${inputCls} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-white/45 transition hover:bg-white/[0.07] hover:text-white/85"
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
    </div>
  );
}

export default function LoginGate({
  mode, onSuccess,
}: {
  mode: "worker" | "admin";
  onSuccess: (role: "worker" | "admin") => void;
}) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);
  const nameBox = useRef<HTMLDivElement>(null);

  const isAdmin = mode === "admin";

  // Names complete as they type — the lookup needs three characters and returns
  // a handful, so the roster can't be read off this page.
  useEffect(() => {
    if (isAdmin || fullName.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/portal/name-suggest?q=${encodeURIComponent(fullName.trim())}`);
        const d = await r.json();
        const names: string[] = d.names || [];
        setSuggestions(names.filter((n) => n.toLowerCase() !== fullName.trim().toLowerCase()));
        setShowList(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [fullName, isAdmin]);

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (nameBox.current && !nameBox.current.contains(e.target as Node)) setShowList(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);


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
          isAdmin ? { password, role: "admin", remember }
            : signingUp ? { fullName, password, teamPassword, remember }
            : { fullName, password, remember },
        ),
      });
      const data = await res.json();
      if (data.ok) {
        // Let the confirmation play before the portal swaps in.
        setSuccess(true);
        setTimeout(() => onSuccess(data.role), 900);
        return;
      } else {
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
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-9 flex justify-center"
        >
          <div className="relative">
            {/* orbiting ring + glow behind the mark */}
            <div aria-hidden className="animate-orbit pointer-events-none absolute -inset-5 rounded-full border border-dashed border-white/10" />
            <div aria-hidden className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.30),transparent_70%)] blur-xl" />
            <PortalMark />
          </div>
        </motion.div>

        <div className="relative overflow-hidden rounded-[28px]">
          <div aria-hidden className="animate-sheen pointer-events-none absolute inset-y-0 -left-1/3 z-10 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <GlassCard className="p-8 sm:p-10" delay={0.08}>
          {!isAdmin && (
            <div className="mb-7 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              {(["signin", "signup"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { setTab(t); setError(""); setFullName(""); }}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${
                    tab === t ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_10px_26px_-12px_rgba(182,109,199,0.9)]" : "text-white/50 hover:text-white/80"}`}>
                  {t === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          )}

          <h1 className="text-center font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {isAdmin ? "Admin access" : tab === "signin" ? "Welcome back" : "Join the team portal"}
          </h1>
          <p className="mt-3 text-center text-[15px] leading-relaxed text-white/55">
            {isAdmin ? "Enter the admin password to manage work logs and payments."
              : tab === "signin" ? "Sign in with your name and password to log a run."
              : "Create your account with the team password."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {!isAdmin && (
              <div ref={nameBox}>
                <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">
                  Your name
                </label>
                <div className="relative">
                  <input
                    className={inputCls}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => suggestions.length && setShowList(true)}
                    placeholder={tab === "signup" ? "Start typing to find your name…" : "Start typing your name…"}
                    autoComplete="off"
                    required
                  />
                  {/* Names surface as they type rather than as a list, so nobody
                      can read the roster just by opening this page. */}
                  <AnimatePresence>
                    {showList && suggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/12 bg-[#141024] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
                      >
                        {suggestions.map((n) => (
                          <li key={n}>
                            <button type="button"
                              onClick={() => { setFullName(n); setShowList(false); }}
                              className="flex w-full items-center gap-3 px-5 py-3 text-left text-[15px] text-white/80 transition hover:bg-white/[0.08] hover:text-white">
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-electric to-orchid text-[11px] font-bold text-white">
                                {n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                              </span>
                              {n}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
                <p className="mt-2 text-[13px] text-white/35">
                  {tab === "signin"
                    ? "Start typing and pick your name, then enter your password."
                    : "Start typing your name and pick it from the list, then choose a password. Not there? Ask to be added."}
                </p>
              </div>
            )}

            {!isAdmin && tab === "signup" && (
              <PasswordField label="Team password" value={teamPassword} onChange={setTeamPassword} autoComplete="off" placeholder="Ask the office" />
            )}

            <PasswordField
              label={isAdmin ? "Admin password" : tab === "signup" ? "Choose a password" : "Your password"}
              value={password}
              onChange={setPassword}
              autoComplete={tab === "signup" && !isAdmin ? "new-password" : "current-password"}
            />

            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </motion.p>
            )}

            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-white/55">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-[#7c3aed]" />
              Stay signed in on this device — until you sign out
            </label>

            <button type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-4 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5 disabled:opacity-45 disabled:hover:translate-y-0">
              {busy ? "Please wait…" : isAdmin ? "Sign in" : tab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Confirmation that plays before the portal loads. */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 grid place-items-center rounded-[28px] bg-[#0b0918]/92 backdrop-blur-sm"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_16px_44px_-14px_rgba(16,185,129,0.9)]"
                  >
                    <motion.svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <motion.path d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }} />
                    </motion.svg>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="mt-4 font-display text-lg font-bold text-white"
                  >
                    Signed in
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
        </div>

        {/* Switch between the two sign-ins, and a way back to the site. */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <Link href={isAdmin ? "/portal" : "/portal/admin"}
            className="w-full rounded-2xl border border-white/12 bg-white/[0.05] px-6 py-3.5 text-center font-display text-[15px] font-bold text-white/80 transition hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-white">
            {isAdmin ? "Worker sign-in" : "Admin login"}
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/40 transition hover:text-white/80">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back to website
          </Link>
        </div>

        <p className="mt-6 text-center text-[13px] text-white/35">Private area for Infinite Distribution team members.</p>
      </div>
    </div>
  );
}
