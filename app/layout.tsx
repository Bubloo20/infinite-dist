import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Infinite Distribution | Local Reach. Maximum Impact.",
  description:
    "Melbourne's trusted letterbox flyer distribution. From your hand to the letterbox — no middleman, no hassle, delivery guaranteed. GPS-tracked drops, crease-free delivery, money-back guarantee.",
  keywords: [
    "letterbox distribution",
    "flyer delivery Melbourne",
    "leaflet distribution",
    "direct marketing Melbourne",
    "Infinite Distribution",
  ],
  metadataBase: new URL("https://infinitedistribution.com"),
  openGraph: {
    title: "Infinite Distribution | Local Reach. Maximum Impact.",
    description:
      "Melbourne's trusted letterbox flyer distribution. GPS-tracked, crease-free, delivery guaranteed.",
    type: "website",
    locale: "en_AU",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
