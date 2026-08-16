import type { Metadata } from "next";
import GuaranteeTerms from "@/components/pages/GuaranteeTerms";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "On-Time Delivery Promise — Terms & Conditions",
  description:
    "The terms of Infinite Distribution' On-Time Delivery Promise: if we miss an agreed delivery deadline for reasons within our control, your delivery is free. Eligibility, exclusions and refund details.",
  alternates: { canonical: "/guarantee-terms" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Infinite Distribution",
    title: "On-Time Delivery Promise — Terms & Conditions | Infinite Distribution",
    description:
      "How our on-time delivery guarantee works — eligibility, exclusions and refunds.",
    url: "/guarantee-terms",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Infinite Distribution — Letterbox Flyer Distribution in Melbourne" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "On-Time Delivery Promise — Terms & Conditions | Infinite Distribution",
    description:
      "How our on-time delivery guarantee works — eligibility, exclusions and refunds.",
    images: ["/og.png"],
  },
};

export default function GuaranteeTermsPage() {
  return (
    <main>
      <GuaranteeTerms />
      <CtaBand />
    </main>
  );
}
