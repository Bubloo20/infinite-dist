"use client";

import ProcessSteps, { type Step, type Aside } from "@/components/ProcessSteps";

// Generic, whole-company overview — covers both leaflet distribution and the
// courier service. The full, service-specific step-by-step lives on /quality
// (leaflet) and /courier (parcels & courier).
const steps: Step[] = [
  {
    n: "01",
    title: "Tell Us What You Need",
    body: "Send us your flyers to distribute, or book a parcel pickup. One quick message gets it started.",
    dark: true,
  },
  {
    n: "02",
    title: "We Plan The Job",
    body: "We map the best letterbox routes for your campaign, or the fastest courier path across Melbourne.",
    dark: false,
  },
  {
    n: "03",
    title: "Reliable Delivery",
    body: "Trained distributors reach every letterbox, or a driver takes your parcel door to door — on time, every time.",
    dark: true,
  },
  {
    n: "04",
    title: "Proof & Tracking",
    body: "GPS tracking and photo proof on completion, so you always know the job is done.",
    dark: false,
  },
];

const aside: Aside[] = [
  {
    h: "Delivery Proof",
    p: "Every job is tracked. We send the tracking data and photos to you as proof of completion.",
  },
  {
    h: "Our Guarantee",
    p: "Whether it's a leaflet in the letterbox or a parcel at the door, it's tracked and delivered with care.",
  },
];

export default function Process() {
  return <ProcessSteps eyebrow="How Our Flawless System Works" steps={steps} aside={aside} />;
}
