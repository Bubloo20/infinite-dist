"use client";

import { motion } from "framer-motion";

export default function Join() {
  return (
    <section className="grid min-h-[90vh] lg:grid-cols-2">
      {/* Left graphic — person reading a flyer */}
      <div className="relative min-h-[360px] overflow-hidden bg-night lg:min-h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/join-person.jpg"
          alt="Distributor reading a flyer"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Right copy */}
      <div className="flex items-center bg-white">
        <div className="px-8 py-24 sm:px-14 lg:max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(3rem,7vw,5.5rem)] font-extrabold tracking-tight text-orchid"
          >
            Join Us
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12 }}
            className="mt-8 space-y-4 text-lg leading-relaxed text-ink/80"
          >
            <p>
              Join our team as a contractor and expect to earn $15–20 per hour delivering marketing
              fliers in your local streets.
            </p>
            <p>Enjoy a flexible schedule and choose when you want to work.</p>
            <p>As a subcontractor, you can also choose the areas you&apos;d like to deliver in.</p>
            <p>Click below to apply via a Google form.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22 }}
            className="mt-10"
          >
            <a
              href="https://forms.gle/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-ink px-9 py-4 text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Give Me The Form
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
