import type { Metadata } from "next";
import ArrowPill from "@/components/ui/ArrowPill";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[72vh] items-center bg-white pt-24">
      <div className="container-site text-center">
        <p className="section-label">Error 404</p>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-[clamp(2.5rem,8vw,5rem)] font-extrabold leading-[1.02] tracking-tight text-ink">
          This page took a wrong turn.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to
          where the flyers are flowing.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ArrowPill href="/" variant="dark">
            Back to home
          </ArrowPill>
          <ArrowPill href="/contact" variant="light">
            Get a quote
          </ArrowPill>
        </div>
      </div>
    </main>
  );
}
