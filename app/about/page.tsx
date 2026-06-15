import type { Metadata } from "next";
import About from "@/components/pages/About";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "About | Infinite Distributions",
  description:
    "As a previous small business owner, large letter distribution companies overcharged us. So we fixed that. Maximum impact. Minimum cost.",
};

export default function AboutPage() {
  return (
    <main>
      <About />
      <CtaBand />
    </main>
  );
}
