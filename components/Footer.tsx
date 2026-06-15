"use client";

import { useState, type FormEvent } from "react";
import Logo from "./Logo";

const nav = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "100% Quality", href: "#quality" },
  { label: "Case Studies", href: "#case-studies" },
  { label: "Contact", href: "#contact" },
  { label: "Join the Team", href: "#join" },
];

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" />

      <div className="container-max relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1.4fr]">
          {/* Brand */}
          <div>
            <div className="[&_*]:!text-white">
              <a href="#home" className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 via-accent-indigo to-accent-cyan">
                  <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
                    <path
                      d="M20 32c0-5 3.5-8 7-8 4 0 6 4 9 8 3 4 5 8 9 8 3.5 0 6-3 6-8s-2.5-8-6-8c-4 0-6 4-9 8-3 4-5 8-9 8-3.5 0-7-3-7-8z"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="flex flex-col leading-none">
                  <span className="font-display text-[15px] font-bold tracking-tight text-white">
                    Infinite
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300">
                    Distribution
                  </span>
                </span>
              </a>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
              Melbourne&apos;s trusted letterbox distribution network. From your hand to the
              letterbox — no middleman, no hassle, delivery guaranteed.
            </p>
            <div className="mt-6 flex gap-3">
              {["Facebook", "Instagram", "LinkedIn"].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-brand-400 hover:bg-brand-600 hover:text-white"
                >
                  <SocialIcon name={s} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
              Explore
            </h4>
            <ul className="mt-5 space-y-3">
              {nav.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="text-sm text-white/55 transition-colors hover:text-brand-300"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white/80">
              Stay in the loop
            </h4>
            <p className="mt-5 text-sm text-white/55">
              Distribution tips, offers, and updates — straight to your inbox.
            </p>
            {subscribed ? (
              <p className="mt-4 rounded-xl border border-brand-500/30 bg-brand-600/15 px-4 py-3 text-sm font-medium text-brand-200">
                You&apos;re subscribed — thanks for joining! 🎉
              </p>
            ) : (
              <form onSubmit={onSubscribe} className="mt-4">
                <div className="flex overflow-hidden rounded-full border border-white/15 bg-white/5 p-1 focus-within:border-brand-400">
                  <input
                    type="email"
                    required
                    placeholder="Your email"
                    aria-label="Email address"
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-brand-600 to-accent-indigo px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
                  >
                    Join
                  </button>
                </div>
                <label className="mt-3 flex items-start gap-2 text-xs text-white/45">
                  <input type="checkbox" required className="mt-0.5 h-3.5 w-3.5 rounded" />
                  I agree to receive marketing emails and accept the privacy policy.
                </label>
              </form>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-sm text-white/45 sm:flex-row">
          <p>© 2026 Infinite Distribution. All rights reserved.</p>
          <p className="flex items-center gap-2">
            Made with care in <span className="text-white/70">Melbourne, Australia</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "currentColor",
  };
  if (name === "Facebook")
    return (
      <svg {...common}>
        <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9z" />
      </svg>
    );
  if (name === "Instagram")
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M6.94 7.5a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12zM5.5 9h2.9v9.5H5.5V9zm5 0h2.78v1.3h.04c.39-.74 1.34-1.52 2.76-1.52 2.95 0 3.5 1.94 3.5 4.46v5.26h-2.9v-4.66c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.74H10.5V9z" />
    </svg>
  );
}
