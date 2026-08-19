"use client";

import { useEffect, useState } from "react";

/** Set on a successful sign-in; read once on the far side of the redirect. */
export const WELCOME_KEY = "idp_welcome";

/** Ask for the flourish. Called the moment a sign-in succeeds. */
export function armWelcome(name: string) {
  try {
    sessionStorage.setItem(WELCOME_KEY, name || "");
  } catch {
    /* private mode — just skip it */
  }
}

const DRAW_MS = 1500;
const HOLD_MS = 2300;
const FADE_MS = 600;

/**
 * The way in.
 *
 * An infinity traces itself with a light running round the loop, then hands
 * over to the portal. It plays on every sign-in and exactly once: the flag that
 * triggers it is cleared as it starts, so a reload lands straight on the work.
 */
export default function LoginFlourish() {
  const [name, setName] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Claiming the flag and running the clock are deliberately separate. React
  // mounts effects twice in development, and when both lived together the
  // second pass found the flag already taken, returned early, and left the
  // overlay up with no timer to take it down again.
  useEffect(() => {
    let armed: string | null = null;
    try {
      armed = sessionStorage.getItem(WELCOME_KEY);
      // Cleared as it starts, so a refresh mid-animation doesn't replay it.
      if (armed !== null) sessionStorage.removeItem(WELCOME_KEY);
    } catch {
      return;
    }
    if (armed === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setName(armed);
  }, []);

  useEffect(() => {
    if (name === null) return;
    document.body.style.overflow = "hidden";
    const out = setTimeout(() => setLeaving(true), HOLD_MS);
    const done = setTimeout(() => {
      setName(null);
      setLeaving(false);
      document.body.style.overflow = "";
    }, HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(out);
      clearTimeout(done);
      document.body.style.overflow = "";
    };
  }, [name]);

  if (name === null) return null;

  return (
    <div
      className={`idp-welcome fixed inset-0 z-[4000] grid place-items-center overflow-hidden bg-[#07040f] transition-opacity duration-[600ms] ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="idp-welcome-bloom pointer-events-none absolute aspect-square w-[min(120vw,44rem)] rounded-full" />

      <div className="relative flex flex-col items-center px-6">
        <svg viewBox="0 0 200 100" className="w-[min(78vw,30rem)]" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="idp-inf" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b93ff" />
              <stop offset="50%" stopColor="#b66dc7" />
              <stop offset="100%" stopColor="#8b93ff" />
            </linearGradient>
            <filter id="idp-inf-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* The loop, faint, so the drawing has something to run along. */}
          <path
            d="M50,50 C50,22 76,22 100,50 C124,78 150,78 150,50 C150,22 124,22 100,50 C76,78 50,78 50,50 Z"
            stroke="#ffffff" strokeOpacity="0.09" strokeWidth="5" strokeLinecap="round"
          />
          {/* The same loop drawing itself. */}
          <path
            className="idp-inf-draw"
            d="M50,50 C50,22 76,22 100,50 C124,78 150,78 150,50 C150,22 124,22 100,50 C76,78 50,78 50,50 Z"
            stroke="url(#idp-inf)" strokeWidth="5" strokeLinecap="round"
            pathLength={100} filter="url(#idp-inf-glow)"
          />
          {/* A light running round it once it's drawn. */}
          <circle className="idp-inf-spark" r="4.2" fill="#fff" filter="url(#idp-inf-glow)">
            <animateMotion
              dur="2.6s" repeatCount="indefinite" begin="0.55s"
              path="M50,50 C50,22 76,22 100,50 C124,78 150,78 150,50 C150,22 124,22 100,50 C76,78 50,78 50,50 Z"
            />
          </circle>
        </svg>

        <p className="idp-welcome-name mt-7 text-center font-display text-[clamp(1.3rem,5vw,2rem)] font-extrabold tracking-tight text-white">
          {name ? `Welcome back, ${name}` : "Welcome back"}
        </p>
        <p className="idp-welcome-sub mt-2 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-orchid">
          Infinite Distribution
        </p>
      </div>

      <style jsx global>{`
        .idp-welcome-bloom {
          background: radial-gradient(circle, rgba(182,109,199,0.34) 0%, rgba(124,58,237,0.16) 42%, transparent 70%);
          filter: blur(60px);
          animation: idp-welcome-breathe 2.6s ease-out both;
        }
        .idp-inf-draw {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: idp-inf-draw ${DRAW_MS}ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        .idp-inf-spark { opacity: 0; animation: idp-inf-spark 0.5s ease-out 0.55s forwards; }
        .idp-welcome-name { animation: idp-welcome-rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.85s both; }
        .idp-welcome-sub  { animation: idp-welcome-rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) 1.05s both; }
        @keyframes idp-inf-draw { to { stroke-dashoffset: 0; } }
        @keyframes idp-inf-spark { to { opacity: 1; } }
        @keyframes idp-welcome-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes idp-welcome-breathe {
          0%   { opacity: 0; transform: scale(0.65); }
          60%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.7; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .idp-welcome-bloom, .idp-inf-draw, .idp-inf-spark,
          .idp-welcome-name, .idp-welcome-sub { animation: none; }
          .idp-inf-draw { stroke-dashoffset: 0; }
          .idp-inf-spark { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
