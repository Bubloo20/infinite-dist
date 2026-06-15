"use client";

import { motion } from "framer-motion";
import Reveal from "./ui/Reveal";
import { stagger, fadeUp } from "@/lib/motion";

const guarantees = [
  {
    title: "GPS-Tracked Drops",
    body: "Every distributor carries a tracking app. You get authenticated route data for every campaign — no guesswork.",
  },
  {
    title: "Crease-Free Delivery",
    body: "Your flyers arrive looking their best. We never fold, stuff, or dump — each piece is placed with care.",
  },
  {
    title: "Authenticated Reporting",
    body: "Transparent, tamper-proof delivery data you can actually trust, delivered after every campaign.",
  },
  {
    title: "Photo Proof on Demand",
    body: "Request on-the-ground photo documentation during distribution for total peace of mind.",
  },
  {
    title: "Money-Back Guarantee",
    body: "If we don't deliver as promised, you don't pay. It's that simple — our reputation is on every drop.",
  },
  {
    title: "No Junk, No Dumping",
    body: "We're a real distribution network, not a corner-cutter. Every household in your zone gets covered.",
  },
];

export default function Quality() {
  return (
    <section id="quality" className="relative overflow-hidden py-24">
      <div className="container-max">
        <div className="grid items-end gap-8 md:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <span className="eyebrow">100% Quality</span>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              The guarantee behind <span className="gradient-text">every flyer</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-slate-600">
              Quality isn&apos;t a slogan — it&apos;s a system. Tracking, proof, and a money-back
              promise mean you get exactly what you pay for, every single time.
            </p>
          </Reveal>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {guarantees.map((g) => (
            <motion.div
              key={g.title}
              variants={fadeUp}
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-soft transition-all hover:border-brand-200 hover:shadow-glow"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-50 transition-transform duration-500 group-hover:scale-150" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-indigo text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h3 className="relative mt-5 font-display text-lg font-bold text-ink">{g.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{g.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
