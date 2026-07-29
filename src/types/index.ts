/**
 * Domain model for the RealEstate marketplace.
 * These types are shared by the mock service layer (src/lib/api) and the UI —
 * a real backend only needs to honour these shapes.
 */

export type Role = "buyer" | "seller" | "provider" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl: string;
  company?: string;
  region: string;
  bio?: string;
  verified: boolean;
  rating?: number;
  reviewsCount?: number;
  joinedAt: string; // ISO date
}

export interface Session {
  user: User;
  token: string; // fake token, present for API-parity
  createdAt: string;
}

/** Development stage of the land itself. */
export type LandStatus = "developed" | "semi-developed" | "greenfield" | "undeveloped";

export type VerificationStatus = "verified" | "pending" | "unverified";

export type ListingLifecycle =
  | "active"
  | "paused"
  | "draft"
  | "pending-review"
  | "flagged"
  | "removed";

export type SellerType = "agent" | "owner" | "developer";

export interface ListingAttributes {
  dimensions: string;
  lotSize: string;
  elevation: string;
  topography: string;
  titleType: string;
  boundaryStatus: string;
  zoning: string;
  soil: string;
  environmental: string;
  naturalFeatures: string[];
}

export interface ListingDocument {
  id: string;
  name: string;
  type: "indenture" | "site-plan" | "surveyor-report" | "id" | "title-certificate" | "other";
  sizeKb: number;
  uploadedAt: string;
  verified: boolean;
}

export interface Listing {
  id: string;
  title: string;
  type: "land" | "house" | "commercial";
  landStatus: LandStatus;
  /** Price per plot in Ghana Cedis. */
  price: number;
  negotiable: boolean;
  region: string;
  city: string;
  address: string;
  coords: { lat: number; lng: number };
  sizeAcres: number;
  plotsTotal: number;
  plotsAvailable: number;
  images: string[];
  description: string;
  amenities: string[];
  verification: VerificationStatus;
  sellerId: string;
  sellerType: SellerType;
  /** When set, the listing has clickable parcels on the map (see src/data/parcels). */
  estateId?: string;
  views: number;
  saves: number;
  leads: number;
  status: ListingLifecycle;
  attributes: ListingAttributes;
  documents: ListingDocument[];
  salesAgreement: string;
  terms: string;
  createdAt: string;
}

export type PlotStatus = "available" | "reserved" | "sold";

/** GeoJSON feature properties for a single plot polygon. */
export interface ParcelProperties {
  id: string;
  estateId: string;
  plotNumber: string;
  owner: string;
  status: PlotStatus;
  areaSqm: number;
  lengthM: number;
  breadthM: number;
  price: number; // ₵
}

export interface ParcelFeature {
  type: "Feature";
  properties: ParcelProperties;
  geometry: { type: "Polygon"; coordinates: number[][][] };
}

export interface ParcelCollection {
  type: "FeatureCollection";
  features: ParcelFeature[];
}

export interface Estate {
  id: string;
  name: string;
  region: string;
  city: string;
  center: { lat: number; lng: number };
  zoom: number;
  listingId: string;
  description: string;
}

export type VerificationCaseStatus =
  | "submitted"
  | "under-review"
  | "docs-requested"
  | "verified"
  | "rejected";

export interface VerificationTimelineEntry {
  status: VerificationCaseStatus;
  date: string;
  note?: string;
}

export interface VerificationCase {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  status: VerificationCaseStatus;
  documents: ListingDocument[];
  timeline: VerificationTimelineEntry[];
  checks: { label: string; passed: boolean | null }[];
  submittedAt: string;
  adminNote?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: Pick<User, "id" | "name" | "avatarUrl" | "role">[];
  listingId?: string;
  listingTitle?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadBy: Record<string, number>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: string;
}

export type PaymentMethod = "mtn-momo" | "vodafone-cash" | "card";

export type EscrowStepKey = "funds-held" | "documents-transfer" | "title-handover" | "released";

export interface EscrowStep {
  key: EscrowStepKey;
  label: string;
  description: string;
  status: "complete" | "current" | "pending";
  date?: string;
}

export interface PurchasePlot {
  parcelId: string;
  plotNumber: string;
  estateId: string;
  estateName: string;
  areaSqm: number;
  price: number;
}

export type PurchaseStatus = "processing" | "in-escrow" | "completed" | "failed";

export interface Purchase {
  id: string;
  receiptNo: string;
  buyerId: string;
  plots: PurchasePlot[];
  totalAreaSqm: number;
  amount: number;
  fees: number;
  paymentMethod: PaymentMethod;
  status: PurchaseStatus;
  escrow: EscrowStep[];
  monitored: boolean;
  documents: { name: string; type: string }[];
  createdAt: string;
}

export interface Review {
  id: string;
  targetId: string;
  targetType: "agent" | "provider" | "listing";
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  rating: number; // 1–5
  body: string;
  createdAt: string;
}

export type ServiceCategory =
  | "surveyor"
  | "property-manager"
  | "developer"
  | "painter"
  | "electrician"
  | "plumber"
  | "photographer";

export interface ServiceProvider {
  id: string;
  userId?: string;
  name: string;
  category: ServiceCategory;
  services: string[];
  region: string;
  city: string;
  rating: number;
  reviewsCount: number;
  avatarUrl: string;
  verified: boolean;
  description: string;
  startingPrice: number; // ₵
  jobsDone: number;
  yearsActive: number;
}

export type NotificationType =
  | "message"
  | "price-drop"
  | "verification"
  | "escrow"
  | "listing"
  | "system";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface ListingFilters {
  q?: string;
  region?: string;
  landStatus?: LandStatus | "all";
  minPrice?: number;
  maxPrice?: number;
  minAcres?: number;
  maxAcres?: number;
  amenities?: string[];
  verification?: VerificationStatus | "all";
  sellerType?: SellerType | "all";
  sort?: "newest" | "price-asc" | "price-desc" | "size-desc" | "most-viewed";
  page?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: ListingFilters;
  alerts: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  buyerAvatarUrl: string;
  kind: "message" | "call-request" | "offer" | "site-visit";
  note?: string;
  status: "new" | "contacted" | "qualified" | "closed";
  createdAt: string;
}

export interface AbuseReport {
  id: string;
  targetType: "listing" | "user";
  targetId: string;
  targetLabel: string;
  reporterName: string;
  reason: string;
  detail: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/* building materials & tools shop                                     */
/* ------------------------------------------------------------------ */

export type MaterialCategory =
  | "cement"
  | "blocks"
  | "roofing"
  | "steel"
  | "aggregates"
  | "timber"
  | "plumbing"
  | "electrical"
  | "paint"
  | "tools"
  | "doors-windows"
  | "tiles";

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  brand: string;
  /** Price in Ghana Cedis per unit. */
  price: number;
  unit: string; // "bag", "piece", "ton", "12m length", "litre", "sheet", "roll", "box", "trip"
  supplierName: string;
  /** Set when the product was listed by a supplier user (vs the seeded catalog). */
  supplierId?: string;
  region: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  description: string;
  deliveryDays: number;
  popular?: boolean;
}

export interface MaterialInput {
  name: string;
  category: MaterialCategory;
  brand: string;
  price: number;
  unit: string;
  region: string;
  inStock: boolean;
  description: string;
  deliveryDays: number;
}

export interface CartItem {
  materialId: string;
  qty: number;
}

export type MaterialOrderStatus = "processing" | "confirmed" | "dispatched" | "delivered";

export interface MaterialOrderLine {
  materialId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

export interface MaterialOrder {
  id: string;
  orderNo: string;
  buyerId: string;
  lines: MaterialOrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: MaterialOrderStatus;
  deliveryAddress: string;
  region: string;
  createdAt: string;
  eta: string;
}

export interface MaterialFilters {
  q?: string;
  category?: MaterialCategory | "all";
  region?: string;
  sort?: "popular" | "price-asc" | "price-desc" | "rating";
}

/* ------------------------------------------------------------------ */
/* land conflict / overlap checker                                     */
/* ------------------------------------------------------------------ */

export interface ParcelConflict {
  parcelId: string;
  plotNumber: string;
  owner: string;
  estateId: string;
  estateName: string;
  status: PlotStatus;
  /** Area of the overlapping region, m². */
  overlapSqm: number;
  /** Closed ring(s) of the overlapping region, for map rendering. */
  overlapRings: number[][][];
}

export interface ConflictResult {
  searcherRing: number[][];
  searcherSqm: number;
  conflicts: ParcelConflict[];
  totalOverlapSqm: number;
  /** true when the boundary overlaps no registered parcel. */
  clear: boolean;
}
