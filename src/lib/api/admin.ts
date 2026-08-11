import type { AbuseReport, Listing, User } from "@/types";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, many, payload } from "./http";
import { normalizeListing, normalizeUser } from "./normalize";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PlatformStats {
  totalListings: number;
  activeListings: number;
  totalUsers: number;
  verifiedShare: number;
  gmv: number;
  openReports: number;
  pendingVerifications: number;
  monthlySeries: Array<{ month: string; listings: number; gmv: number; users: number }>;
  regionBreakdown: Array<{ region: string; count: number }>;
}

const EMPTY_PLATFORM_STATS: PlatformStats = {
  totalListings: 0,
  activeListings: 0,
  totalUsers: 0,
  verifiedShare: 0,
  gmv: 0,
  openReports: 0,
  pendingVerifications: 0,
  monthlySeries: [],
  regionBreakdown: [],
};

export async function getPlatformStats(): Promise<PlatformStats> {
  if (LIVE) {
    const d = payload<Partial<PlatformStats>>(await http.get("/v1/admin/stats"));
    return { ...EMPTY_PLATFORM_STATS, ...d, monthlySeries: d.monthlySeries ?? [], regionBreakdown: d.regionBreakdown ?? [] };
  }
  await delay();
  const db = getDb();
  const active = db.listings.filter((l) => l.status === "active");
  const verified = active.filter((l) => l.verification === "verified");
  const gmv = db.purchases.reduce((s, p) => s + p.amount, 0) + 1_240_000; // + historic sales
  const rand = mulberry32(99);
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const monthlySeries = months.map((month, i) => ({
    month,
    listings: Math.round(14 + i * 4 + rand() * 8),
    gmv: Math.round((120_000 + i * 90_000 + rand() * 60_000) / 1000) * 1000,
    users: Math.round(40 + i * 22 + rand() * 15),
  }));
  const regionBreakdown = Object.entries(
    active.reduce<Record<string, number>>((acc, l) => {
      acc[l.region] = (acc[l.region] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalListings: db.listings.length,
    activeListings: active.length,
    totalUsers: db.users.length + 1240, // seeded users + simulated population
    verifiedShare: Math.round((verified.length / Math.max(1, active.length)) * 100),
    gmv,
    openReports: db.reports.filter((r) => r.status === "open" || r.status === "investigating").length,
    pendingVerifications: db.verificationCases.filter((c) => c.status === "submitted" || c.status === "under-review").length,
    monthlySeries,
    regionBreakdown,
  };
}

export async function getAllUsers(): Promise<User[]> {
  if (LIVE) return many<User>(await http.get("/v1/admin/users")).map(normalizeUser);
  await delay();
  return getDb().users;
}

export async function getModerationListings(): Promise<Listing[]> {
  if (LIVE) return many<Listing>(await http.get("/v1/admin/listings")).map(normalizeListing);
  await delay();
  return getDb()
    .listings.filter((l) => l.status !== "removed" && l.status !== "draft")
    .sort((a, b) => {
      const weight = (s: Listing["status"]) => (s === "flagged" ? 0 : s === "pending-review" ? 1 : 2);
      return weight(a.status) - weight(b.status) || b.createdAt.localeCompare(a.createdAt);
    });
}

export type ModerationAction = "approve" | "flag" | "remove" | "restore";

export async function moderateListing(id: string, action: ModerationAction): Promise<void> {
  if (LIVE) {
    await http.post(`/v1/admin/listings/${id}/moderate`, { action });
    return;
  }
  await delay(400);
  mutateDb((db) => {
    const l = db.listings.find((x) => x.id === id);
    if (!l) return;
    if (action === "approve" || action === "restore") l.status = "active";
    if (action === "flag") l.status = "flagged";
    if (action === "remove") l.status = "removed";
    db.notifications.unshift({
      id: uid("ntf"),
      userId: l.sellerId,
      type: "listing",
      title:
        action === "remove"
          ? "A listing was removed by moderation"
          : action === "flag"
            ? "A listing was flagged for review"
            : "Your listing is live",
      body: l.title,
      href: "/seller/listings",
      read: false,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function toggleUserVerified(id: string): Promise<boolean> {
  if (LIVE) {
    const d = payload<{ verified?: boolean; user?: User }>(await http.patch(`/v1/admin/users/${id}`, { toggleVerified: true }));
    return d.verified ?? d.user?.verified ?? false;
  }
  await delay(250);
  let verified = false;
  mutateDb((db) => {
    const u = db.users.find((x) => x.id === id);
    if (u) {
      u.verified = !u.verified;
      verified = u.verified;
    }
  });
  return verified;
}

export async function getReports(): Promise<AbuseReport[]> {
  if (LIVE) return many<AbuseReport>(await http.get("/v1/admin/reports"));
  await delay();
  return [...getDb().reports].sort((a, b) => {
    const weight = (s: AbuseReport["status"]) => (s === "open" ? 0 : s === "investigating" ? 1 : 2);
    return weight(a.status) - weight(b.status) || b.createdAt.localeCompare(a.createdAt);
  });
}

export async function updateReportStatus(id: string, status: AbuseReport["status"]): Promise<void> {
  if (LIVE) {
    await http.patch(`/v1/admin/reports/${id}`, { status });
    return;
  }
  await delay(300);
  mutateDb((db) => {
    const r = db.reports.find((x) => x.id === id);
    if (r) r.status = status;
  });
}
