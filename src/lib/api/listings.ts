import type { Listing, ListingFilters, Paged } from "@/types";
import { delay, getDb, mutateDb, uid } from "@/lib/mock/db";
import { LIVE, http, many, one, paged } from "./http";
import { normalizeListing } from "./normalize";

const PAGE_SIZE = 12;

export async function getListings(filters: ListingFilters = {}): Promise<Paged<Listing>> {
  if (LIVE) {
    const res = paged<Listing>(
      await http.get("/v1/listings", {
        q: filters.q,
        region: filters.region,
        landStatus: filters.landStatus,
        verification: filters.verification,
        sellerType: filters.sellerType,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minAcres: filters.minAcres,
        maxAcres: filters.maxAcres,
        amenities: filters.amenities,
        sort: filters.sort,
        page: filters.page ?? 1,
        pageSize: PAGE_SIZE,
      }),
    );
    return { ...res, items: res.items.map(normalizeListing) };
  }

  await delay();
  const db = getDb();
  let items = db.listings.filter((l) => l.status === "active");

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q),
    );
  }
  if (filters.region && filters.region !== "all") items = items.filter((l) => l.region === filters.region);
  if (filters.landStatus && filters.landStatus !== "all") items = items.filter((l) => l.landStatus === filters.landStatus);
  if (filters.verification && filters.verification !== "all") items = items.filter((l) => l.verification === filters.verification);
  if (filters.sellerType && filters.sellerType !== "all") items = items.filter((l) => l.sellerType === filters.sellerType);
  if (filters.minPrice != null) items = items.filter((l) => l.price >= filters.minPrice!);
  if (filters.maxPrice != null) items = items.filter((l) => l.price <= filters.maxPrice!);
  if (filters.minAcres != null) items = items.filter((l) => l.sizeAcres >= filters.minAcres!);
  if (filters.maxAcres != null) items = items.filter((l) => l.sizeAcres <= filters.maxAcres!);
  if (filters.amenities?.length) {
    items = items.filter((l) => filters.amenities!.every((a) => l.amenities.includes(a)));
  }

  switch (filters.sort) {
    case "price-asc":
      items = [...items].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      items = [...items].sort((a, b) => b.price - a.price);
      break;
    case "size-desc":
      items = [...items].sort((a, b) => b.sizeAcres - a.sizeAcres);
      break;
    case "most-viewed":
      items = [...items].sort((a, b) => b.views - a.views);
      break;
    case "newest":
    default:
      items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const page = Math.max(1, filters.page ?? 1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}

export async function getListing(id: string): Promise<Listing | null> {
  if (LIVE) {
    const l = one<Listing>(await http.get(`/v1/listings/${id}`), "listing");
    return l ? normalizeListing(l) : null;
  }
  await delay(180);
  return getDb().listings.find((l) => l.id === id) ?? null;
}

export async function recordView(id: string): Promise<void> {
  if (LIVE) {
    await http.post(`/v1/listings/${id}/view`).catch(() => {});
    return;
  }
  mutateDb((db) => {
    const l = db.listings.find((x) => x.id === id);
    if (l) l.views += 1;
  });
}

export async function getFeaturedListings(landStatus?: string): Promise<Listing[]> {
  if (LIVE) return many<Listing>(await http.get("/v1/listings/featured", { landStatus })).map(normalizeListing);
  await delay();
  let items = getDb().listings.filter((l) => l.status === "active");
  if (landStatus && landStatus !== "all") items = items.filter((l) => l.landStatus === landStatus);
  return [...items].sort((a, b) => b.views - a.views).slice(0, 8);
}

export async function getSimilarListings(id: string): Promise<Listing[]> {
  if (LIVE) return many<Listing>(await http.get(`/v1/listings/${id}/similar`)).map(normalizeListing);
  await delay();
  const db = getDb();
  const base = db.listings.find((l) => l.id === id);
  if (!base) return [];
  return db.listings
    .filter((l) => l.id !== id && l.status === "active" && (l.region === base.region || l.landStatus === base.landStatus))
    .sort((a, b) => (a.region === base.region ? -1 : 0) - (b.region === base.region ? -1 : 0))
    .slice(0, 4);
}

export async function getSellerListings(sellerId: string): Promise<Listing[]> {
  if (LIVE) return many<Listing>(await http.get(`/v1/sellers/${sellerId}/listings`)).map(normalizeListing);
  await delay();
  return getDb()
    .listings.filter((l) => l.sellerId === sellerId && l.status !== "removed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type NewListingInput = Omit<
  Listing,
  "id" | "views" | "saves" | "leads" | "createdAt" | "documents" | "salesAgreement" | "terms"
> &
  Partial<Pick<Listing, "documents" | "salesAgreement" | "terms">>;

export async function createListing(input: NewListingInput): Promise<Listing> {
  if (LIVE) return normalizeListing(one<Listing>(await http.post("/v1/listings", input), "listing") as Listing);
  await delay(500);
  const listing: Listing = {
    salesAgreement: "Standard RealEstate sales agreement applies.",
    terms: "Standard RealEstate purchase terms apply.",
    documents: [],
    ...input,
    id: uid("lst"),
    views: 0,
    saves: 0,
    leads: 0,
    createdAt: new Date().toISOString(),
  };
  mutateDb((db) => db.listings.unshift(listing));
  return listing;
}

export async function updateListing(id: string, patch: Partial<Listing>): Promise<Listing | null> {
  if (LIVE) {
    const l = one<Listing>(await http.patch(`/v1/listings/${id}`, patch), "listing");
    return l ? normalizeListing(l) : null;
  }
  await delay(400);
  let updated: Listing | null = null;
  mutateDb((db) => {
    const i = db.listings.findIndex((l) => l.id === id);
    if (i >= 0) {
      db.listings[i] = { ...db.listings[i], ...patch };
      updated = db.listings[i];
    }
  });
  return updated;
}

export async function deleteListing(id: string): Promise<void> {
  if (LIVE) {
    await http.del(`/v1/listings/${id}`);
    return;
  }
  await delay(300);
  mutateDb((db) => {
    const i = db.listings.findIndex((l) => l.id === id);
    if (i >= 0) db.listings[i].status = "removed";
  });
}

export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
  if (LIVE) {
    const results = await Promise.all(ids.map((id) => getListing(id).catch(() => null)));
    return results.filter((l): l is Listing => !!l);
  }
  await delay(200);
  const db = getDb();
  return ids
    .map((id) => db.listings.find((l) => l.id === id))
    .filter((l): l is Listing => !!l && l.status === "active");
}

export async function getAllRegions(): Promise<string[]> {
  if (LIVE) return (one<string[]>(await http.get("/v1/regions"), "regions")) ?? [];
  const regions = new Set(getDb().listings.map((l) => l.region));
  return [...regions].sort();
}
