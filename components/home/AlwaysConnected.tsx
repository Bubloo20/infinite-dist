"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Superior Guarantee*",
    body: "Tracking data is authenticated and verified.",
    icon: (
      <>
        <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z" />
        <path d="M9 12l2 2 4-4.5" />
      </>
    ),
  },
  {
    title: "Safe Delivery",
    body: "Each and every pamphlet, letter or parcel is delivered with the utmost care. Upon completion, tracking data is provided.",
    icon: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15.5" r="1" />
      </>
    ),
  },
  {
    title: "Ask Any Time For A Picture",
    body: "Request anytime for pictures during the distribution phase, so you can get the satisfying feeling of your letters being delivered.",
    icon: (
      <>
        <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
        <circle cx="9" cy="11" r="1" />
        <circle cx="13" cy="11" r="1" />
      </>
    ),
  },
];

export default function AlwaysConnected() {
  return (
    <section className="bg-white py-24">
      <div className="container-site">
        <h2 className="section-label">Always Connected</h2>
        <div className="mt-14 grid gap-12 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <svg
                width="46"
                height="46"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0200dd"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {f.icon}
              </svg>
              <h3 className="mt-6 font-display text-2xl font-bold text-ink">{f.title}</h3>
              <p className="mt-3 text-lg leading-relaxed text-ink/70">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
