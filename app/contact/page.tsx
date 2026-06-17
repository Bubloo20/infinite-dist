import type { Metadata } from "next";
import Contact from "@/components/pages/Contact";

export const metadata: Metadata = {
  title: "Contact & Free Quote",
  description:
    "Get a free, no-obligation quote for letterbox flyer distribution in Melbourne. Call 0421 042 007 or email infinitedistributionsmelb@gmail.com — we reply within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact & Free Quote | Infinite Distributions",
    description:
      "Free, no-obligation letterbox distribution quote for your Melbourne campaign. Reply within one business day.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main>
      <Contact />
    </main>
  );
}
