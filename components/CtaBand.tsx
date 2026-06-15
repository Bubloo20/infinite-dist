"use client";

import { motion } from "framer-motion";
import ArrowPill from "./ui/ArrowPill";

export default function CtaBand() {
  return (
    <section className="bg-lavender">
      <div className="container-site grid gap-8 py-24 md:grid-cols-2 md:items-center md:py-28">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl font-extrabold tracking-tight text-ink sm:text-6xl"
        >
          Ready to get started?
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="max-w-md text-xl text-ink/80">
            We will answer your questions and give you a fair price.
          </p>
          <div className="mt-7">
            <ArrowPill href="/contact" variant="light">
              Contact Us
            </ArrowPill>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
