import type { ServiceCategory, ServiceProvider } from "@/types";
import { delay, getDb } from "@/lib/mock/db";
import { LIVE, http, many, one } from "./http";
import { normalizeProvider } from "./normalize";

export interface ProviderFilters {
  q?: string;
  category?: ServiceCategory | "all";
  region?: string | "all";
}

export async function getProviders(filters: ProviderFilters = {}): Promise<ServiceProvider[]> {
  if (LIVE) {
    return many<ServiceProvider>(
      await http.get("/v1/providers", { q: filters.q, category: filters.category, region: filters.region }),
    ).map(normalizeProvider);
  }
  await delay();
  let items = getDb().providers;
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.services.some((s) => s.toLowerCase().includes(q)) ||
        p.city.toLowerCase().includes(q),
    );
  }
  if (filters.category && filters.category !== "all") items = items.filter((p) => p.category === filters.category);
  if (filters.region && filters.region !== "all") items = items.filter((p) => p.region === filters.region);
  return [...items].sort((a, b) => b.rating - a.rating);
}

export async function getProvider(id: string): Promise<ServiceProvider | null> {
  if (LIVE) {
    const p = one<ServiceProvider>(await http.get(`/v1/providers/${id}`), "provider");
    return p ? normalizeProvider(p) : null;
  }
  await delay(200);
  return getDb().providers.find((p) => p.id === id) ?? null;
}
