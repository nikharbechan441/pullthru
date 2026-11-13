import type { MetadataRoute } from "next";

const ALLOWED_PUBLIC_PATHS = [
  "/",
  "/create",
  "/split-bill",
  "/for-venues",
  "/braai-calculator",
  "/partiful-south-africa",
  "/quicket-alternative",
  "/group-gift-pot",
  "/5-a-side-and-padel",
  "/help",
  "/terms",
  "/llms.txt",
  "/llms-full.txt",
  "/kb.json",
  "/openapi.json",
  "/.well-known/ai-plugin.json",
  "/ads.txt",
  "/google1768e93f48fa5f30.html",
  "/e/",
];

const DISALLOWED_PATHS = ["/api/", "/phone", "/playstore", "/redesigns"];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pullthru.co.za";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOWED_PUBLIC_PATHS,
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "GPTBot",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "Meta-ExternalAgent",
        ],
        allow: ALLOWED_PUBLIC_PATHS,
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: "Mediapartners-Google",
        allow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
