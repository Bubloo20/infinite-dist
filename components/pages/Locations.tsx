"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";

// Core coverage suburbs — a 4km delivery radius is drawn over each.
const suburbs = [
  { name: "Northcote", lat: -37.7697, lng: 145.0017 },
  { name: "Thornbury", lat: -37.7561, lng: 144.9995 },
  { name: "Ivanhoe", lat: -37.7667, lng: 145.0419 },
  { name: "Heidelberg", lat: -37.7561, lng: 145.0667 },
  { name: "Kew", lat: -37.806, lng: 145.033 },
  { name: "Hawthorn", lat: -37.822, lng: 145.035 },
  { name: "Balwyn", lat: -37.809, lng: 145.0815 },
];

const nearby = [
  "Preston",
  "Macleod",
  "Rosanna",
  "Fairfield",
  "Alphington",
  "Bulleen",
  "Templestowe",
  "Doncaster",
  "Eaglemont",
  "Reservoir",
];

export default function Locations() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = (await import("leaflet")) as unknown as { default?: typeof import("leaflet") };
      const L = (mod.default ?? mod) as typeof import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        },
      ).addTo(map);

      // Build the view bounds geographically (independent of map projection) so
      // this works before the first setView. Each suburb contributes an 8km box
      // (a 4km radius) which we union — relying on circle.getBounds() here would
      // throw, because layers aren't projected until the map has a view.
      let bounds: ReturnType<typeof L.latLngBounds> | null = null;
      suburbs.forEach((s) => {
        L.circle([s.lat, s.lng], {
          radius: 4000,
          color: "#3a45e0",
          weight: 2,
          fillColor: "#5a6bff",
          fillOpacity: 0.14,
        }).addTo(map);

        L.circleMarker([s.lat, s.lng], {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#0200dd",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip(s.name, {
            permanent: true,
            direction: "top",
            offset: [0, -8],
            className: "coverage-label",
          });

        const box = L.latLng(s.lat, s.lng).toBounds(8000);
        bounds = bounds ? bounds.extend(box) : box;
      });

      if (bounds) {
        map.fitBounds(bounds, { animate: false, padding: [24, 24] });
      } else {
        map.setView([-37.762, 145.03], 12);
      }
    })();

    return () => {
      cancelled = true;
      const m = mapRef.current as { remove?: () => void } | null;
      if (m && typeof m.remove === "function") {
        m.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <section className="bg-white pt-36 pb-12">
        <div className="container-site">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label"
          >
            Service Areas
          </motion.h2>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-4xl font-display text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-tight text-ink"
          >
            Where we{" "}
            <span className="bg-gradient-to-r from-electric to-orchid bg-clip-text text-transparent">
              deliver
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70"
          >
            We cover Melbourne&apos;s inner north, north-east and east — door-to-door letterbox
            distribution within roughly a <span className="font-semibold text-ink">4&nbsp;km radius</span>{" "}
            of Northcote, Thornbury, Ivanhoe, Heidelberg, Kew, Hawthorn and Balwyn, plus the surrounding
            suburbs. Not sure if we reach your street? Just ask.
          </motion.p>
        </div>
      </section>

      <section className="bg-white pb-16">
        <div className="container-site">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="overflow-hidden rounded-4xl border border-slate-200 shadow-soft"
          >
            <div
              ref={containerRef}
              className="h-[420px] w-full sm:h-[560px]"
              aria-label="Map of Infinite Distributions delivery coverage area"
            />
          </motion.div>
          <p className="mt-4 text-sm text-slate-500">
            Each shaded circle marks a 4&nbsp;km delivery radius. Overlapping zones are covered most
            frequently.
          </p>
        </div>
      </section>

      <section className="bg-white pb-24">
        <div className="container-site">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Core suburbs &amp; nearby areas
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {suburbs.map((s) => (
              <span
                key={s.name}
                className="rounded-full bg-gradient-to-r from-electric to-orchid px-5 py-2.5 text-sm font-semibold text-white"
              >
                {s.name}
              </span>
            ))}
            {nearby.map((n) => (
              <span
                key={n}
                className="rounded-full border border-slate-200 bg-mist px-5 py-2.5 text-sm font-medium text-ink/75"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
