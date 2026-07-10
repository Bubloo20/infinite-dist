"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "How much does letterbox distribution cost in Melbourne?",
    a: "Our letterbox distribution starts from $75, and the price per flyer drops as your volume goes up. Tell us your suburbs and quantity and we'll send a free, no-obligation quote.",
  },
  {
    q: "Which Melbourne suburbs do you deliver to?",
    a: "We cover Melbourne's inner north, north-east and east — roughly a 4 km radius of Northcote, Thornbury, Ivanhoe, Heidelberg, Kew, Hawthorn and Balwyn, plus surrounding suburbs. For courier jobs we travel anywhere within a 10 km radius of your pickup.",
  },
  {
    q: "How do I know my flyers were actually delivered?",
    a: "Every drop is GPS-tracked. We send you the tracking data — distance covered and time spent — and can provide photos on request as proof the job was completed.",
  },
  {
    q: "Do you offer same-day courier delivery in Melbourne?",
    a: "Yes. Same-day courier is available on request across Melbourne, subject to driver availability. We also handle express, next-business-day and scheduled multi-day deliveries.",
  },
  {
    q: "What is your on-time delivery guarantee?",
    a: "If we miss an agreed delivery deadline for reasons within our control, your delivery is free. Full details are on our On-Time Delivery Promise terms page.",
  },
  {
    q: "Can you deliver sensitive or confidential documents?",
    a: "Yes. Legal documents, prescriptions and other sensitive items are handled discreetly and kept private, with your data and privacy protected at every step.",
  },
  {
    q: "How do I get a quote or book a job?",
    a: "Call 0421 042 007 or use our contact form with your flyer or parcel details and preferred timing. We reply within one business day with a free quote.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-white py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="container-site grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <p className="section-label">FAQ</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Questions?
            <br />
            Answered.
          </h2>
          <p className="mt-5 max-w-sm text-lg text-ink/70">
            Everything you need to know about our letterbox distribution and courier service across
            Melbourne.
          </p>
        </div>

        <div className="border-t border-slate-200">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-slate-200">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-5 py-5 text-left"
                >
                  <span className="font-display text-lg font-bold text-ink sm:text-xl">{f.q}</span>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen ? "rotate-45 border-electric bg-electric text-white" : "border-slate-300 text-ink"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 text-lg leading-relaxed text-ink/70">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
