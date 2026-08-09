import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Portal",
  description: "Private work-log portal for Infinite Distributions team members.",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
