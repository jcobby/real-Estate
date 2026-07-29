import type { Lead } from "@/types";
import { delay, getDb, mutateDb } from "@/lib/mock/db";
import { LIVE, http, many, payload } from "./http";

export async function getSellerLeads(sellerId: string): Promise<Lead[]> {
  if (LIVE) return many<Lead>(await http.get(`/v1/sellers/${sellerId}/leads`));
  await delay();
  const db = getDb();
  const myListingIds = new Set(db.listings.filter((l) => l.sellerId === sellerId).map((l) => l.id));
  return db.leads
    .filter((l) => myListingIds.has(l.listingId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateLeadStatus(id: string, status: Lead["status"]): Promise<void> {
  if (LIVE) {
    await http.patch(`/v1/leads/${id}`, { status });
    return;
  }
  await delay(250);
  mutateDb((db) => {
    const lead = db.leads.find((x) => x.id === id);
    if (lead) lead.status = status;
  });
}

export interface SellerStats {
  totalViews: number;
  totalSaves: number;
  totalLeads: number;
  conversion: number;
  activeListings: number;
  weeklyViews: Array<{ week: string; views: number; leads: number }>;
}

const EMPTY_SELLER_STATS: SellerStats = {
  totalViews: 0,
  totalSaves: 0,
  totalLeads: 0,
  conversion: 0,
  activeListings: 0,
  weeklyViews: [],
};

export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  if (LIVE) {
    const d = payload<Partial<SellerStats>>(await http.get(`/v1/sellers/${sellerId}/stats`));
    return { ...EMPTY_SELLER_STATS, ...d, weeklyViews: d.weeklyViews ?? [] };
  }
  await delay();
  const db = getDb();
  const mine = db.listings.filter((l) => l.sellerId === sellerId && l.status !== "removed");
  const totalViews = mine.reduce((s, l) => s + l.views, 0);
  const totalSaves = mine.reduce((s, l) => s + l.saves, 0);
  const totalLeads = mine.reduce((s, l) => s + l.leads, 0);
  // deterministic 8-week series derived from the totals
  const weeklyViews = Array.from({ length: 8 }, (_, i) => {
    const share = [0.08, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.17][i];
    return {
      week: `W${i + 1}`,
      views: Math.round(totalViews * share),
      leads: Math.round(totalLeads * share),
    };
  });
  return {
    totalViews,
    totalSaves,
    totalLeads,
    conversion: totalViews ? +((totalLeads / totalViews) * 100).toFixed(1) : 0,
    activeListings: mine.filter((l) => l.status === "active").length,
    weeklyViews,
  };
}
