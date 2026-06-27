import type { MetadataRoute } from "next";

const SITE_URL = "https://infinitemelb.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/quality", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/case-studies", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/locations", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/courier", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/join", priority: 0.6, changeFrequency: "monthly" as const },
  ];

  const lastModified = new Date();

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
