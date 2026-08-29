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
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "PetalBot",
  "Barkrowler",
  "DataForSeoBot",
  "MauiBot",
  "serpstatbot",
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
        disallow: [
          "/api/",
          "/data/",
          "/_next/",
          "/favicon.ico",
          "/apple-touch-icon.png",
          "/apple-touch-icon-precomposed.png",
          "/site.webmanifest",
          "/manifest.json",
          "/*?*",
        ],
        crawlDelay: 3600,
      },
    ],
  };
}
