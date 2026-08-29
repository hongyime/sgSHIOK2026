import type { MetadataRoute } from "next";

const TRAINING_CRAWLER_BLOCKLIST = ["GPTBot", "ClaudeBot", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: TRAINING_CRAWLER_BLOCKLIST,
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/data/", "/_next/", "/*?*"],
        crawlDelay: 300,
      },
    ],
    sitemap: "https://sgshiok.vercel.app/sitemap.xml",
  };
}
