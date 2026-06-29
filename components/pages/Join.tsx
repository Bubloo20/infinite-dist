"use client";

import { motion } from "framer-motion";

const FORM_URL =
  "https://docs.google.com/forms/d/18HeW-LXhJ0BuOjZeWkdysck_2JzKWbJjVA1foGbFSC8/viewform";

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
            <p className="text-xl font-semibold text-ink">
              Get paid to deliver marketing fliers in your local streets — on a flexible, contract basis.
            </p>
            <p>
              <span className="font-semibold text-ink">How it works:</span> the role is contract-based,
              so we let you know whenever a job is available and the fliers are dropped off to you. During
              onboarding, we&apos;ll show you how to use our tracking app.
            </p>
            <p>
              <span className="font-semibold text-ink">On the job:</span> you walk your chosen streets and
              pop one leaflet in each letterbox, skipping any &ldquo;no junk mail&rdquo; boxes. The fliers
              are typically marketing material for local real estate agents.
            </p>
            <p>
              <span className="font-semibold text-ink">Get around faster:</span> because you&apos;re paid
              per flier delivered (over a minimum number of hours), we encourage a bike, e-bike, or scooter
              rather than walking — the faster you cover your route, the more you earn.
            </p>
            <p>
              Your route is GPS-tracked through the app for verification, and you choose your own hours and
              the areas you&apos;d like to deliver in.
            </p>
            <p>Click below to apply.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22 }}
            className="mt-10"
          >
            <a
              href={FORM_URL}
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
