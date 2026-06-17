import type { Metadata } from "next";
import Quality from "@/components/pages/Quality";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "100% Quality & Pricing",
  description:
    "Every client, every letter, successfully delivered — guaranteed. GPS-tracked letterbox drops, authenticated proof of delivery, and transparent flexible plans from $75. Personal & Business options.",
  alternates: { canonical: "/quality" },
  openGraph: {
    title: "100% Quality & Pricing | Infinite Distributions",
    description:
      "GPS-tracked, crease-free letterbox distribution with proof of delivery. Flexible plans from $75.",
    url: "/quality",
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
