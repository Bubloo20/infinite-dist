import type { Metadata } from "next";
import Quality from "@/components/pages/Quality";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "100% Quality | Infinite Distributions",
  description:
    "Every client, every letter, successfully delivered — guaranteed. GPS-tracked drops, transparent pricing, and flexible plans starting from $75.",
};

export default function QualityPage() {
  return (
    <main>
      <Quality />
      <CtaBand />
    </main>
  );
}
