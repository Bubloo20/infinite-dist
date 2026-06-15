"use client";

import { motion } from "framer-motion";
import Reveal from "./ui/Reveal";
import { stagger, fadeUp } from "@/lib/motion";

const steps = [
  {
    n: "01",
    title: "Send Us Your Flyers",
    body: "Drop off or ship your printed marketing materials. Not printed yet? We can point you to trusted local printers.",
    icon: <path d="M3 7l9 6 9-6M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4" />,
  },
  {
    n: "02",
    title: "We Plan the Distribution",
    body: "We map optimised routes across your target neighbourhoods so every household in your zone is covered.",
    icon: <path d="M9 20l-5.5 2.5V6L9 3.5m0 16.5 6-2.5m-6 2.5V3.5m6 14 5.5 2.5V6L15 3.5m0 14V3.5m-6 0 6 2.5" />,
  },
  {
    n: "03",
    title: "Reliable Delivery",
    body: "Trained distributors place your flyers directly into letterboxes — crease-free, hand-to-hand, no shortcuts.",
    icon: <path d="M3 12h18M3 12l4-7h10l4 7M3 12v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6M7 16h.01M11 16h2" />,
  },
  {
    n: "04",
    title: "Tracking & Reporting",
    body: "You receive authenticated GPS tracking data and optional photo documentation — full proof your campaign landed.",
    icon: <path d="M3 3v18h18M7 14l4-4 3 3 5-6" />,
  },
];

export default function Process() {
  return (
    <section id="process" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-brand-50/40 to-white" />
      <div className="container-max">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">How It Works</span>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Four steps from <span className="gradient-text">flyer to front door</span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            A simple, transparent system that keeps you in the loop from start to finish.
          </p>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="relative mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* connector line */}
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block" />

          {steps.map((s) => (
            <motion.div
              key={s.n}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="card group relative z-10 hover:border-brand-200 hover:shadow-glow"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-accent-indigo group-hover:text-white">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {s.icon}
                  </svg>
                </span>
                <span className="font-display text-4xl font-bold text-slate-100 transition-colors group-hover:text-brand-100">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-6 font-display text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
