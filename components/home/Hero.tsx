"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ArrowPill from "../ui/ArrowPill";

export default function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-night text-white">
      {/* Gradient field */}
      <div className="absolute inset-0">
        {/* base dark */}
        <div className="absolute inset-0 bg-night" />
        {/* colorful soft blob on the right */}
        <div className="absolute right-[-10%] top-[-5%] h-[90%] w-[70%] animate-blob rounded-full bg-[radial-gradient(circle_at_40%_40%,#8b7bff_0%,#5a6bff_30%,#7c5cff_55%,transparent_72%)] opacity-80 blur-[40px]" />
        <div className="absolute right-[5%] top-[20%] h-[60%] w-[45%] animate-blob rounded-full bg-[radial-gradient(circle_at_60%_50%,#c98bd6_0%,#9a6bff_40%,transparent_70%)] opacity-60 blur-[50px] [animation-delay:3s]" />
        <div className="absolute left-[-5%] bottom-[-10%] h-[50%] w-[40%] rounded-full bg-[radial-gradient(circle,#b5523f_0%,transparent_70%)] opacity-30 blur-[60px]" />
        {/* angled glass panel */}
        <div className="absolute right-0 top-0 h-full w-[55%] -skew-x-[14deg] origin-top-right bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
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
              Join The Team
            </Link>{" "}
            to apply
          </p>
        </motion.div>
      </div>
    </section>
  );
}
