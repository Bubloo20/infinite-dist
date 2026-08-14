"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PortalBackdrop, PortalMark } from "@/components/portal/PortalShell";
import LoginGate from "@/components/portal/LoginGate";
import WorkLogForm from "@/components/portal/WorkLogForm";
import MyEarnings from "@/components/portal/MyEarnings";

export default function PortalPage() {
  const [role, setRole] = useState<"worker" | "admin" | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"log" | "earnings">("log");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSession = useCallback(() => {
    fetch("/api/portal/session")
      .then((r) => r.json())
      .then((d) => { setRole(d.role); setFullName(d.fullName || null); })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadSession, [loadSession]);

  const signOut = async () => {
    await fetch("/api/portal/session", { method: "DELETE" });
    setRole(null);
    setFullName(null);
  };

  return (
    <main className="relative min-h-[100svh]">
      <PortalBackdrop />

      {loading ? (
        <div className="relative z-10 grid min-h-[100svh] place-items-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-orchid" />
        </div>
      ) : !role ? (
        <LoginGate mode="worker" onSuccess={() => { setLoading(true); loadSession(); }} />
      ) : (
        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <PortalMark small />
            <div className="flex items-center gap-3">
              {role === "admin" && (
                <Link href="/portal/admin" className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[13px] font-semibold text-white/70 transition hover:bg-white/[0.09] hover:text-white">
                  Admin dashboard →
                </Link>
              )}
              <button onClick={signOut} className="text-sm font-semibold text-white/40 transition hover:text-white/80">Sign out</button>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">
              {fullName ? `Signed in as ${fullName}` : "Team portal"}
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
              Your <span className="bg-gradient-to-r from-[#8b93ff] to-orchid bg-clip-text text-transparent">work</span>
            </h1>
          </motion.div>

          <div className="mb-7 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {([["log", "Log a shift"], ["earnings", "Earnings & history"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => { setTab(k); if (k === "earnings") setRefreshKey((n) => n + 1); }}
                className={`rounded-xl py-2.5 text-sm font-bold transition ${
                  tab === k ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_10px_26px_-12px_rgba(182,109,199,0.9)]" : "text-white/50 hover:text-white/80"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "log" ? (
            <WorkLogForm onDone={() => setRefreshKey((n) => n + 1)} />
          ) : (
            <MyEarnings key={refreshKey} />
          )}
        </div>
      )}
    </main>
  );
}
