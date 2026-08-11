import type { MetadataRoute } from "next";
import { buildSeedDb } from "@/lib/mock/seed";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;
const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

/** Property page ids for the sitemap — real listings when live, else the seed. */
async function listingIds(): Promise<string[]> {
  if (!API) {
    return buildSeedDb()
      .listings.filter((l) => l.status === "active")
      .map((l) => l.id);
  }
  try {
    const res = await fetch(`${API}/v1/listings?pageSize=100`, {
      headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      next: { revalidate: 86_400 }, // refresh the sitemap daily
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items: Array<{ id?: string }> = json?.data?.items ?? json?.data?.listings ?? json?.data ?? [];
    return items.map((l) => l.id).filter((id): id is string => !!id);
  } catch {
    return []; // backend unreachable at build → ship the static routes only
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/listings",
    "/map",
    "/land-check",
    "/materials",
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

  const listingRoutes: MetadataRoute.Sitemap = (await listingIds()).map((id) => ({
    url: `${BASE}/property/${id}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes];
}
