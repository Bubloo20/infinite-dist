import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Portal",
  description: "Private work-log portal for the Infinite Distribution team.",
  robots: { index: false, follow: false, nocache: true },
  // Declared here too: the portal sets its own metadata, and without this the
  // tab falls back to a blank globe instead of the mark.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icon-192.png",
  },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
