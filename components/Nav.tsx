"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const MERCH_URL = "https://infinitemelb.au/merch";

const commonLinks = [
  { label: "Locations", href: "/locations" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Merch", href: MERCH_URL, external: true },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Join The Team", href: "/join" },
  { label: "Worker Portal", href: "/portal" },
];

const servicesPaths = ["/quality", "/courier"];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileServicesOpen(false);
    setDesktopServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setDesktopServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const servicesActive = servicesPaths.includes(pathname);

  // The team portal is a standalone app — no marketing chrome.
  if (pathname?.startsWith("/portal")) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[60] transition-colors duration-300 ${
        scrolled ? "bg-dark/95 backdrop-blur-md" : "bg-dark"
      }`}
    >
      <div className="container-site flex h-[68px] items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Infinite Distribution — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="Infinite Distribution" className="h-7 w-auto sm:h-8" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 xl:flex">
          <Link
            href="/"
            className={`text-[15px] transition-colors ${
              pathname === "/" ? "text-orchid" : "text-white/85 hover:text-white"
            }`}
          >
            Home
          </Link>

          {/* Services dropdown */}
          <div ref={servicesRef} className="relative">
            <button
              onClick={() => setDesktopServicesOpen((v) => !v)}
              className={`flex items-center gap-1.5 text-[15px] transition-colors ${
                servicesActive ? "text-orchid" : "text-white/85 hover:text-white"
              }`}
            >
              Services
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${desktopServicesOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {desktopServicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute left-1/2 top-full mt-3 w-[440px] -translate-x-1/2 overflow-hidden rounded-3xl bg-[#1e1e1e] p-2 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)]"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {/* Leaflet Distribution */}
                    <div className="rounded-2xl bg-[#262626] p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-orchid">
                        Leaflet Distribution
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                        GPS-tracked letterbox drops across Melbourne suburbs.
                      </p>
                      <Link
                        href="/quality"
                        className="mt-4 inline-block rounded-full border border-orchid/40 px-4 py-1.5 text-[12px] font-bold text-orchid transition-colors hover:bg-orchid/10"
                      >
                        View service →
                      </Link>
                    </div>

                    {/* Courier */}
                    <div className="rounded-2xl bg-[#262626] p-5 ring-1 ring-[#5a6bff]/30">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b93ff]">
                        Courier
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                        Fast, cheap courier across Melbourne&apos;s north-east — same-day on request.
                      </p>
                      <Link
                        href="/courier"
                        className="mt-4 inline-block rounded-full bg-[#5a6bff] px-4 py-1.5 text-[12px] font-bold text-white shadow-[0_4px_14px_-2px_rgba(90,107,255,0.5)] transition-opacity hover:opacity-90"
                      >
                        View service →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Common links */}
          {commonLinks.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-[15px] text-white/85 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[15px] transition-colors ${
                  pathname === l.href ? "text-orchid" : "text-white/85 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <Link
          href="/contact"
          className="hidden rounded-full bg-white px-6 py-2.5 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5 xl:inline-flex"
        >
          Get A Quote
        </Link>

        {/* Hamburger */}
        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center xl:hidden"
        >
          <div className="flex flex-col gap-1.5">
            <span className={`h-0.5 w-6 bg-white transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 bg-white transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 bg-white transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-dark xl:hidden"
          >
            <div className="container-site flex flex-col gap-1 pb-5 pt-2">
              <Link
                href="/"
                className={`rounded-xl px-3 py-3 text-base ${
                  pathname === "/" ? "bg-white/10 text-orchid" : "text-white/85"
                }`}
              >
                Home
              </Link>

              {/* Services accordion */}
              <div>
                <button
                  onClick={() => setMobileServicesOpen((v) => !v)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-base ${
                    servicesActive ? "text-orchid" : "text-white/85"
                  }`}
                >
                  Services
                  <svg
                    className={`h-4 w-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {mobileServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-3"
                    >
                      <Link
                        href="/quality"
                        className={`block rounded-xl px-3 py-2.5 text-[15px] font-semibold ${
                          pathname === "/quality" ? "text-orchid" : "text-white/85"
                        }`}
                      >
                        Leaflet Distribution
                      </Link>
                      <Link
                        href="/courier"
                        className={`block rounded-xl px-3 py-2.5 text-[15px] font-semibold ${
                          pathname === "/courier" ? "text-electric" : "text-white/85"
                        }`}
                      >
                        Courier Service
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Common links */}
              {commonLinks.map((l) =>
                l.external ? (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl px-3 py-3 text-base text-white/85"
                  >
                    {l.label} ↗
                  </a>
                ) : (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-xl px-3 py-3 text-base ${
                      pathname === l.href ? "bg-white/10 text-orchid" : "text-white/85"
                    }`}
                  >
                    {l.label}
                  </Link>
                ),
              )}

              <Link
                href="/contact"
                className="mt-2 rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-ink"
              >
                Get A Quote
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
