"use client";

import { motion } from "framer-motion";
import Counter from "./ui/Counter";
import { stagger, fadeUp } from "@/lib/motion";

const stats = [
  {
    value: 50000,
    suffix: "+",
    label: "Completed Campaigns",
    sub: "Delivered on time, every time",
  },
  {
    value: 3.4,
    decimals: 1,
    suffix: "M",
    label: "Houses Delivered",
    sub: "Across Melbourne & Victoria",
  },
  {
    value: 98,
    suffix: "%",
    label: "Client Satisfaction",
    sub: "Backed by our money-back promise",
  },
  {
    value: 100,
    suffix: "%",
    label: "Quality Guaranteed",
    sub: "GPS-tracked & crease-free",
  },
];

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white">
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-accent-cyan/20 blur-3xl" />

      <div className="container-max relative">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center md:text-left">
              <div className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                <span className="bg-gradient-to-r from-white to-brand-200 bg-clip-text text-transparent">
                  <Counter to={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-white/90">{s.label}</div>
              <div className="mt-1 text-xs text-white/50">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
