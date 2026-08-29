import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/data/", "/_next/", "/*?*"],
      crawlDelay: 60,
    },
    sitemap: "https://sgshiok.vercel.app/sitemap.xml",
  };
}
