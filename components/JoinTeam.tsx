"use client";

import { motion } from "framer-motion";
import Reveal from "./ui/Reveal";

const perks = [
  "Flexible hours — work around your schedule",
  "Get active & paid while you walk your local area",
  "Weekly pay, no experience needed",
  "Supportive team and clear daily routes",
];

export default function JoinTeam() {
  return (
    <section id="join" className="relative py-24">
      <div className="container-max">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-accent-indigo to-brand-700 px-8 py-16 text-white shadow-glow sm:px-14">
          {/* deco */}
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-60 w-60 rounded-full bg-accent-cyan/20 blur-3xl" />
          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 top-1/2 hidden h-80 w-80 -translate-y-1/2 rounded-full border border-white/10 md:block"
          />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Reveal>
                <span className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
                  We&apos;re Hiring
                </span>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
                  Join the Team
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-md text-lg text-white/80">
                  Love being out and about? Become a distributor and earn money delivering for
                  local businesses across Melbourne. Flexible, friendly, and rewarding.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <a
                  href="#contact"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 transition-transform hover:-translate-y-0.5"
                >
                  Apply Now
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <ul className="space-y-3">
                {perks.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-white/90">{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
