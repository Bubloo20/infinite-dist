import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const SITE_URL = "https://infinitemelb.online";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Infinite Distributions | Letterbox Flyer Distribution Melbourne",
    template: "%s | Infinite Distributions",
  },
  description:
    "Melbourne's trusted letterbox flyer & leaflet distribution. From your hand to the letterbox — no middleman, no hassle, delivery guaranteed. GPS-tracked, crease-free drops across Manningham, Ivanhoe, Heidelberg, Northcote, Preston & more.",
  keywords: [
    "letterbox distribution Melbourne",
    "flyer distribution Melbourne",
    "leaflet distribution Melbourne",
    "letterbox drops",
    "pamphlet delivery Melbourne",
    "real estate flyer distribution",
    "GPS tracked letterbox distribution",
    "Infinite Distributions",
    "Manningham flyer distribution",
    "Heidelberg leaflet delivery",
  ],
  authors: [{ name: "Infinite Distributions" }],
  creator: "Infinite Distributions",
  publisher: "Infinite Distributions",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: "Infinite Distributions",
    title: "Infinite Distributions | Letterbox Flyer Distribution Melbourne",
    description:
      "Melbourne's trusted letterbox flyer distribution — GPS-tracked, crease-free, delivery guaranteed. No middleman, no hassle.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Infinite Distributions — Letterbox Flyer Distribution in Melbourne",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Infinite Distributions | Letterbox Flyer Distribution Melbourne",
    description:
      "Melbourne's trusted letterbox flyer distribution — GPS-tracked, crease-free, delivery guaranteed.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/favicon.svg" },
  category: "business",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#business`,
  name: "Infinite Distributions",
  description:
    "Melbourne letterbox flyer and leaflet distribution. GPS-tracked, crease-free drops direct to residential letterboxes. Delivery guaranteed.",
  url: SITE_URL,
  email: "infinitedistributionsmelb@gmail.com",
  telephone: "+61421042007",
  priceRange: "From $75",
  image: `${SITE_URL}/favicon.svg`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Melbourne",
    addressRegion: "VIC",
    addressCountry: "AU",
  },
  areaServed: [
    "Manningham",
    "Doncaster",
    "Bulleen",
    "Templestowe",
    "Ivanhoe",
    "Heidelberg",
    "Macleod",
    "Rosanna",
    "Northcote",
    "Thornbury",
    "Preston",
    "Melbourne",
  ].map((name) => ({ "@type": "Place", name })),
  slogan: "Local Reach. Maximum Impact.",
  knowsAbout: ["Letterbox distribution", "Flyer delivery", "Leaflet distribution", "Direct mail marketing"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ScrollProgress />
        <Nav />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
