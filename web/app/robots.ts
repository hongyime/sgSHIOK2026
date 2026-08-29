import type { MetadataRoute } from "next";

const NON_USER_CRAWLER_BLOCKLIST = [
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "FacebookBot",
  "meta-externalagent",
  "SemrushBot",
  "AhrefsBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: NON_USER_CRAWLER_BLOCKLIST,
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
