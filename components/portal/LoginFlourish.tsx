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

// Long enough to land, short enough that it never feels like waiting.
const DRAW_MS = 1000;
const HOLD_MS = 1500;
const FADE_MS = 420;

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
      className={`idp-welcome fixed inset-0 z-[4000] grid place-items-center overflow-hidden bg-[#07040f] transition-opacity duration-[420ms] ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="idp-welcome-bloom pointer-events-none absolute aspect-square w-[min(120vw,44rem)] rounded-full" />

      <div className="relative flex flex-col items-center px-6">
        {/*
          The real mark, cropped out of the logo the same way the loader does —
          the leftmost 28.4% of a 1000x120 file is the infinity on its own. A
          ring draws itself around it and a light sweeps across it.
        */}
        <div className="relative grid place-items-center">
          <svg className="idp-welcome-ring pointer-events-none absolute h-[min(74vw,22rem)] w-[min(74vw,22rem)]"
            viewBox="0 0 200 200" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="idp-welcome-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b93ff" />
                <stop offset="100%" stopColor="#b66dc7" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="94" pathLength={100}
              stroke="url(#idp-welcome-grad)" strokeWidth="1.6" strokeLinecap="round" />
          </svg>

          <div className="idp-welcome-mark relative w-[min(52vw,15rem)] overflow-hidden"
            style={{ aspectRatio: "284 / 120" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" aria-hidden="true"
              className="h-full max-w-none" style={{ width: `${(1000 / 284) * 100}%` }} />
            <span aria-hidden className="idp-welcome-sweep pointer-events-none absolute inset-y-0 w-1/2" />
          </div>
        </div>

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
        .idp-welcome-mark {
          animation: idp-welcome-mark 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
          filter: drop-shadow(0 0 30px rgba(182, 109, 199, 0.55));
        }
        .idp-welcome-ring {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          opacity: 0.55;
          animation: idp-welcome-draw ${DRAW_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards,
                     idp-welcome-turn 12s linear infinite;
        }
        .idp-welcome-sweep {
          left: -55%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          filter: blur(9px);
          animation: idp-welcome-sweep 1.1s ease-in-out 0.25s;
        }
        .idp-welcome-name { animation: idp-welcome-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.6s both; }
        .idp-welcome-sub  { animation: idp-welcome-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.78s both; }
        @keyframes idp-welcome-draw { to { stroke-dashoffset: 0; } }
        @keyframes idp-welcome-turn { to { transform: rotate(360deg); } }
        @keyframes idp-welcome-sweep { from { transform: translateX(0); } to { transform: translateX(320%); } }
        @keyframes idp-welcome-mark {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: none; }
        }
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
          .idp-welcome-bloom, .idp-welcome-mark, .idp-welcome-ring,
          .idp-welcome-sweep, .idp-welcome-name, .idp-welcome-sub { animation: none; }
          .idp-welcome-ring { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
