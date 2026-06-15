"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Reveal from "./ui/Reveal";

const details = [
  {
    label: "Email",
    value: "infinitedistributionsmelb@gmail.com",
    href: "mailto:infinitedistributionsmelb@gmail.com",
    icon: <path d="M3 7l9 6 9-6M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4" />,
  },
  {
    label: "Phone",
    value: "0421 042 007",
    href: "tel:+61421042007",
    icon: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  },
  {
    label: "Location",
    value: "Melbourne, Victoria, Australia",
    href: "https://maps.google.com/?q=Melbourne+Victoria+Australia",
    icon: <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  },
];

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Front-end demo handler. Wire to your email service / form backend (Formspree,
    // Resend, Vercel serverless function, etc.) to receive submissions.
    setSent(true);
  };

  return (
    <section id="contact" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-brand-50/40 to-white" />
      <div className="container-max">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: info */}
          <div>
            <Reveal>
              <span className="eyebrow">Get in Touch</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                Let&apos;s get your flyers <span className="gradient-text">moving.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-md text-lg text-slate-600">
                Tell us about your campaign and we&apos;ll get back to you with a free, no-obligation
                quote — usually within one business day.
              </p>
            </Reveal>

            <div className="mt-9 space-y-4">
              {details.map((d, i) => (
                <Reveal key={d.label} delay={0.1 + i * 0.05}>
                  <a
                    href={d.href}
                    target={d.label === "Location" ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft transition-all hover:border-brand-200 hover:shadow-glow"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-accent-indigo group-hover:text-white">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        {d.icon}
                      </svg>
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {d.label}
                      </span>
                      <span className="block font-medium text-ink">{d.value}</span>
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-soft sm:p-9">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-indigo text-white">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-bold text-ink">Thanks!</h3>
                  <p className="mt-2 max-w-xs text-slate-600">
                    Your message is ready to send. We&apos;ll be in touch shortly with your quote.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 text-sm font-semibold text-brand-600 hover:underline"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name" name="name" placeholder="Jane Smith" required />
                    <Field label="Phone" name="phone" placeholder="0400 000 000" type="tel" />
                  </div>
                  <Field label="Email" name="email" placeholder="you@example.com" type="email" required />
                  <Field label="Suburb / Target Area" name="area" placeholder="e.g. Richmond, VIC" />
                  <div>
                    <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-ink">
                      Tell us about your campaign
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder="How many flyers, target suburbs, timing…"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                    />
                  </div>
                  <label className="flex items-start gap-2.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                    />
                    Keep me updated with offers &amp; distribution tips.
                  </label>
                  <button type="submit" className="btn-primary w-full">
                    Get My Free Quote
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-brand-600"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}
