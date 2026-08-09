"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PortalBackdrop, PortalMark } from "@/components/portal/PortalShell";
import LoginGate from "@/components/portal/LoginGate";
import WorkLogForm from "@/components/portal/WorkLogForm";

export default function PortalPage() {
  const [role, setRole] = useState<"worker" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/session")
      .then((r) => r.json())
      .then((d) => setRole(d.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    await fetch("/api/portal/session", { method: "DELETE" });
    setRole(null);
  };

  return (
    <main className="relative min-h-[100svh]">
      <PortalBackdrop />

      {loading ? (
        <div className="relative z-10 grid min-h-[100svh] place-items-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-orchid" />
        </div>
      ) : !role ? (
        <LoginGate
          role="worker"
          title="Team portal"
          subtitle="Enter your team password to log a completed run."
          onSuccess={setRole}
        />
      ) : (
        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <PortalMark small />
            {role === "admin" && (
              <Link
                href="/portal/admin"
                className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[13px] font-semibold text-white/70 transition hover:bg-white/[0.09] hover:text-white"
              >
                Admin dashboard →
              </Link>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-9"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">Log a shift</p>
            <h1 className="mt-4 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
              Record your{" "}
              <span className="bg-gradient-to-r from-[#8b93ff] to-orchid bg-clip-text text-transparent">completed run</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/55">
              Fill this in when you finish a job. Your Strava activity is checked automatically before it&apos;s sent to the office.
            </p>
          </motion.div>

          <WorkLogForm onSignOut={signOut} />
        </div>
      )}
    </main>
  );
}
