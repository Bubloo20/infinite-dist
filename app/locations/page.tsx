import type { Metadata } from "next";
import Locations from "@/components/pages/Locations";
import CtaBand from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Locations & Coverage Areas",
  description:
    "Our letterbox distribution coverage map — door-to-door flyer delivery within a 4km radius of Northcote, Thornbury, Ivanhoe and Heidelberg, plus nearby Melbourne suburbs like Preston, Macleod and Rosanna.",
  alternates: { canonical: "/locations" },
  openGraph: {
    title: "Locations & Coverage Areas | Infinite Distributions",
    description:
      "See our Melbourne letterbox distribution coverage — Northcote, Thornbury, Ivanhoe, Heidelberg and surrounding suburbs.",
    url: "/locations",
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
