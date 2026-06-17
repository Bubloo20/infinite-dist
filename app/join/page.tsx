import type { Metadata } from "next";
import Join from "@/components/pages/Join";

export const metadata: Metadata = {
  title: "Join The Team — Flyer Distributor Jobs Melbourne",
  description:
    "Flexible contractor work delivering marketing fliers in your local Melbourne streets — earn $15–$20/hr, choose your hours and areas. Great for hardworking high-school students. Apply today.",
  alternates: { canonical: "/join" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Infinite Distributions",
    title: "Join The Team — Flyer Distributor Jobs | Infinite Distributions",
    description:
      "Flexible, contract-based flyer delivery work in Melbourne. Earn $15–$20/hr on your own schedule. Apply now.",
    url: "/join",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Infinite Distributions — Letterbox Flyer Distribution in Melbourne" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Join The Team — Flyer Distributor Jobs | Infinite Distributions",
    description:
      "Flexible, contract-based flyer delivery work in Melbourne. Earn $15–$20/hr on your own schedule. Apply now.",
    images: ["/og.png"],
  },
};

export default function JoinPage() {
  return (
    <main>
      <Join />
    </main>
  );
}
