"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Send Us Your Flyers",
    body: "Simply provide us with your flyers, brochures, or promotional material.",
    dark: true,
  },
  {
    n: "02",
    title: "We Plan The Distribution",
    body: "Our team maps out the best distribution routes, targeting the suburbs and streets that matter most to your campaign.",
    dark: false,
  },
  {
    n: "03",
    title: "Reliable Delivery",
    body: "Our trained distributors deliver your flyers directly into letterboxes across your chosen suburbs, on time and with accuracy.",
    dark: true,
  },
  {
    n: "04",
    title: "Tracking & Reporting",
    body: "We provide updates and tracking data (distance travelled, time spent) upon completion of distribution, so you always know your marketing is in safe hands. You can request pictures from the distributor at any time.",
    dark: false,
  },
];

export default function Process() {
  return (
    <section className="bg-white py-24">
      <div className="container-site grid gap-10 lg:grid-cols-2">
        {/* Left sticky column */}
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <h2 className="section-label">How Our Flawless System Works</h2>
          <div className="mt-10 space-y-10">
            <div>
              <h3 className="font-display text-2xl font-bold text-mauve">Delivery Proof</h3>
              <p className="mt-3 max-w-md text-lg text-ink/75">
                All drops are tracked with tracking apps. We send the tracking data to you as
                proof of completion.
              </p>
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-mauve">Our Guarantee</h3>
              <p className="mt-3 max-w-md text-lg text-ink/75">
                Every flier/leaflet placed in the letterbox will be tracked, and tracking will be
                provided upon job completion.
              </p>
            </div>
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
