"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

/** Animated aurora backdrop shared by every portal screen. */
export function PortalBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-[#07060f]">
      <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] animate-aurora-a rounded-full bg-[radial-gradient(circle,#4f46e5_0%,transparent_65%)] opacity-50 blur-[90px]" />
      <div className="absolute -right-40 top-[6%] h-[32rem] w-[32rem] animate-aurora-b rounded-full bg-[radial-gradient(circle,#b66dc7_0%,transparent_65%)] opacity-40 blur-[90px]" />
      <div className="absolute bottom-[-18%] left-[35%] h-[30rem] w-[30rem] animate-aurora-c rounded-full bg-[radial-gradient(circle,#0891b2_0%,transparent_65%)] opacity-30 blur-[90px]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at 50% 20%, #000 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 20%, #000 0%, transparent 75%)",
        }}
      />
    </div>
  );
}

export function PortalMark({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span
        className={`grid place-items-center rounded-xl bg-gradient-to-br from-electric to-orchid shadow-[0_8px_26px_-8px_rgba(182,109,199,0.8)] ${
          small ? "h-9 w-9" : "h-11 w-11"
        }`}
      >
        <svg viewBox="0 0 24 24" className={small ? "h-4.5 w-4.5" : "h-5 w-5"} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="9" width="16" height="11" rx="2.5" />
          <path d="M4.5 10.5L12 15l7.5-4.5M12 15v5" />
          <path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
        </svg>
      </span>
      <span className={`font-display font-extrabold uppercase tracking-tight text-white ${small ? "text-base" : "text-lg"}`}>
        Infinite <span className="text-white/50">Portal</span>
      </span>
    </Link>
  );
}

export function GlassCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[28px] border border-white/10 bg-white/[0.045] backdrop-blur-xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * A button that shows its own progress.
 *
 * Saving hits the database and then reloads the dashboard, which takes a beat.
 * Rather than leave the button looking untouched, it fills left-to-right while
 * the work runs so the press obviously landed.
 */
export function ActionButton({
  onClick, children, className = "", disabled = false, busyLabel,
}: {
  onClick: () => void | Promise<unknown>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  busyLabel?: string;
}) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onClick();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={disabled || busy}
      aria-busy={busy}
      className={`relative overflow-hidden ${className}`}
    >
      {busy && (
        <span aria-hidden className="idp-fill pointer-events-none absolute inset-y-0 left-0 bg-white/25" />
      )}
      <span className="relative">{busy && busyLabel ? busyLabel : children}</span>
    </button>
  );
}
