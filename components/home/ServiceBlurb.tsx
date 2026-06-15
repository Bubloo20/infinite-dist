"use client";

import { motion } from "framer-motion";
import ArrowPill from "../ui/ArrowPill";

export default function ServiceBlurb() {
  return (
    <section className="bg-white py-24">
      <div className="container-site">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <p className="font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-ink">
            Letterbox marketing is one of the most personal and direct ways to advertise. Unlike
            online ads that get scrolled past, your message lands straight in the hands of the very
            people living in your area. It&apos;s personal, direct, and puts your business
            front-of-mind in the community you serve.
          </p>
          <div className="mt-10">
            <ArrowPill href="/quality" variant="blue">
              Read More
            </ArrowPill>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
