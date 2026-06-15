"use client";

import { motion } from "framer-motion";
import ArrowPill from "../ui/ArrowPill";

const partners = ["Real Estate", "Hospitality", "Retail", "Trades", "Fitness", "Local Events"];

export default function CaseStudies() {
  return (
    <>
      {/* Hero */}
      <section className="grid min-h-[70vh] lg:grid-cols-2">
        {/* left graphic */}
        <div className="relative min-h-[300px] overflow-hidden bg-night lg:min-h-full">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_45%,#3b3bd6,#1a1233_55%,#0d0d0d_85%)]" />
          <div className="absolute left-[-10%] bottom-[-10%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,#b5523f,transparent_70%)] opacity-40 blur-[50px]" />
          <div className="absolute right-[10%] top-[15%] h-[45%] w-[45%] animate-blob rounded-full bg-[radial-gradient(circle,#8b7bff,transparent_70%)] opacity-50 blur-[40px]" />
        </div>
        {/* right copy */}
        <div className="flex items-center bg-white">
          <div className="px-8 py-20 sm:px-14 lg:max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.02] tracking-tight text-ink"
            >
              Building Strong Foundations
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.12 }}
              className="mt-6 text-xl text-ink/70"
            >
              Partnered with local businesses
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.22 }}
              className="mt-8"
            >
              <ArrowPill href="/contact" variant="light">
                See how our clients trust us
              </ArrowPill>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-white py-24">
        <div className="container-site">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Our Valued Partners
            </h2>
            <p className="mt-3 section-label">Serving Industry Leaders</p>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {partners.map((p, i) => (
              <motion.div
                key={p}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="flex h-32 items-center justify-center rounded-3xl bg-mist text-lg font-semibold text-ink/45 transition-colors hover:bg-lavender hover:text-ink"
              >
                {p}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
