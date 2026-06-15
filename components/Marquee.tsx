"use client";

const items = [
  "Real Estate",
  "Local Restaurants",
  "Retail & Franchises",
  "Political Campaigns",
  "Trades & Services",
  "Community Events",
  "Gyms & Studios",
  "Charities",
];

export default function Marquee() {
  return (
    <section className="border-y border-slate-100 bg-white py-6">
      <div className="container-max mb-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Trusted by businesses across Melbourne
        </p>
      </div>
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex shrink-0 animate-marquee items-center gap-12 pr-12">
          {[...items, ...items].map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap text-lg font-semibold text-slate-400 transition-colors hover:text-brand-600"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 animate-marquee items-center gap-12 pr-12" aria-hidden>
          {[...items, ...items].map((item, i) => (
            <span
              key={`b-${i}`}
              className="whitespace-nowrap text-lg font-semibold text-slate-400"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
