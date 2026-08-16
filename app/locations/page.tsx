import type { Metadata } from "next";
import Locations from "@/components/pages/Locations";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Locations & Coverage Areas",
  description:
    "Our letterbox distribution coverage map — door-to-door flyer delivery within a 4km radius of Northcote, Thornbury, Ivanhoe, Heidelberg, Kew, Hawthorn and Balwyn, plus nearby Melbourne suburbs like Preston, Macleod and Rosanna.",
  alternates: { canonical: "/locations" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Infinite Distribution",
    title: "Locations & Coverage Areas | Infinite Distribution",
    description:
      "See our Melbourne letterbox distribution coverage — Northcote, Thornbury, Ivanhoe, Heidelberg, Kew, Hawthorn, Balwyn and surrounding suburbs.",
    url: "/locations",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Infinite Distribution — Letterbox Flyer Distribution in Melbourne" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Locations & Coverage Areas | Infinite Distribution",
    description:
      "See our Melbourne letterbox distribution coverage — Northcote, Thornbury, Ivanhoe, Heidelberg, Kew, Hawthorn, Balwyn and surrounding suburbs.",
    images: ["/og.png"],
  },
};

export default function LocationsPage() {
  return (
    <main>
      <Locations />
      <CtaBand />
    </main>
  );
}
