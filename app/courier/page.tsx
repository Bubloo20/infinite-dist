import type { Metadata } from "next";
import Courier from "@/components/pages/Courier";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Courier Service Melbourne — Fast & Cheap Delivery",
  description:
    "Courier service across Melbourne, with same-day available on request. GPS-tracked, proof of delivery, low flat rates from $15. Book your local or metro courier run today.",
  alternates: { canonical: "/courier" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Infinite Distributions",
    title: "Courier Service Melbourne | Infinite Distributions",
    description:
      "Fast, cheap, and reliable courier service across Melbourne. Same-day pickup on request, GPS tracking, proof of delivery.",
    url: "/courier",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Infinite Distributions — Courier Service Melbourne" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Courier Service Melbourne | Infinite Distributions",
    description:
      "Fast, cheap, and reliable courier service across Melbourne. Same-day pickup on request, GPS tracking, proof of delivery.",
    images: ["/og.png"],
  },
};

export default function CourierPage() {
  return (
    <main>
      <Courier />
      <CtaBand />
    </main>
  );
}
