import { MetadataRoute } from "next";

const BASE = (() => {
  const u = process.env.NEXT_PUBLIC_APP_URL || "https://agentbay.com";
  return u.startsWith("http") ? u : `https://${u}`;
})();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${BASE}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
