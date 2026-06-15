import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Infinite Distributions | Local Reach. Maximum Impact.",
  description:
    "From your hand to the letterbox. Nothing else. No middleman. No hassle. Delivery guaranteed. Melbourne's trusted letterbox flyer distribution — GPS-tracked, crease-free, money-back guaranteed.",
  metadataBase: new URL("https://infinitedistributions.com.au"),
  openGraph: {
    title: "Infinite Distributions | Local Reach. Maximum Impact.",
    description:
      "From your hand to the letterbox. No middleman. No hassle. Delivery guaranteed.",
    type: "website",
    locale: "en_AU",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <ScrollProgress />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
