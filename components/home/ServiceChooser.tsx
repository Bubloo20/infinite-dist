"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const services = [
  {
    title: "Leaflet Distribution",
    desc: "GPS-tracked letterbox drops across Melbourne's suburbs — your flyers straight to the door.",
    href: "/quality",
    img: "/images/service-leaflet.jpg",
    cta: "View leaflet service",
    accent: "text-orchid",
    // orchid glow on hover
    glow: "group-hover:shadow-[0_26px_70px_-18px_rgba(182,109,199,0.65)]",
  },
  {
    title: "Parcels & Courier",
    desc: "Fast, affordable courier for parcels and documents anywhere in Melbourne — same-day on request.",
    href: "/courier",
    img: "/images/service-courier.jpg",
    cta: "View courier service",
    accent: "text-electric",
    // electric-blue glow on hover
    glow: "group-hover:shadow-[0_26px_70px_-18px_rgba(90,107,255,0.7)]",
  },
];

export default function ServiceChooser() {
  return (
    <section className="bg-white py-24">
      <div className="container-site">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="section-label"
        >
          How Our Flawless System Works
        </motion.h2>
        <motion.h3
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl"
        >
          Choose your service
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.14 }}
          className="mt-4 max-w-xl text-lg text-ink/70"
        >
          Two ways we deliver — pick one to see exactly how it works.
        </motion.p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {services.map((s, i) => (
            <motion.div
              key={s.href}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={s.href} className="group block">
                {/* Curved image box — glows on hover to signal it's clickable */}
                <div
                  className={`overflow-hidden rounded-4xl shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)] ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1.5 ${s.glow}`}
                >
                  <div className="relative aspect-square overflow-hidden bg-night">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.img}
                      alt={s.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* Text below the box */}
                <div className="mt-6">
                  <h4 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                    {s.title}
                  </h4>
                  <p className="mt-2 max-w-md text-lg text-ink/70">{s.desc}</p>
                  <span className={`mt-4 inline-flex items-center gap-2 text-[15px] font-bold ${s.accent}`}>
                    {s.cta}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
