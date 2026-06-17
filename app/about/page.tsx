import type { Metadata } from "next";
import About from "@/components/pages/About";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Founded by a former small-business owner tired of overpriced distribution. Infinite Distributions delivers Melbourne letterbox flyers at maximum impact, minimum cost — meet the team and our mission.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Infinite Distributions",
    title: "About Us | Infinite Distributions",
    description:
      "Melbourne letterbox flyer distribution built on fair pricing and reliability. Maximum impact. Minimum cost.",
    url: "/about",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Infinite Distributions — Letterbox Flyer Distribution in Melbourne" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Infinite Distributions",
    description:
      "Melbourne letterbox flyer distribution built on fair pricing and reliability. Maximum impact. Minimum cost.",
    images: ["/og.png"],
  },
};

export default function AboutPage() {
  return (
    <main>
      <About />
      <CtaBand />
    </main>
  );
}
