import type { Metadata } from "next";
import About from "@/components/pages/About";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Founded by a former small-business owner tired of overpriced distribution. Infinite Distributions delivers Melbourne letterbox flyers at maximum impact, minimum cost — meet the team and our mission.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Us | Infinite Distributions",
    description:
      "Melbourne letterbox flyer distribution built on fair pricing and reliability. Maximum impact. Minimum cost.",
    url: "/about",
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
