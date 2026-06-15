"use client";

import { motion } from "framer-motion";
import FloatingFlyers from "./FloatingFlyers";
import { stagger, fadeUp } from "@/lib/motion";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-16"
    >
      {/* Background layers */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/60 via-white to-white" />
      <div className="grid-fade absolute inset-0 -z-10" />
      <div className="absolute -left-32 top-10 -z-10 h-[420px] w-[420px] rounded-full mesh-blob animate-gradient-pan" />
      <div className="absolute -right-24 top-40 -z-10 h-[360px] w-[360px] rounded-full mesh-blob opacity-40" />

      <FloatingFlyers />

      <div className="container-max relative">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div variants={fadeUp} className="flex justify-center">
            <span className="eyebrow">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
              </span>
              Melbourne&apos;s Trusted Letterbox Network
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-7 font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-7xl"
          >
            Local Reach.
            <br />
            <span className="gradient-text">Maximum Impact.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl"
          >
            From your hand to the letterbox — nothing else. No middleman, no hassle.
            Every flyer GPS-tracked, every drop crease-free.{" "}
            <span className="font-semibold text-ink">Delivery guaranteed.</span>
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a href="#contact" className="btn-primary w-full sm:w-auto">
              Get a Free Quote
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a href="#process" className="btn-ghost w-full sm:w-auto">
              How It Works
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500"
          >
            {[
              "GPS-Tracked Drops",
              "Crease-Free Guarantee",
              "Money-Back Promise",
              "Photo Proof on Demand",
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-brand-600">
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-slate-300 p-1.5">
          <motion.span
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="h-2 w-1 rounded-full bg-brand-600"
          />
        </div>
      </motion.div>
    </section>
  );
}
