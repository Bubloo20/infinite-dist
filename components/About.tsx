"use client";

import { motion } from "framer-motion";
import Reveal from "./ui/Reveal";
import { stagger, fadeUp } from "@/lib/motion";

const values = [
  {
    title: "Customer-Centric Focus",
    body: "Your goals lead every campaign. We tailor each route and schedule to your needs — and back it with a satisfaction guarantee.",
    icon: (
      <path d="M12 21s-7-4.35-9.5-8.5C.5 9 2.5 5 6 5c2 0 3.2 1.2 4 2.5C10.8 6.2 12 5 14 5c3.5 0 5.5 4 3.5 7.5C19 16.65 12 21 12 21z" />
    ),
  },
  {
    title: "Commitment to Security",
    body: "Your flyers are handled with care from drop-off to letterbox through a structured, accountable delivery process.",
    icon: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3zM9.5 12l2 2 3.5-4" />,
  },
  {
    title: "Transparent & Fair",
    body: "No hidden fees. No empty promises. Just honest pricing, clear reporting, and proof that the job was done right.",
    icon: <path d="M3 6h18M3 12h18M3 18h12" />,
  },
];

export default function About() {
  return (
    <section id="about" className="relative py-24">
      <div className="container-max">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Copy */}
          <div>
            <Reveal>
              <span className="eyebrow">Who We Are</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
                Advertising that lands{" "}
                <span className="gradient-text">straight in the hand.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                Infinite Distribution is a Melbourne letterbox marketing company built on a
                simple idea: the most personal, direct way to reach a community is to put your
                message right where people live. No algorithms, no scroll-past — a real flyer in
                a real hand.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                We map your target neighbourhoods, deliver door-to-door with trained
                distributors, and report back with GPS data and optional photo proof — so you
                always know exactly where your campaign went.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#contact" className="btn-primary">
                  Start a Campaign
                </a>
                <a href="#process" className="btn-ghost">
                  See Our Process
                </a>
              </div>
            </Reveal>
          </div>

          {/* Value cards */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-4"
          >
            {values.map((v) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="card flex gap-5 hover:border-brand-200 hover:shadow-glow"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-indigo text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    {v.icon}
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{v.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
