"use client";

import { motion } from "framer-motion";

export default function Join() {
  return (
    <section className="grid min-h-[90vh] lg:grid-cols-2">
      {/* Left graphic — person reading a flyer */}
      <div className="relative min-h-[360px] overflow-hidden bg-night lg:min-h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_46%,#3a45e0_0%,#241e8f_38%,#100c33_72%,#070712_100%)]" />
        <PersonReading />
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

function PersonReading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-10">
      <motion.svg
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        viewBox="0 0 400 440"
        className="w-[68%] max-w-[420px] drop-shadow-[0_25px_60px_rgba(70,90,255,0.4)]"
        fill="none"
        stroke="#dde3ff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* head */}
        <circle cx="150" cy="78" r="42" />
        {/* body + legs silhouette */}
        <path d="M111 152 C111 133 189 133 189 152 L198 252 L183 412 L159 412 L150 302 L141 412 L117 412 L102 252 Z" />
        {/* back arm */}
        <path d="M114 168 L95 286" />
        {/* front arm reaching to hold the flyer */}
        <path d="M188 168 C214 182 232 206 250 214" />
        {/* hand */}
        <path d="M243 200 C256 200 266 208 268 220 C260 226 248 224 243 214" />
        {/* flyer */}
        <g transform="rotate(-9 296 200)">
          <rect x="246" y="138" width="100" height="128" rx="5" />
          <rect x="262" y="158" width="62" height="20" rx="2.5" fill="#c0533f" stroke="none" />
          <line x1="262" y1="196" x2="330" y2="196" />
          <line x1="262" y1="214" x2="312" y2="214" />
        </g>
      </motion.svg>
    </div>
  );
}
