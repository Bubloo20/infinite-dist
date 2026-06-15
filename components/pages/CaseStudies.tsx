"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import ArrowPill from "../ui/ArrowPill";

const photos = [
  { src: "/images/case-1.jpg", alt: "Flyer delivered to a letterbox" },
  { src: "/images/case-2.jpg", alt: "VICPROP property flyer delivered" },
  { src: "/images/case-3.jpg", alt: "Real-estate flyer delivered to a letterbox" },
];

/* Brand-matched recreations of the partner logos shown on the live site.
   Swap any node for an <img src="/images/partners/..."> if you export the originals. */
const partners: { key: string; node: ReactNode }[] = [
  {
    key: "Imoge",
    node: (
      <span className="flex items-center gap-1.5 text-ink">
        <span className="text-3xl font-black italic leading-none tracking-[-0.15em]">///</span>
        <span className="text-3xl font-black tracking-tight">Imoge</span>
      </span>
    ),
  },
  {
    key: "Woodards",
    node: (
      <span className="flex items-center gap-2 rounded bg-[#0e1c3d] px-4 py-2.5">
        <span className="text-xl font-semibold lowercase tracking-tight text-white">woodards</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-[#b89b5e] text-sm font-bold text-[#0e1c3d]">
          W
        </span>
      </span>
    ),
  },
  {
    key: "Nelson Alexander",
    node: (
      <span className="text-center font-serif text-[1.6rem] font-semibold leading-[1.05] text-[#df4a30]">
        Nelson
        <br />
        Alexander
      </span>
    ),
  },
  {
    key: "Infinite Tutoring",
    node: (
      <span className="text-center leading-[1.05]">
        <span className="block text-xl font-extrabold text-[#9b59b6]">Infinite</span>
        <span className="block text-xl font-extrabold text-ink">Tutoring</span>
      </span>
    ),
  },
  {
    key: "Classic Roof Restoration",
    node: (
      <span className="flex flex-col items-center">
        <svg width="80" height="22" viewBox="0 0 80 22" fill="none" aria-hidden>
          <path d="M6 18 L40 3 L74 18" stroke="#1e2b50" strokeWidth="3" strokeLinecap="round" />
          <path d="M30 18 L40 11 L50 18" stroke="#c9772e" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="mt-1 text-xl font-extrabold tracking-wide text-[#1e2b50]">CLASSIC</span>
        <span className="text-[9px] font-semibold tracking-[0.22em] text-[#c9772e]">
          ROOF RESTORATION
        </span>
      </span>
    ),
  },
  {
    key: "Collings",
    node: (
      <span className="flex h-24 w-24 items-center justify-center bg-[#9fd3cf]">
        <span className="text-sm font-medium tracking-[0.18em] text-white">COLLINGS</span>
      </span>
    ),
  },
  {
    key: "BMW",
    node: <BmwRoundel />,
  },
  {
    key: "VICPROP",
    node: (
      <span className="flex h-24 w-28 items-center justify-center bg-black">
        <span className="text-sm font-light tracking-[0.3em] text-white">VICPROP</span>
      </span>
    ),
  },
];

export default function CaseStudies() {
  return (
    <>
      {/* Hero */}
      <section className="grid lg:grid-cols-2">
        {/* left: 3D mailbox graphic */}
        <div className="relative min-h-[340px] overflow-hidden bg-night lg:min-h-full">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_45%,#3b3bd6,#1a1233_55%,#0d0d0d_88%)]" />
          <div className="absolute left-[-8%] bottom-[-10%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,#b5523f,transparent_70%)] opacity-40 blur-[55px]" />
          <div className="absolute right-[8%] top-[12%] h-[45%] w-[45%] animate-blob rounded-full bg-[radial-gradient(circle,#8b7bff,transparent_70%)] opacity-50 blur-[45px]" />
          <Mailbox />
        </div>

        {/* right: copy + delivery photos */}
        <div className="flex items-center bg-white">
          <div className="w-full px-8 py-16 sm:px-14 lg:py-20">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] font-extrabold leading-[1.02] tracking-tight text-ink"
            >
              Building Strong Foundations
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.12 }}
              className="mt-5 text-xl text-ink/70"
            >
              Partnered with local businesses
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.22 }}
              className="mt-7"
            >
              <ArrowPill href="/contact" variant="light">
                See how our clients trust us
              </ArrowPill>
            </motion.div>

            {/* delivery photo row */}
            <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-4">
              {photos.map((p, i) => (
                <motion.div
                  key={p.src}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-mist"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt={p.alt}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-white py-24">
        <div className="container-site">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Our Valued Partners
            </h2>
            <p className="mt-3 section-label">Serving Industry Leaders</p>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
            {partners.map((p) => (
              <div
                key={p.key}
                className="flex h-40 items-center justify-center bg-white px-6 transition-transform duration-300 hover:scale-[1.04]"
                title={p.key}
              >
                {p.node}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function BmwRoundel() {
  return (
    <svg width="84" height="84" viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="48" fill="#000" />
      <circle cx="50" cy="50" r="37" fill="#fff" />
      {/* quadrants */}
      <path d="M50 13 A37 37 0 0 1 87 50 L50 50 Z" fill="#fff" />
      <path d="M87 50 A37 37 0 0 1 50 87 L50 50 Z" fill="#0066b1" />
      <path d="M50 87 A37 37 0 0 1 13 50 L50 50 Z" fill="#fff" />
      <path d="M13 50 A37 37 0 0 1 50 13 L50 50 Z" fill="#0066b1" />
      <circle cx="50" cy="50" r="37" fill="none" stroke="#000" strokeWidth="1.5" />
      {/* letters */}
      <text
        x="22"
        y="12"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        B
      </text>
      <text
        x="44"
        y="11"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        M
      </text>
      <text
        x="69"
        y="12"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        W
      </text>
    </svg>
  );
}

function Mailbox() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <motion.svg
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        viewBox="0 0 320 260"
        className="w-[78%] max-w-[420px] drop-shadow-[0_30px_60px_rgba(80,90,255,0.35)]"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M40 120 L40 200 L190 235 L190 150 Z" fill="rgba(255,255,255,0.04)" />
        <path d="M40 120 L120 95 L270 120 L190 150 Z" fill="rgba(255,255,255,0.07)" />
        <path d="M190 150 L190 235 L270 205 L270 120 Z" fill="rgba(255,255,255,0.05)" />
        <path d="M40 120 C40 80 120 55 120 95 L120 95" />
        <path d="M120 95 C120 60 200 85 270 120" />
        <path d="M55 165 L175 190 L175 215 L55 192 Z" fill="rgba(0,0,0,0.25)" />
        <path d="M250 120 L250 60" stroke="rgba(255,255,255,0.7)" />
        <path d="M250 66 L278 74 L250 92 Z" fill="rgba(220,90,70,0.85)" stroke="rgba(255,180,160,0.9)" />
        <path d="M95 215 L95 255 M120 222 L120 258" stroke="rgba(255,255,255,0.5)" />
      </motion.svg>
    </div>
  );
}
