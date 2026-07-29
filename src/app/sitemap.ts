import type { MetadataRoute } from "next";
import { buildSeedDb } from "@/lib/mock/seed";

const BASE = "https://realestate-gh.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/listings",
    "/map",
    "/service-providers",
    "/pricing",
    "/faq",
    "/about",
    "/register",
  ].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: path === "/listings" || path === "/map" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const listingRoutes: MetadataRoute.Sitemap = buildSeedDb()
    .listings.filter((l) => l.status === "active")
    .map((l) => ({
      url: `${BASE}/property/${l.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...listingRoutes];
}
