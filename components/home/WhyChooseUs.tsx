"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const points = [
  {
    n: "01",
    title: "Customer-Centric Focus",
    body: "We put you first. Every step of our service is built around your needs — from safe, crease-free delivery to our unmatched money-back guarantee. Your success is our mission, and your satisfaction drives everything we do.",
  },
  {
    n: "02",
    title: "Commitment to Security",
    body: "We take the security of your materials seriously. From the moment your pamphlets or parcels are handed to our trained team, they are carefully handled and delivered safely to every letterbox or doorstep. Our structured process ensures nothing is lost, damaged, or misplaced — giving you complete peace of mind.",
  },
  {
    n: "03",
    title: "Transparent and Fair Practices",
    body: "We believe in upfront service. No hidden fees, no empty promises — just clear communication, fair pricing, and a guarantee that holds us accountable. With us, what you see is exactly what you get.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-mist">
      <div className="grid lg:grid-cols-2">
        {/* Left: copy */}
        <div className="container-site ml-auto max-w-[640px] px-6 py-20 sm:px-10 lg:py-28">
          <h2 className="section-label">Why Choose Us</h2>
          <h3 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Your Satisfaction Is Our Priority
          </h3>

          <div className="mt-12 space-y-12">
            {points.map((p, i) => (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <h4 className="flex items-baseline gap-4 font-display text-2xl font-bold text-electric">
                  <span className="text-xl">{p.n}</span>
                  {p.title}
                </h4>
                <p className="mt-3 text-lg leading-relaxed text-ink/75">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: real device graphic */}
        <div className="relative min-h-[360px] overflow-hidden bg-night lg:min-h-full">
          <Image
            src="/images/home-send-card.jpg"
            alt="Send to address — tracked delivery"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
