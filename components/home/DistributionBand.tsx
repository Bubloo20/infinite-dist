"use client";

import Image from "next/image";

export default function DistributionBand() {
  return (
    <section className="relative h-[320px] overflow-hidden sm:h-[460px]">
      <Image
        src="/images/home-distributions.jpg"
        alt="Infinite Distribution"
        fill
        sizes="100vw"
        className="object-cover"
      />
    </section>
  );
}
