"use client";

import { motion } from "framer-motion";
import Reveal from "./ui/Reveal";
import Counter from "./ui/Counter";
import { stagger, fadeUp } from "@/lib/motion";

const cases = [
  {
    tag: "Real Estate",
    title: "Local agency books 11 appraisals from one drop",
    body: "A boutique Melbourne agency targeted 8,000 homes in their core suburb. GPS-tracked, single weekend rollout.",
    metric: 11,
    metricSuffix: "",
    metricLabel: "New appraisals booked",
    accent: "from-brand-600 to-accent-indigo",
  },
  {
    tag: "Hospitality",
    title: "New café fills tables in its first fortnight",
    body: "Grand-opening flyers with a coupon dropped across a 5km radius drove a measurable spike in covers and redemptions.",
    metric: 22,
    metricSuffix: "%",
    metricLabel: "Coupon redemption rate",
    accent: "from-accent-indigo to-accent-cyan",
  },
  {
    tag: "Trades & Services",
    title: "Plumbing company keeps the phone ringing",
    body: "A recurring monthly distribution kept a local trades business top-of-mind across three growth suburbs.",
    metric: 3.4,
    metricDecimals: 1,
    metricSuffix: "x",
    metricLabel: "Return on campaign spend",
    accent: "from-brand-500 to-brand-700",
  },
];

export default function CaseStudies() {
  return (
    <section id="case-studies" className="relative overflow-hidden bg-ink py-24 text-white">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-accent-cyan/20 blur-3xl" />

      <div className="container-max relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
            Case Studies
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Real campaigns. <span className="bg-gradient-to-r from-brand-300 to-accent-cyan bg-clip-text text-transparent">Real results.</span>
          </h2>
          <p className="mt-5 text-lg text-white/60">
            A snapshot of what well-targeted letterbox distribution does for local businesses.
          </p>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {cases.map((c) => (
            <motion.div
              key={c.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition-all hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className={`inline-flex w-fit rounded-full bg-gradient-to-r ${c.accent} px-3 py-1 text-xs font-semibold`}>
                {c.tag}
              </span>
              <h3 className="mt-5 font-display text-xl font-bold leading-snug">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{c.body}</p>
              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="font-display text-4xl font-bold">
                  <span className="bg-gradient-to-r from-white to-brand-200 bg-clip-text text-transparent">
                    <Counter to={c.metric} decimals={c.metricDecimals ?? 0} suffix={c.metricSuffix} />
                  </span>
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-white/50">{c.metricLabel}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <Reveal className="mt-12 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
          >
            Could this be your campaign?
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
