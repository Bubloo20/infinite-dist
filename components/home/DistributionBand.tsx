"use client";

export default function DistributionBand() {
  return (
    <section className="relative h-[320px] overflow-hidden sm:h-[420px]">
      {/* angled colorful gradient, evoking the original photo band */}
      <div className="absolute inset-0 bg-night" />
      <div className="absolute inset-0 animate-gradient-pan bg-[linear-gradient(115deg,#1a1a1a_0%,#2a2150_18%,#3b3bd6_42%,#7c8bff_62%,#c98b6a_85%,#1a1a1a_100%)] bg-[length:200%_200%] opacity-90" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25),transparent_40%,rgba(0,0,0,0.35))]" />
      <div className="relative flex h-full items-center justify-center overflow-hidden">
        <span className="watermark whitespace-nowrap text-[clamp(3rem,16vw,12rem)] -rotate-6">
          Distribution
        </span>
      </div>
    </section>
  );
}
