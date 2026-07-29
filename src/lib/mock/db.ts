import type {
  AbuseReport,
  AppNotification,
  Conversation,
  Estate,
  Lead,
  Listing,
  Material,
  MaterialOrder,
  Message,
  ParcelCollection,
  PlotStatus,
  Purchase,
  Review,
  ServiceProvider,
  User,
  VerificationCase,
} from "@/types";
import { buildSeedDb } from "./seed";

/**
 * The mock "database": seeded in-memory state, persisted to localStorage so
 * refreshes keep everything the reviewer did. Swap the src/lib/api modules for
 * real HTTP calls and this file becomes dead code.
 */
export interface DbShape {
  users: User[];
  listings: Listing[];
  conversations: Conversation[];
  messages: Message[];
  purchases: Purchase[];
  verificationCases: VerificationCase[];
  reviews: Review[];
  providers: ServiceProvider[];
  notifications: AppNotification[];
  leads: Lead[];
  reports: AbuseReport[];
  /** Plot status changes on top of the static GeoJSON (parcelId → status). */
  parcelOverrides: Record<string, PlotStatus>;
  /** Estates created through the listing wizard (seeded ones live in src/data). */
  customEstates: Estate[];
  /** Parcel GeoJSON for wizard-created estates, keyed by estateId. */
  customParcels: Record<string, ParcelCollection>;
  /** Building-material orders placed through the shop. */
  materialOrders: MaterialOrder[];
  /** Materials listed by supplier users (seeded catalog lives in src/data). */
  customMaterials: Material[];
}

// bump the version to force a reseed when the shape or seed content changes
const KEY = "realestate:db:v4";
let cache: DbShape | null = null;

export function getDb(): DbShape {
  // On the server (metadata, prerender) serve a fresh seed — read-only.
  if (typeof window === "undefined") return buildSeedDb();
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DbShape;
      // light migration for stores written before these collections existed
      cache.customEstates ??= [];
      cache.customParcels ??= {};
      cache.materialOrders ??= [];
      cache.customMaterials ??= [];
      return cache;
    }
  } catch {
    // corrupted storage — fall through to reseed
  }
  cache = buildSeedDb();
  persist();
  return cache;
}

function persist() {
  if (typeof window !== "undefined" && cache) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      // storage full/unavailable — mock data will live in memory only
    }
  }
}

/** All writes go through here so persistence stays consistent. */
export function mutateDb(fn: (db: DbShape) => void) {
  const db = getDb();
  fn(db);
  persist();
}

export function resetDb() {
  cache = buildSeedDb();
  persist();
}

/** Simulated network latency for every mock API call. */
export function delay(ms?: number) {
  const wait = ms ?? 200 + Math.random() * 400;
  return new Promise<void>((resolve) => setTimeout(resolve, wait));
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
