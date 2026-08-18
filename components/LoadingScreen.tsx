"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const HOLD_MS = 2200;
const FADE_MS = 700;

/**
 * The intro the site opens on.
 *
 * The real logo, revealed by a band of light sweeping across it, over a purple
 * bloom that breathes out from behind. The fade-out is driven by state and a
 * CSS transition rather than an animation library: the overlay covers the whole
 * site, so its removal has to be guaranteed, not left to an exit hook.
 *
 * Shown once per browser tab, and skipped entirely for reduced motion.
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
      className={`idp-intro fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-[#070707] transition-opacity duration-700 ${
        phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Purple bloom, breathing out from behind the mark */}
      <div className="idp-bloom pointer-events-none absolute aspect-square w-[min(92vw,34rem)] rounded-full" />

      {/* A ring drawing itself around the logo */}
      <svg
        className="idp-ring pointer-events-none absolute h-[min(80vw,26rem)] w-[min(80vw,26rem)]"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="100" cy="100" r="94" pathLength={100}
          stroke="url(#idp-ring-grad)" strokeWidth="1.4" strokeLinecap="round"
        />
        <defs>
          <linearGradient id="idp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b93ff" />
            <stop offset="100%" stopColor="#b66dc7" />
          </linearGradient>
        </defs>
      </svg>

      <div className="idp-logo relative w-[min(78vw,30rem)]">
        <Image
          src="/images/logo.png"
          alt="Infinite Distribution"
          width={1000}
          height={120}
          priority
          className="h-auto w-full"
        />
        {/* The band of light that reveals it */}
        <span aria-hidden className="idp-sweep pointer-events-none absolute inset-y-0 w-1/3" />
      </div>

      <style jsx global>{`
        .idp-bloom {
          background: radial-gradient(
            circle,
            rgba(182, 109, 199, 0.45) 0%,
            rgba(124, 58, 237, 0.2) 40%,
            transparent 70%
          );
          filter: blur(52px);
          animation: idp-breathe 2.8s ease-out both;
        }
        .idp-ring {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: idp-draw 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards,
                     idp-turn 14s linear infinite;
          opacity: 0.5;
        }
        .idp-logo {
          animation: idp-rise 1s cubic-bezier(0.22, 1, 0.36, 1) both;
          filter: drop-shadow(0 0 34px rgba(182, 109, 199, 0.45));
        }
        .idp-sweep {
          left: -35%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
          filter: blur(10px);
          animation: idp-sweep 1.7s ease-in-out 0.4s;
        }
        @keyframes idp-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes idp-turn {
          to { transform: rotate(360deg); }
        }
        @keyframes idp-sweep {
          from { transform: translateX(0); }
          to { transform: translateX(420%); }
        }
        @keyframes idp-rise {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes idp-breathe {
          0% { opacity: 0; transform: scale(0.6); }
          55% { opacity: 1; transform: scale(1.14); }
          100% { opacity: 0.62; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .idp-bloom, .idp-ring, .idp-logo, .idp-sweep { animation: none; }
          .idp-ring { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
