import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Infinite Distributions",
    short_name: "Infinite",
    description:
      "Melbourne's trusted letterbox flyer & leaflet distribution — GPS-tracked, crease-free, delivery guaranteed.",
    start_url: "/",
    display: "standalone",
    background_color: "#161616",
    theme_color: "#0200dd",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
