"use client";

import { motion } from "framer-motion";

export type Step = { n: string; title: string; body: string; dark: boolean };
export type Aside = { h: string; p: string };

/**
 * Shared "How it works" section — a sticky aside column on the left and a
 * stack of sticky numbered step cards on the right. Used on the home page
 * (generic overview) and on each service page (Leaflet / Courier detail).
 */
export default function ProcessSteps({
  eyebrow,
  heading,
  steps,
  aside,
}: {
  eyebrow: string;
  heading?: string;
  steps: Step[];
  aside: Aside[];
}) {
  return (
    <section className="bg-white py-24">
      <div className="container-site grid gap-10 lg:grid-cols-2">
        {/* Left sticky column */}
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <h2 className="section-label">{eyebrow}</h2>
          {heading && (
            <h3 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {heading}
            </h3>
          )}
          <div className="mt-8 space-y-8">
            {aside.map((a) => (
              <div key={a.h}>
                <h4 className="font-display text-2xl font-bold text-mauve">{a.h}</h4>
                <p className="mt-3 max-w-md text-lg text-ink/75">{a.p}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right stacking cards */}
        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ top: `${110 + i * 16}px` }}
              className={`lg:sticky rounded-4xl p-9 sm:p-11 ${
                s.dark ? "bg-coal text-white" : "bg-lavender text-ink"
              }`}
            >
              <div className={`font-display text-4xl font-bold ${s.dark ? "text-white" : "text-ink"}`}>
                {s.n}
              </div>
              <h3 className="mt-5 font-display text-3xl font-bold sm:text-4xl">{s.title}</h3>
              <p className={`mt-5 text-lg ${s.dark ? "text-white/75" : "text-ink/75"}`}>{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
