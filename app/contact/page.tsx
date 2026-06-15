import type { Metadata } from "next";
import Contact from "@/components/pages/Contact";

export const metadata: Metadata = {
  title: "Contact | Infinite Distributions",
  description:
    "Discover a new way of advertising. Take the first step with a FREE quote. Call 0421 042 007 or email infinitedistributionsmelb@gmail.com.",
};

export default function ContactPage() {
  return (
    <main>
      <Contact />
    </main>
  );
}
