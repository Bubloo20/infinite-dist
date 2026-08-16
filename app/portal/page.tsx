"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PortalBackdrop, PortalMark, Loading } from "@/components/portal/PortalShell";
import LoginGate from "@/components/portal/LoginGate";
import MyEarnings from "@/components/portal/MyEarnings";
import JobMarket from "@/components/portal/JobMarket";

export default function PortalPage() {
  const [role, setRole] = useState<"worker" | "admin" | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"jobs" | "earnings">("jobs");
  const [refreshKey, setRefreshKey] = useState(0);
  const [impersonating, setImpersonating] = useState(false);

  // Set by the admin "View as" action so we can offer a way back.
  useEffect(() => {
    setImpersonating(document.cookie.split("; ").some((c) => c.startsWith("idp_impersonating=1")));
  }, []);

  const returnToAdmin = async () => {
    await fetch("/api/portal/admin/impersonate", { method: "DELETE" });
    window.location.href = "/portal/admin";
  };

  const loadSession = useCallback(() => {
    fetch("/api/portal/session")
      .then((r) => r.json())
      .then((d) => {
        // An admin belongs on their own dashboard, not the worker view — unless
        // they've deliberately stepped into someone's account.
        const asWorker = document.cookie.split("; ").some((c) => c.startsWith("idp_impersonating=1"));
        if (d.role === "admin" && !asWorker) {
          window.location.replace("/portal/admin");
          return;
        }
        setRole(d.role);
        setFullName(d.fullName || null);
        setLoading(false);
      })
      .catch(() => { setRole(null); setLoading(false); });
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
          <Loading label="Loading" />
        </div>
      ) : !role ? (
        <LoginGate mode="worker" onSuccess={() => { setLoading(true); loadSession(); }} />
      ) : (
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-16 xl:max-w-[1600px]">
          {impersonating && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3.5">
              <p className="text-sm text-amber-100">
                <span className="font-bold">Viewing as {fullName || "a worker"}</span> — changes you make here are saved to their account.
              </p>
              <button onClick={returnToAdmin}
                className="rounded-xl bg-amber-400/90 px-4 py-2 text-[13px] font-bold text-[#2b1a02] transition hover:bg-amber-300">
                ← Return to admin dashboard
              </button>
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-10">
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

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">
              {fullName ? `Signed in as ${fullName}` : "Team portal"}
            </p>
            <h1 className="mt-3 font-display text-[clamp(1.9rem,7vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
              Your <span className="bg-gradient-to-r from-[#8b93ff] to-orchid bg-clip-text text-transparent">work</span>
            </h1>
          </motion.div>

          {/* Narrow screens tab between the two; wide ones show both at once. */}
          <div className="mb-7 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 xl:hidden">
            {([["jobs", "Jobs"], ["earnings", "Earnings"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => { setTab(k); if (k === "earnings") setRefreshKey((n) => n + 1); }}
                className={`rounded-xl py-2.5 text-sm font-bold transition ${
                  tab === k ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_10px_26px_-12px_rgba(182,109,199,0.9)]" : "text-white/50 hover:text-white/80"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="xl:hidden">
            {tab === "jobs" ? <JobMarket workerName={fullName || ""} /> : <MyEarnings key={refreshKey} />}
          </div>

          {/* Side by side, each column scrolling on its own. */}
          <div className="hidden gap-5 xl:grid xl:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
            <section className="min-w-0">
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-white/40">Available jobs</h2>
              <div className="max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
                <JobMarket workerName={fullName || ""} only="available" />
              </div>
            </section>
            <section className="min-w-0">
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-white/40">My jobs</h2>
              <div className="max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
                <JobMarket workerName={fullName || ""} only="mine" />
              </div>
            </section>
            <section className="min-w-0 xl:col-span-2 2xl:col-span-1">
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-white/40">Earnings</h2>
              <div className="max-h-[calc(100vh-14rem)] overflow-y-auto pr-2">
                <MyEarnings key={refreshKey} />
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
