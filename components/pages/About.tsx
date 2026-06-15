"use client";

import { motion } from "framer-motion";

const team = [
  { name: "Bubloo Mohanrajh", role: "Director & Distributor", initials: "BM" },
  { name: "Lucas Thomas", role: "Operations Management", initials: "LT" },
  { name: "Sam Rhoades", role: "Distributor", initials: "SR" },
];

export default function About() {
  return (
    <>
      {/* Intro */}
      <section className="bg-white pt-36 pb-20">
        <div className="container-site">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label"
          >
            About Us
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-5xl font-display text-[clamp(1.9rem,4.5vw,3.5rem)] font-bold leading-[1.12] tracking-tight text-ink"
          >
            <p>As a previous small business owner, large letter distribution companies overcharged us.</p>
            <p className="mt-2">So we had to fix that.</p>
            <p className="mt-2">That&apos;s the goal of Infinite Distributions.</p>
            <p className="mt-2 italic text-orchid">Maximum impact. Minimum cost.</p>
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white pb-24">
        <div className="container-site">
          <h2 className="section-label">The Team</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {team.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative aspect-[4/5] overflow-hidden rounded-4xl bg-coal"
              >
                {/* avatar gradient + initials */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#2a2150,#111111_70%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-7xl font-extrabold text-white/15 transition-transform duration-500 group-hover:scale-110">
                    {m.initials}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-7">
                  <h3 className="font-display text-2xl font-bold text-white">{m.name}</h3>
                  <p className="mt-1 text-white/70">{m.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-white pb-28">
        <div className="container-site">
          <h2 className="section-label">Our Mission</h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="mt-6 max-w-3xl text-2xl leading-relaxed text-ink/80 sm:text-3xl"
          >
            Deliver letters/pamphlets at a low cost with maximum effort. No Middleman. No hassle and
            peace of mind, knowing that every letterbox in the region will receive your message,
            allowing local/small businesses to thrive.
          </motion.p>
        </div>
      </section>
    </>
  );
}
