import type { Metadata } from "next";
import CaseStudies from "@/components/pages/CaseStudies";

export const metadata: Metadata = {
  title: "Case Studies & Clients",
  description:
    "See how Melbourne businesses grow with letterbox distribution. Real campaigns, real delivery proof, and trusted partners across real estate, hospitality, trades and more.",
  alternates: { canonical: "/case-studies" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Infinite Distribution",
    title: "Case Studies & Clients | Infinite Distribution",
    description:
      "Real letterbox distribution campaigns and trusted local partners across Melbourne.",
    url: "/case-studies",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Infinite Distribution — Letterbox Flyer Distribution in Melbourne" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies & Clients | Infinite Distribution",
    description:
      "Real letterbox distribution campaigns and trusted local partners across Melbourne.",
    images: ["/og.png"],
  },
};

export default function CaseStudiesPage() {
  return (
    <main>
      <CaseStudies />
    </main>
  );
}
