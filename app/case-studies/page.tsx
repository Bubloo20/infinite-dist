import type { Metadata } from "next";
import CaseStudies from "@/components/pages/CaseStudies";

export const metadata: Metadata = {
  title: "Case Studies & Clients",
  description:
    "See how Melbourne businesses grow with letterbox distribution. Real campaigns, real delivery proof, and trusted partners across real estate, hospitality, trades and more.",
  alternates: { canonical: "/case-studies" },
  openGraph: {
    title: "Case Studies & Clients | Infinite Distributions",
    description:
      "Real letterbox distribution campaigns and trusted local partners across Melbourne.",
    url: "/case-studies",
  },
};

export default function CaseStudiesPage() {
  return (
    <main>
      <CaseStudies />
    </main>
  );
}
