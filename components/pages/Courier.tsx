"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ProcessSteps, { type Step, type Aside } from "@/components/ProcessSteps";

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e1530]">
      {children}
    </div>
  );
}

const features = [
  {
    icon: (
      <IconBox>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b66dc7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </IconBox>
    ),
    title: "Delivered Within 3 Days",
    desc: "We guarantee delivery within 3 business days — reliable, consistent, and on schedule every time.",
  },
  {
    icon: (
      <IconBox>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b66dc7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </IconBox>
    ),
    title: "Lower Than Competitors",
    desc: "Our rates are transparently priced and consistently beat the competition — no hidden fees, ever.",
  },
  {
    icon: (
      <IconBox>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b66dc7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h10M4 18h7" />
          <polyline points="15 15 19 12 15 9" />
        </svg>
      </IconBox>
    ),
    title: "Flexible Scheduling",
    desc: "Book around your schedule. We work with you on pickup times and adapt to last-minute changes.",
  },
  {
    icon: (
      <IconBox>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b66dc7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </IconBox>
    ),
    title: "GPS Tracking & Proof",
    desc: "Get GPS data, the completion time, and a photo as proof the moment your delivery is done.",
  },
  {
    icon: (
      <IconBox>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b66dc7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      </IconBox>
    ),
    title: "Documents to Medium Boxes",
    desc: "From envelopes and documents to medium-sized boxes — we handle all shapes with care.",
  },
  {
    icon: (
      <IconBox>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b66dc7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      </IconBox>
    ),
    title: "North-Eastern Suburbs",
    desc: "We specialise in Melbourne's north-eastern suburbs — local knowledge means faster, smarter routes.",
  },
];

const courierSteps: Step[] = [
  {
    n: "01",
    title: "Call or Message Us",
    body: "Call 0421 042 007 or message us with your pickup address, destination, and preferred time — we'll get a confirmation back to you quickly.",
    dark: true,
  },
  {
    n: "02",
    title: "We Pick It Up",
    body: "Our driver arrives on time at your door and handles your items with care from the moment we collect them.",
    dark: false,
  },
  {
    n: "03",
    title: "Fast Delivery",
    body: "Fast and safe — and you'll know where your parcel is at any time.",
    dark: true,
  },
  {
    n: "04",
    title: "Proof of Delivery",
    body: "You get a delivery confirmation with photo proof, GPS data and the completion time once it's delivered.",
    dark: false,
  },
];

const courierAside: Aside[] = [
  {
    h: "Updates & Proof",
    p: "Get updates and peace of mind when your delivery is completed — with GPS data, the time, and a photo.",
  },
  {
    h: "Fast & Affordable",
    p: "Same-day pickups on request, rates that beat the competition, and proof of delivery on every job.",
  },
];

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Courier() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark pt-40 pb-20">
        <div className="container-site">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="section-label text-white/50"
          >
            Courier Service — Melbourne
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-4xl font-display text-[clamp(2.25rem,6vw,4.5rem)] font-extrabold uppercase leading-[1.04] tracking-tight text-white"
          >
            Fast. Cheap.{" "}
            <span className="text-orchid">Reliable.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-2xl text-xl leading-relaxed text-white/70"
          >
            Infinite Distributions offers a no-fuss courier service across Melbourne.
            Same-day pickups on request, GPS tracking, and proof of delivery — at a price that won&apos;t
            break the bank.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link href="/contact" className="pill-light">
              Get A Quote
              <span className="arrow-dot">→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-white py-24">
        <div className="container-site">
          <motion.div {...fade} className="max-w-2xl">
            <p className="section-label">Why Choose Our Courier</p>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Everything you need, nothing you don&apos;t
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                {...fade}
                transition={{ ...fade.transition, delay: i * 0.07 }}
                className="rounded-4xl bg-mist p-8"
              >
                {f.icon}
                <h3 className="mt-5 font-display text-xl font-extrabold tracking-tight text-ink">
                  {f.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-ink/70">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <ProcessSteps eyebrow="How It Works" steps={courierSteps} aside={courierAside} />

      {/* Pricing callout */}
      <section className="bg-white py-24">
        <div className="container-site">
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div {...fade} className="rounded-5xl bg-lavender p-10 sm:p-14">
              <div className="font-display text-right text-2xl font-bold text-ink">
                Starting from $20
              </div>
              <div className="mt-6 font-display text-5xl font-bold text-ink">01</div>
              <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">
                Local Drop
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-ink/75">
                Perfect for small items, documents, and local deliveries within the same suburb
                or nearby area. Fast, affordable, and tracked.
              </p>
              <ul className="mt-8 space-y-3 text-ink/80">
                {["Same-day pickup available on request", "GPS tracking included", "Proof of delivery photo"].map(
                  (b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60" />
                      <span>{b}</span>
                    </li>
                  )
                )}
              </ul>
            </motion.div>

            <motion.div {...fade} transition={{ ...fade.transition, delay: 0.1 }} className="rounded-5xl bg-mist p-10 sm:p-14">
              <div className="font-display text-right text-2xl font-bold text-ink">
                Custom Quote
              </div>
              <div className="mt-6 font-display text-5xl font-bold text-ink">02</div>
              <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">
                Metro & Bulk
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-ink/75">
                Ideal for businesses needing regular courier runs, multi-stop deliveries, or
                heavier parcels across Greater Melbourne.
              </p>
              <ul className="mt-8 space-y-3 text-ink/80">
                {[
                  "Multi-stop routes",
                  "Volume discounts",
                  "Recurring booking available",
                  "Priority scheduling",
                  "Live updates via SMS or email",
                ].map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-white pb-24">
        <div className="container-site">
          <motion.figure {...fade} className="max-w-4xl">
            <blockquote className="font-display text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-snug tracking-tight text-ink">
              &ldquo;Booked a same-day courier, parcel arrived within two hours. Cheapest rate
              I&apos;ve found and the tracking was spot on.&rdquo;
            </blockquote>
            <figcaption className="mt-6">
              <span className="block text-lg font-bold text-ink">Jordan Mills</span>
              <span className="block text-ink/60">Small business owner — Melbourne CBD</span>
            </figcaption>
          </motion.figure>
        </div>
      </section>
    </>
  );
}
