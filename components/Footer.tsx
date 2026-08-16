"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { submitForm } from "@/lib/forms";

export default function Footer() {
  const pathname = usePathname();
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (new FormData(form).get("email") as string) || "—";
    setSubscribed(true); // optimistic — show confirmation immediately
    form.reset();
    try {
      await submitForm(
        { Email: email, "Sign-up": "Newsletter subscription" },
        { subject: "New Newsletter Signup — Infinite Distribution", from_name: "Website Newsletter" },
      );
    } catch {
      /* confirmation already shown; signup is best-effort */
    }
  };

  // The team portal is a standalone app — no marketing chrome.
  if (pathname?.startsWith("/portal")) return null;

  return (
    <footer className="bg-night text-white">
      <div className="container-site py-16">
        {/* Brand mark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="Infinite Distribution" className="w-full max-w-2xl" />
        <p className="mt-5 text-lg text-white/70">A part of the Infinite Group</p>

        <div className="mt-14 grid gap-12 border-t border-white/10 pt-12 md:grid-cols-2">
          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white/90">
              Join Our Newsletter
            </h3>
            {subscribed ? (
              <p className="mt-6 rounded-xl border border-orchid/40 bg-orchid/10 px-4 py-3 text-sm font-medium text-orchid">
                You&apos;re subscribed — thanks for joining!
              </p>
            ) : (
              <form onSubmit={onSubscribe} className="mt-6 max-w-md">
                <label className="block text-sm text-white/80">
                  Email <span className="text-orchid">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  aria-label="Email address"
                  className="mt-2 w-full border-0 border-b border-white/30 bg-transparent pb-2 text-white outline-none transition-colors focus:border-orchid"
                />
                <label className="mt-5 flex items-start gap-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 accent-orchid"
                  />
                  Yes, subscribe me to your newsletter <span className="text-orchid">*</span>
                </label>
                <button
                  type="submit"
                  className="mt-6 rounded-full bg-white px-8 py-3 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5"
                >
                  Submit
                </button>
              </form>
            )}
          </div>

          {/* Contact */}
          <div className="md:border-l md:border-white/10 md:pl-12">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white/90">
              Contact
            </h3>
            <ul className="mt-6 space-y-2 text-lg text-white/80">
              <li>
                <a
                  href="mailto:infinitedistributionsmelb@gmail.com"
                  className="transition-colors hover:text-orchid"
                >
                  infinitedistributionsmelb@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+61421042007" className="transition-colors hover:text-orchid">
                  0421 042 007
                </a>
              </li>
              <li>Melbourne, Victoria</li>
              <li>Australia</li>
            </ul>
          </div>
        </div>

        <p className="mt-14 border-t border-white/10 pt-8 text-sm text-white/50">
          © 2026 by Infinite.
        </p>
      </div>
    </footer>
  );
}
