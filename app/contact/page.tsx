import type { Metadata } from "next";
import Contact from "@/components/pages/Contact";

export const metadata: Metadata = {
  title: "Contact & Free Quote",
  description:
    "Get a free, no-obligation quote for letterbox flyer distribution in Melbourne. Call 0421 042 007 or email infinitedistributionsmelb@gmail.com — we reply within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Infinite Distribution",
    title: "Contact & Free Quote | Infinite Distribution",
    description:
      "Free, no-obligation letterbox distribution quote for your Melbourne campaign. Reply within one business day.",
    url: "/contact",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Infinite Distribution — Letterbox Flyer Distribution in Melbourne" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact & Free Quote | Infinite Distribution",
    description:
      "Free, no-obligation letterbox distribution quote for your Melbourne campaign. Reply within one business day.",
    images: ["/og.png"],
  },
};

export default function ContactPage() {
  return (
    <main>
      <Contact />
    </main>
  );
}
