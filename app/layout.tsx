import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";
import LoadingScreen from "@/components/LoadingScreen";
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
    default: "Infinite Distributions — Letterbox Distribution & Courier Melbourne",
    template: "%s | Infinite Distributions",
  },
  description:
    "Melbourne letterbox flyer distribution and same-day courier — GPS-tracked, crease-free, and on-time delivery guaranteed or it's free. Door-to-door drops and parcel delivery across Northcote, Ivanhoe, Heidelberg, Kew, Hawthorn, Balwyn and Melbourne's north-east.",
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
    url: "/",
    siteName: "Infinite Distributions",
    title: "Infinite Distributions — Letterbox Distribution & Courier Melbourne",
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
    title: "Infinite Distributions — Letterbox Distribution & Courier Melbourne",
    description:
      "Melbourne's trusted letterbox flyer distribution — GPS-tracked, crease-free, delivery guaranteed.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  },
  category: "business",
  verification: {
    google: "L5_PgfjJ0LKTNkR_VfJrRh76OjQWpR2tuf029XbkWlo",
  },
};

export const viewport: Viewport = {
  themeColor: "#0200dd",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Infinite Distributions",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#business` },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#business`,
      name: "Infinite Distributions",
      description:
        "Melbourne letterbox flyer distribution and courier service. GPS-tracked, crease-free drops direct to residential letterboxes, plus fast parcel and document courier — backed by an on-time delivery guarantee.",
      url: SITE_URL,
      email: "infinitedistributionsmelb@gmail.com",
      telephone: "+61421042007",
      priceRange: "From $75",
      image: `${SITE_URL}/og.png`,
      logo: `${SITE_URL}/icon-512.png`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Melbourne",
        addressRegion: "VIC",
        addressCountry: "AU",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -37.8136,
        longitude: 144.9631,
      },
      areaServed: [
        "Northcote",
        "Thornbury",
        "Ivanhoe",
        "Heidelberg",
        "Kew",
        "Hawthorn",
        "Balwyn",
        "Preston",
        "Fairfield",
        "Alphington",
        "Eaglemont",
        "Macleod",
        "Rosanna",
        "Reservoir",
        "Bulleen",
        "Doncaster",
        "Templestowe",
        "Manningham",
        "Melbourne",
      ].map((name) => ({ "@type": "Place", name })),
      slogan: "Local Reach. Maximum Impact.",
      knowsAbout: [
        "Letterbox distribution",
        "Flyer delivery",
        "Leaflet distribution",
        "Direct mail marketing",
        "Courier service",
        "Same-day delivery",
        "Parcel and document delivery",
      ],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#leaflet-distribution`,
      serviceType: "Letterbox flyer distribution",
      name: "Letterbox Distribution",
      description:
        "GPS-tracked, door-to-door letterbox flyer and leaflet distribution across Melbourne's inner north and north-east.",
      provider: { "@id": `${SITE_URL}/#business` },
      areaServed: { "@type": "City", name: "Melbourne" },
      url: `${SITE_URL}/quality`,
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#courier`,
      serviceType: "Courier and parcel delivery",
      name: "Courier Service",
      description:
        "Fast, affordable courier for parcels and documents across Melbourne — same-day on request, GPS-tracked, with proof of delivery and an on-time guarantee.",
      provider: { "@id": `${SITE_URL}/#business` },
      areaServed: { "@type": "City", name: "Melbourne" },
      url: `${SITE_URL}/courier`,
    },
  ],
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
        <LoadingScreen />
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
