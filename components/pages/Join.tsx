"use client";

import { motion } from "framer-motion";

export default function Join() {
  return (
    <section className="grid min-h-[90vh] lg:grid-cols-2">
      {/* Left graphic */}
      <div className="relative min-h-[300px] overflow-hidden bg-night lg:min-h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#2a2150,#150f2e_55%,#0d0d0d_85%)]" />
        <div className="absolute right-[5%] top-[20%] h-[55%] w-[55%] animate-blob rounded-full bg-[radial-gradient(circle,#b66dc7,transparent_70%)] opacity-50 blur-[50px]" />
        <div className="absolute left-[-10%] bottom-[-5%] h-[45%] w-[45%] rounded-full bg-[radial-gradient(circle,#5a6bff,transparent_70%)] opacity-40 blur-[50px]" />
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
