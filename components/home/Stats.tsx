"use client";

import { motion } from "framer-motion";
import Counter from "../ui/Counter";

const stats = [
  { value: 100, suffix: "+", label: "Completed campaigns" },
  { value: 70, suffix: "k+", label: "Houses Delivered" },
  { value: 90, suffix: "%", label: "Satisfaction rate" },
];

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-mist py-24">
      {/* faded background heading */}
      <div className="container-site">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.45, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none select-none font-display text-[clamp(2rem,6vw,4.5rem)] font-extrabold tracking-tight text-ink/30"
        >
          We&apos;re good with numbers
        </motion.h2>

        <div className="mt-12 grid gap-12 sm:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <div className="font-display text-[clamp(3.5rem,8vw,5.5rem)] font-extrabold leading-none text-electric">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-3 text-2xl text-ink/80">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
