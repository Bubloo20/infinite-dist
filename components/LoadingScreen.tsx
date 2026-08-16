"use client";

import { useEffect, useState } from "react";

const HOLD_MS = 2100;
const FADE_MS = 650;

/**
 * The intro the site opens on — the infinity mark turning under a travelling
 * band of purple light, then the wordmark.
 *
 * The fade-out is driven by state and a CSS transition rather than an
 * animation library: the overlay covers the whole site, so its removal has to
 * be guaranteed, not left to an exit hook. Shown once per browser tab.
 */
export default function LoadingScreen() {
  const [phase, setPhase] = useState<"idle" | "show" | "fading" | "done">("idle");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("idp_intro") === "1";
    } catch {
      /* private mode — just show it */
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }

    try {
      sessionStorage.setItem("idp_intro", "1");
    } catch {
      /* ignore */
    }
    setPhase("show");
    document.body.style.overflow = "hidden";

    const fade = setTimeout(() => {
      setPhase("fading");
      document.body.style.overflow = "";
    }, HOLD_MS);
    const gone = setTimeout(() => setPhase("done"), HOLD_MS + FADE_MS);

    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "idle" || phase === "done") return null;

  return (
    <div
      className={`idp-intro fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-[#070707] transition-opacity duration-[650ms] ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Purple bloom, breathing behind the mark */}
      <div className="idp-bloom pointer-events-none absolute aspect-square w-[min(78vw,30rem)] rounded-full" />

      <div className="relative flex flex-col items-center px-6">
        <div className="idp-spin relative w-[min(64vw,17rem)]">
          <svg viewBox="0 0 200 104" className="w-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="idp-trace" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b93ff" />
                <stop offset="55%" stopColor="#b66dc7" />
                <stop offset="100%" stopColor="#8b93ff" />
              </linearGradient>
            </defs>

            {/* The loop itself, sitting quietly under the light */}
            <path
              d="M100 52c-12-19-24-28-38-28a28 28 0 1 0 0 56c14 0 26-9 38-28zm0 0c12 19 24 28 38 28a28 28 0 1 0 0-56c-14 0-26 9-38 28z"
              fill="none"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* A band of light running the length of the loop */}
            <path
              className="idp-trace"
              pathLength={100}
              d="M100 52c-12-19-24-28-38-28a28 28 0 1 0 0 56c14 0 26-9 38-28zm0 0c12 19 24 28 38 28a28 28 0 1 0 0-56c-14 0-26 9-38 28z"
              fill="none"
              stroke="url(#idp-trace)"
              strokeWidth="11"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="idp-word mt-8 text-center font-display text-[clamp(0.7rem,2.6vw,0.95rem)] font-bold uppercase tracking-[0.38em] text-white/70">
          Infinite&nbsp;Distribution
        </p>
      </div>

      <style jsx global>{`
        .idp-bloom {
          background: radial-gradient(
            circle,
            rgba(182, 109, 199, 0.5) 0%,
            rgba(124, 58, 237, 0.22) 38%,
            transparent 70%
          );
          filter: blur(46px);
          animation: idp-breathe 2.6s ease-out both;
        }
        .idp-spin {
          animation: idp-turn 6s linear infinite, idp-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
          filter: drop-shadow(0 0 22px rgba(182, 109, 199, 0.55));
        }
        .idp-trace {
          stroke-dasharray: 22 78;
          animation: idp-run 1.9s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        .idp-word {
          animation: idp-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.55s both;
        }
        @keyframes idp-run {
          to {
            stroke-dashoffset: -100;
          }
        }
        @keyframes idp-turn {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes idp-in {
          from {
            opacity: 0;
            transform: scale(0.82);
          }
        }
        @keyframes idp-breathe {
          0% {
            opacity: 0;
            transform: scale(0.65);
          }
          55% {
            opacity: 0.95;
            transform: scale(1.12);
          }
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .idp-spin,
          .idp-trace,
          .idp-bloom,
          .idp-word {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
