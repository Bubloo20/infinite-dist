"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ArrowPill from "../ui/ArrowPill";

export default function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-night text-white">
      {/* Gradient field — the site's real hero image + animated glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-night" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/home-hero.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* animated colorful glow layered over the photo for life */}
        <div className="absolute right-[-10%] top-[-5%] h-[90%] w-[70%] animate-blob rounded-full bg-[radial-gradient(circle_at_40%_40%,#8b7bff_0%,#5a6bff_30%,transparent_70%)] opacity-40 blur-[50px] mix-blend-screen" />
        {/* left-side dark gradient so the headline stays legible */}
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/70 to-night/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/60 via-transparent to-transparent" />
      </div>

      <div className="container-site relative flex min-h-[100svh] flex-col justify-center pt-28 pb-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl font-display text-[clamp(3rem,9vw,8rem)] font-extrabold leading-[0.95] tracking-tight"
        >
          Local Reach.{" "}
          <span className="bg-gradient-to-r from-white via-orchid to-[#9a8bff] bg-clip-text text-transparent">
            Maximum Impact
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <ArrowPill href="/contact" variant="light">
            Get A Quote
          </ArrowPill>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 max-w-xl space-y-5 text-xl text-white/90 sm:text-2xl"
        >
          <p>
            From your hand to letter box&apos;s. Nothing else. No middleman. No hassle. Delivery{" "}
            <span className="font-bold">Guaranteed</span>
          </p>
          <p className="text-lg sm:text-xl">
            Click{" "}
            <Link href="/join" className="font-semibold underline underline-offset-4 hover:text-orchid">
              here
            </Link>{" "}
            to apply to join the team
          </p>
        </motion.div>
      </div>
    </section>
  );
}
