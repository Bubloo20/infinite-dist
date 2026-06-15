"use client";

export default function DistributionBand() {
  return (
    <section className="relative h-[320px] overflow-hidden sm:h-[460px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/home-distributions.jpg"
        alt="Infinite Distributions"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </section>
  );
}
