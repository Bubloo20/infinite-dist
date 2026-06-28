"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { submitForm } from "@/lib/forms";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setSending(true);
    setError("");
    try {
      const ok = await submitForm(
        {
          Name: `${d.get("firstName")} ${d.get("lastName")}`.trim(),
          Service: (d.get("service") as string) || "—",
          Email: (d.get("email") as string) || "—",
          Phone: (d.get("phone") as string) || "—",
          Message: (d.get("message") as string) || "—",
        },
        { subject: "New Quote Request — Infinite Distributions", from_name: "Website Contact Form" },
      );
      if (ok) {
        setSent(true);
        form.reset();
      } else {
        setError("Something went wrong. Please try again, or email us directly.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-lavender pt-36 pb-28">
      <div className="container-site">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="section-label"
        >
          Ready To Get Started?
        </motion.h2>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-4xl font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-ink"
        >
          Leaflet distribution or courier delivery
          <br />
          Take the first step with a{" "}
          <span className="rounded-lg bg-white/70 px-2 text-ink">FREE</span> quote
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-10 space-y-1 text-lg text-ink/80"
        >
          <p>
            Business Number:{" "}
            <a href="tel:+61421042007" className="font-semibold hover:underline">
              0421 042 007
            </a>
          </p>
          <p>
            Email:{" "}
            <a href="mailto:infinitedistributionsmelb@gmail.com" className="font-semibold hover:underline">
              infinitedistributionsmelb@gmail.com
            </a>
          </p>
          <p>Or alternatively, use the form below.</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 max-w-4xl"
        >
          {sent ? (
            <div className="rounded-4xl bg-white/70 p-12 text-center">
              <h3 className="font-display text-3xl font-bold text-ink">Thanks!</h3>
              <p className="mt-3 text-ink/70">
                Your message is ready. We&apos;ll be in touch shortly with your free quote.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm font-semibold text-electric hover:underline"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-7 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Which service? *</Label>
                <select
                  name="service"
                  required
                  defaultValue=""
                  className="w-full rounded-full border border-ink/15 bg-white/70 px-5 py-4 text-ink outline-none transition focus:border-electric focus:bg-white"
                >
                  <option value="" disabled>
                    Select a service…
                  </option>
                  <option value="Leaflet distribution">Leaflet distribution</option>
                  <option value="Courier / parcel delivery">Courier / parcel delivery</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <Field label="First name" name="firstName" required />
              <Field label="Last name" name="lastName" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone" name="phone" type="tel" required />
              <div className="sm:col-span-2">
                <Label>Message *</Label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-ink/15 bg-white/70 px-5 py-4 text-ink outline-none transition focus:border-electric focus:bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-full bg-ink px-10 py-4 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[15px] font-semibold text-ink">{children}</label>;
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && " *"}
      </Label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-full border border-ink/15 bg-white/70 px-5 py-4 text-ink outline-none transition focus:border-electric focus:bg-white"
      />
    </div>
  );
}
