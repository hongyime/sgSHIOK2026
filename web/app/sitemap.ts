import type { MetadataRoute } from "next";

const SITE_URL = "https://sgshiok.vercel.app/";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-08-29T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
