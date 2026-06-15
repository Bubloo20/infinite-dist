import type { Metadata } from "next";
import Join from "@/components/pages/Join";

export const metadata: Metadata = {
  title: "Join The Team | Infinite Distributions",
  description:
    "Join our team as a contractor and earn $15–20 per hour delivering marketing fliers in your local streets. Flexible schedule, choose your areas.",
};

export default function JoinPage() {
  return (
    <main>
      <Join />
    </main>
  );
}
