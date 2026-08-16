import type { Metadata } from "next";
import Quality from "@/components/pages/Quality";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "100% Quality & Pricing",
  description:
    "Every client, every letter, successfully delivered — guaranteed. GPS-tracked letterbox drops, authenticated proof of delivery, and transparent flexible plans from $75. Personal & Business options.",
  alternates: { canonical: "/quality" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Infinite Distribution",
    title: "100% Quality & Pricing | Infinite Distribution",
    description:
      "GPS-tracked, crease-free letterbox distribution with proof of delivery. Flexible plans from $75.",
    url: "/quality",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Infinite Distribution — Letterbox Flyer Distribution in Melbourne" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "100% Quality & Pricing | Infinite Distribution",
    description:
      "GPS-tracked, crease-free letterbox distribution with proof of delivery. Flexible plans from $75.",
    images: ["/og.png"],
  },
};

export default function QualityPage() {
  return (
    <main>
      <Quality />
      <CtaBand />
    </main>
  );
}
