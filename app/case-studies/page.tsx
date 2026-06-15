import type { Metadata } from "next";
import CaseStudies from "@/components/pages/CaseStudies";

export const metadata: Metadata = {
  title: "Case Studies | Infinite Distributions",
  description: "Building strong foundations — partnered with local businesses across Melbourne.",
};

export default function CaseStudiesPage() {
  return (
    <main>
      <CaseStudies />
    </main>
  );
}
