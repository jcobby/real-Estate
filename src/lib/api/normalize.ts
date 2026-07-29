/**
 * Response normalizers. The live backend returns `null`/missing for fields the
 * UI types treat as always-present (avatars, listing attributes, plot owner,
 * agreement text…). Normalising here — at the seam — means components never
 * crash on a null and never render "null"/broken images.
 */
import type { Listing, ListingAttributes, ParcelCollection, Review, ServiceProvider, User } from "@/types";

export function fallbackAvatar(seed: string): string {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed || "user")}`;
}

export function normalizeAttributes(a?: Partial<ListingAttributes> | null): ListingAttributes {
  return {
    dimensions: a?.dimensions || "—",
    lotSize: a?.lotSize || "—",
    elevation: a?.elevation || "—",
    topography: a?.topography || "—",
    titleType: a?.titleType || "—",
    boundaryStatus: a?.boundaryStatus || "—",
    zoning: a?.zoning || "—",
    soil: a?.soil || "—",
    environmental: a?.environmental || "—",
    naturalFeatures: Array.isArray(a?.naturalFeatures) ? a!.naturalFeatures : [],
  };
}

export function normalizeListing(l: Listing): Listing {
  return {
    ...l,
    address: l.address ?? "",
    description: l.description ?? "",
    images: Array.isArray(l.images) ? l.images : [],
    amenities: Array.isArray(l.amenities) ? l.amenities : [],
    documents: Array.isArray(l.documents) ? l.documents : [],
    salesAgreement: l.salesAgreement ?? "",
    terms: l.terms ?? "",
    attributes: normalizeAttributes(l.attributes),
  };
}

export function normalizeUser(u: Partial<User> & { id: string; name: string; email: string; role: User["role"] }): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    role: u.role,
    avatarUrl: u.avatarUrl || fallbackAvatar(u.id ?? u.email ?? u.name),
    company: u.company ?? undefined,
    region: u.region ?? "",
    bio: u.bio ?? undefined,
    verified: u.verified ?? false,
    rating: u.rating ?? undefined,
    reviewsCount: u.reviewsCount ?? undefined,
    joinedAt: u.joinedAt ?? new Date().toISOString(),
  };
}

export function normalizeProvider(p: ServiceProvider): ServiceProvider {
  return {
    ...p,
    avatarUrl: p.avatarUrl || fallbackAvatar(p.id ?? p.name),
    services: Array.isArray(p.services) ? p.services : [],
    description: p.description ?? "",
  };
}

export function normalizeReview(r: Review): Review {
  return {
    ...r,
    authorAvatarUrl: r.authorAvatarUrl || fallbackAvatar(r.authorId ?? r.authorName),
    authorName: r.authorName || "Someone",
  };
}

export function normalizeParcels(fc: ParcelCollection | null): ParcelCollection | null {
  if (!fc?.features) return fc;
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => ({
      ...f,
      properties: { ...f.properties, owner: f.properties.owner || "Unregistered" },
    })),
  };
}
