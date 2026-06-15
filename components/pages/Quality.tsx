"use client";

import { motion } from "framer-motion";

const services = [
  { t: "Bulk Mail Distribution", d: "Efficient solutions for businesses with large-scale mailing needs." },
  { t: "Targeted Delivery", d: "Reach the right audience with precise, location-based delivery." },
  { t: "Secure Handling", d: "Confidential and sensitive mail delivered safely and discreetly." },
];

const personalBullets = [
  "Flexible order size → Choose how many pamphlets/letters to be distributed.",
  "Tiered pricing → Cost per item decreases as volume increases.",
  "One-time campaigns → No lock-in contracts.",
  "Custom target areas → pick suburbs/postcodes.",
  "Tracking & reporting → photos of distribution are provided.",
];

const businessBullets = [
  "Recurring campaigns (weekly, fortnightly, or monthly).",
  "Bulk pricing → Lower cost per pamphlet as volumes increase.",
  "Priority scheduling → Guaranteed delivery slots.",
  "Target area selection (postcodes, suburbs, or specific streets).",
  "Live reporting (confirmation of areas covered with photos).",
];

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Quality() {
  return (
    <>
      {/* Hero heading */}
      <section className="bg-white pt-40 pb-12">
        <div className="container-site">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-5xl font-display text-[clamp(2.25rem,6vw,4.5rem)] font-extrabold uppercase leading-[1.04] tracking-tight text-ink"
          >
            Every client, every letter, successfully delivered{" "}
            <span className="text-orchid">- Guaranteed</span>
          </motion.h1>
        </div>
      </section>

      {/* Intro + services */}
      <section className="bg-white pb-20">
        <div className="container-site max-w-5xl">
          <motion.div {...fade} className="space-y-2 text-xl text-ink/80">
            <p>Letter distribution is simple, reliable, and effective.</p>
            <p>
              From important business documents to promotional mail and personal letters, we ensure
              every delivery is handled with care and reaches its destination on time.
            </p>
            <p>Our services include:</p>
          </motion.div>
          <ul className="mt-8 space-y-4">
            {services.map((s, i) => (
              <motion.li
                key={s.t}
                {...fade}
                transition={{ ...fade.transition, delay: i * 0.08 }}
                className="flex gap-3 text-lg text-ink/80"
              >
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric" />
                <span>
                  <span className="font-bold text-ink">{s.t}</span> – {s.d}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tracking */}
      <section className="bg-white py-16">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <motion.div {...fade}>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Tracking
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
              All letterbox drops are tracked using verified GPS applications to ensure full
              transparency and accuracy. Once the distribution has been completed, detailed tracking
              data is provided as proof of completion, giving you clear confirmation that the job has
              been carried out as agreed.
            </p>
          </motion.div>
          <motion.div {...fade} className="relative h-72 overflow-hidden rounded-4xl bg-[#e9ece6] shadow-soft sm:h-80">
            <MapGraphic />
          </motion.div>
        </div>
      </section>

      {/* Honesty */}
      <section className="bg-white py-16">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <motion.div {...fade} className="order-2 relative h-72 overflow-hidden rounded-4xl bg-night sm:h-80 lg:order-1">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,#3b3bd6,#1a1233_55%,#0d0d0d_85%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-5xl font-extrabold text-white/15">TRUST</span>
            </div>
          </motion.div>
          <motion.div {...fade} className="order-1 lg:order-2">
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Honesty
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
              Honesty is at the core of everything we do. We believe in clear communication,
              transparent pricing, and delivering exactly what we promise — no shortcuts, no hidden
              surprises. From the first conversation to the completion of the job, we keep our
              clients informed every step of the way. Our reputation is built on trust, reliability,
              and doing the right thing, even when no one is watching.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-20">
        <div className="container-site">
          <motion.div {...fade} className="max-w-2xl">
            <h2 className="section-label">Choose Your Track</h2>
            <h3 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Customized plans for every client
            </h3>
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <PlanCard
              n="01"
              name="Personal"
              price="Starting from $75"
              desc="This plan is designed for individuals, freelancers, or small-scale advertisers who don't want to commit to a subscription but just pay per campaign."
              bullets={personalBullets}
              tone="lavender"
            />
            <PlanCard
              n="02"
              name="Business"
              price="Starting from $75"
              desc="This plan is designed for local businesses and organisations that want regular distribution campaigns to stay visible in their target areas. It provides bulk delivery savings and optional add-ons for brand impact."
              bullets={businessBullets}
              tone="mist"
            />
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-white pb-24">
        <div className="container-site">
          <motion.figure {...fade} className="max-w-4xl">
            <blockquote className="font-display text-[clamp(1.6rem,3.5vw,2.6rem)] font-bold leading-snug tracking-tight text-ink">
              &ldquo;Infinite Distribution delivered our pamphlets faster than expected — great
              communication and crease-free leaflets.&rdquo;
            </blockquote>
            <figcaption className="mt-6">
              <span className="block text-lg font-bold text-ink">Alex Hunter</span>
              <span className="block text-ink/60">Director — Local real estate agent</span>
            </figcaption>
          </motion.figure>
        </div>
      </section>
    </>
  );
}

function PlanCard({
  n,
  name,
  price,
  desc,
  bullets,
  tone,
}: {
  n: string;
  name: string;
  price: string;
  desc: string;
  bullets: string[];
  tone: "lavender" | "mist";
}) {
  return (
    <motion.div
      {...fade}
      className={`rounded-5xl p-9 sm:p-12 ${tone === "lavender" ? "bg-lavender" : "bg-mist"}`}
    >
      <div className="text-right font-display text-2xl font-bold text-ink">{price}</div>
      <div className="mt-6 font-display text-4xl font-bold text-ink">{n}</div>
      <h4 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink">{name}</h4>
      <p className="mt-5 text-lg leading-relaxed text-ink/75">{desc}</p>
      <ul className="mt-8 space-y-3">
        {bullets.map((b) => (
          <li key={b} className="flex gap-3 text-ink/80">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function MapGraphic() {
  return (
    <svg viewBox="0 0 400 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="320" fill="#e9ece6" />
      {/* roads */}
      <g stroke="#cfd4cb" strokeWidth="10">
        <line x1="0" y1="80" x2="400" y2="80" />
        <line x1="0" y1="180" x2="400" y2="180" />
        <line x1="0" y1="260" x2="400" y2="260" />
        <line x1="90" y1="0" x2="90" y2="320" />
        <line x1="220" y1="0" x2="220" y2="320" />
        <line x1="320" y1="0" x2="320" y2="320" />
      </g>
      <g fill="#dfe3da">
        <rect x="100" y="90" width="110" height="80" />
        <rect x="230" y="190" width="80" height="60" />
      </g>
      {/* red route */}
      <path
        d="M40 290 L40 180 L90 180 L90 80 L220 80 L220 180 L320 180 L320 60"
        fill="none"
        stroke="#e0332f"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="290" r="7" fill="#e0332f" />
      <circle cx="320" cy="60" r="9" fill="#e0332f" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
