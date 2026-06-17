import type { Metadata } from "next";
import Join from "@/components/pages/Join";

export const metadata: Metadata = {
  title: "Join The Team — Flyer Distributor Jobs Melbourne",
  description:
    "Flexible contractor work delivering marketing fliers in your local Melbourne streets — earn $15–$20/hr, choose your hours and areas. Great for hardworking high-school students. Apply today.",
  alternates: { canonical: "/join" },
  openGraph: {
    title: "Join The Team — Flyer Distributor Jobs | Infinite Distributions",
    description:
      "Flexible, contract-based flyer delivery work in Melbourne. Earn $15–$20/hr on your own schedule. Apply now.",
    url: "/join",
  },
};

export default function JoinPage() {
  return (
    <main>
      <Join />
    </main>
  );
}
