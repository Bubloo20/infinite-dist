"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** The infinity mark, drawn so it tiles crisply at any size. */
function InfinityMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={className} fill="none" aria-hidden="true">
      <path
        d="M100 50c-12-19-24-28-38-28a28 28 0 1 0 0 56c14 0 26-9 38-28zm0 0c12 19 24 28 38 28a28 28 0 1 0 0-56c-14 0-26 9-38 28z"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The intro the site opens on — a tiled infinity watermark, the mark lighting up
 * behind a sweep of brand purple, then the wordmark. Shown once per browser tab
 * so moving around the site doesn't replay it.
 */
export default function LoadingScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("idp_intro") === "1";
    } catch {
      /* private mode — just show it */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) return;

    setShow(true);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
      try {
        sessionStorage.setItem("idp_intro", "1");
      } catch {
        /* ignore */
      }
    }, 2200);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-[#080808]"
        >
          {/* Tiled watermark */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-6 opacity-[0.05]">
            {Array.from({ length: 9 }).map((_, row) => (
              <div
                key={row}
                className="flex shrink-0 justify-center gap-10"
                style={{ transform: `translateX(${row % 2 ? "-3.5rem" : "3.5rem"})` }}
              >
                {Array.from({ length: 9 }).map((_, col) => (
                  <span key={col} className="relative shrink-0 text-white/80">
                    <InfinityMark className="h-[52px] w-[104px]" />
                    <span className="absolute inset-0 grid place-items-center text-[10px] font-extrabold tracking-[0.18em] text-white/70">
                      INFINITE
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Purple bloom behind the mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0.55], scale: [0.6, 1.15, 1] }}
            transition={{ duration: 1.8, ease: "easeOut", times: [0, 0.55, 1] }}
            className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(182,109,199,0.55)_0%,rgba(124,58,237,0.22)_38%,transparent_70%)] blur-2xl"
          />

          <div className="relative flex flex-col items-center">
            {/* The mark, drawn on by a sweep of light */}
            <motion.div
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <InfinityMark className="h-[110px] w-[220px] text-white drop-shadow-[0_0_28px_rgba(182,109,199,0.55)]" />
              <span className="absolute inset-0 grid place-items-center font-display text-[19px] font-extrabold tracking-[0.16em] text-white">
                INFINITE
              </span>
              <motion.span
                initial={{ x: "-130%" }}
                animate={{ x: "130%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.35 }}
                className="pointer-events-none absolute inset-y-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)] blur-md"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 font-display text-[13px] font-semibold tracking-[0.42em] text-white/70 sm:text-[15px]"
            >
              INFINITE DISTRIBUTION
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
