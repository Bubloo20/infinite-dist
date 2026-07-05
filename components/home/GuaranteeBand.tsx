"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function GuaranteeBand() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-electric via-[#4c1d95] to-[#7c3aed]">
      {/* soft glow accents */}
      <div className="pointer-events-none absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-[4%] h-80 w-80 rounded-full bg-orchid/40 blur-3xl" />

      <div className="container-site relative py-16 sm:py-20">
        <div className="flex flex-col items-start gap-7 lg:flex-row lg:items-center lg:gap-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-white/12 ring-1 ring-white/30 backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
              <path d="M9 12l2 2 4-4.5" />
            </svg>
          </motion.div>

          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/25"
            >
              On-time guarantee
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 font-display text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[1.02] tracking-tight text-white"
            >
              On time — or it&apos;s on us.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="mt-4 text-xl leading-relaxed text-white/90 sm:text-2xl"
            >
              If we miss the agreed delivery deadline (for reasons within our control), your delivery is{" "}
              <span className="font-extrabold text-white underline decoration-white/50 decoration-2 underline-offset-4">
                free
              </span>
              .<sup className="ml-0.5 text-sm">*</sup>
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-5 text-sm text-white/65"
            >
              *Applies to delays within our control, on a deadline agreed in advance.{" "}
              <Link
                href="/guarantee-terms"
                className="font-semibold text-white underline decoration-white/50 underline-offset-2 transition-colors hover:decoration-white"
              >
                Click here for details
              </Link>
              .
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
