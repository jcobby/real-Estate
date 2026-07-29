import type {
  AbuseReport,
  AppNotification,
  Conversation,
  Lead,
  Listing,
  ListingDocument,
  Message,
  Purchase,
  Review,
  ServiceProvider,
  User,
  VerificationCase,
} from "@/types";
import type { DbShape } from "./db";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

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

const avatar = (n: number) => `https://i.pravatar.cc/150?img=${n}`;

/** Curated, self-hosted land photos in public/lands (fields, valleys, aerial, pasture). */
const LAND_PHOTOS = Array.from({ length: 9 }, (_, i) => `/lands/land-${String(i + 1).padStart(2, "0")}.jpg`);

/** Deterministic 4-photo gallery for a listing, spread across the set so each differs. */
function landImages(id: string): string[] {
  const base = [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return [0, 2, 4, 6].map((k) => LAND_PHOTOS[(base + k) % LAND_PHOTOS.length]);
}

/* ------------------------------------------------------------------ */
/* users                                                               */
/* ------------------------------------------------------------------ */

const users: User[] = [
  {
    id: "u-buyer-1",
    name: "Kwame Mensah",
    email: "kwame.mensah@example.com",
    phone: "+233 24 555 0101",
    role: "buyer",
    avatarUrl: avatar(12),
    region: "Greater Accra",
    bio: "Diaspora returnee looking for residential land around Accra and Aburi.",
    verified: true,
    joinedAt: daysAgo(210),
  },
  {
    id: "u-buyer-2",
    name: "Esi Nkrumah",
    email: "esi.nkrumah@example.com",
    phone: "+233 20 555 0102",
    role: "buyer",
    avatarUrl: avatar(47),
    region: "Ashanti",
    verified: false,
    joinedAt: daysAgo(95),
  },
  {
    id: "u-buyer-3",
    name: "Daniel Tetteh",
    email: "daniel.tetteh@example.com",
    phone: "+233 27 555 0103",
    role: "buyer",
    avatarUrl: avatar(53),
    region: "Greater Accra",
    verified: true,
    joinedAt: daysAgo(400),
  },
  {
    id: "u-seller-1",
    name: "Selorm Agbeko",
    email: "selorm@adomlands.com",
    phone: "+233 30 255 0201",
    role: "seller",
    company: "Adom Lands & Estates Ltd",
    avatarUrl: avatar(32),
    region: "Greater Accra",
    bio: "Developer of gated, fully-documented estates on the Accra–Aburi corridor since 2012.",
    verified: true,
    rating: 4.8,
    reviewsCount: 63,
    joinedAt: daysAgo(900),
  },
  {
    id: "u-seller-2",
    name: "Kofi Owusu-Ansah",
    email: "kofi@asantemanrealty.com",
    phone: "+233 32 205 0202",
    role: "seller",
    company: "Asanteman Realty Group",
    avatarUrl: avatar(59),
    region: "Ashanti",
    bio: "Licensed agent covering Kumasi and the wider Ashanti region.",
    verified: true,
    rating: 4.6,
    reviewsCount: 41,
    joinedAt: daysAgo(700),
  },
  {
    id: "u-seller-3",
    name: "Ibrahim Abdulai",
    email: "ibrahim@northernstar.com",
    phone: "+233 37 209 0203",
    role: "seller",
    company: "Northern Star Properties",
    avatarUrl: avatar(68),
    region: "Northern",
    bio: "Making land ownership in Tamale simple, documented and affordable.",
    verified: true,
    rating: 4.7,
    reviewsCount: 28,
    joinedAt: daysAgo(540),
  },
  {
    id: "u-seller-4",
    name: "Efua Baidoo",
    email: "efua.baidoo@example.com",
    phone: "+233 24 555 0204",
    role: "seller",
    avatarUrl: avatar(44),
    region: "Eastern",
    bio: "Family land owner at Aburi selling titled portions directly — no middlemen.",
    verified: false,
    rating: 4.2,
    reviewsCount: 7,
    joinedAt: daysAgo(120),
  },
  {
    id: "u-seller-5",
    name: "Nana Kweku Duncan",
    email: "nana@accraprime.com",
    phone: "+233 30 255 0205",
    role: "seller",
    company: "Accra Prime Agents",
    avatarUrl: avatar(15),
    region: "Greater Accra",
    bio: "Boutique agency for premium residential and commercial land in Accra.",
    verified: true,
    rating: 4.5,
    reviewsCount: 35,
    joinedAt: daysAgo(460),
  },
  {
    id: "u-provider-1",
    name: "Kwesi Botchway",
    email: "kwesi@precisionsurveys.com",
    phone: "+233 24 555 0301",
    role: "provider",
    company: "Precision Geo Surveys",
    avatarUrl: avatar(8),
    region: "Greater Accra",
    verified: true,
    rating: 4.9,
    reviewsCount: 52,
    joinedAt: daysAgo(600),
  },
  {
    id: "u-admin-1",
    name: "Adjoa Mensah",
    email: "adjoa@realestate.app",
    phone: "+233 30 255 0001",
    role: "admin",
    company: "RealEstate Trust & Safety",
    avatarUrl: avatar(24),
    region: "Greater Accra",
    verified: true,
    joinedAt: daysAgo(800),
  },
];

/* ------------------------------------------------------------------ */
/* listings                                                            */
/* ------------------------------------------------------------------ */

const AMENITIES = [
  "Electricity on site",
  "Piped water",
  "Tarred road access",
  "Gated community",
  "Walled & demarcated",
  "Drainage installed",
  "Street lights",
  "24/7 security post",
  "Close to school",
  "Close to market",
];

const DOC_TEMPLATES: Array<[ListingDocument["type"], string]> = [
  ["indenture", "Registered indenture"],
  ["site-plan", "Approved site plan"],
  ["surveyor-report", "Licensed surveyor's report"],
  ["title-certificate", "Land title certificate"],
];

function docsFor(id: string, count: number, verified: boolean, ageDays: number): ListingDocument[] {
  return DOC_TEMPLATES.slice(0, count).map(([type, name], i) => ({
    id: `${id}-doc-${i + 1}`,
    name,
    type,
    sizeKb: 240 + ((i * 173) % 900),
    uploadedAt: daysAgo(ageDays),
    verified,
  }));
}

interface CityInfo {
  city: string;
  region: string;
  lat: number;
  lng: number;
  tier: number; // price multiplier
}

const CITIES: CityInfo[] = [
  { city: "Oyibi", region: "Greater Accra", lat: 5.8265, lng: -0.0866, tier: 1.0 },
  { city: "East Legon Hills", region: "Greater Accra", lat: 5.7174, lng: -0.0963, tier: 2.2 },
  { city: "Tema Community 25", region: "Greater Accra", lat: 5.7161, lng: -0.0432, tier: 1.6 },
  { city: "Amasaman", region: "Greater Accra", lat: 5.7014, lng: -0.2967, tier: 0.9 },
  { city: "Prampram", region: "Greater Accra", lat: 5.7172, lng: 0.1063, tier: 1.1 },
  { city: "Kasoa", region: "Central", lat: 5.5344, lng: -0.4171, tier: 0.8 },
  { city: "Winneba", region: "Central", lat: 5.3511, lng: -0.6252, tier: 0.7 },
  { city: "Ahodwo, Kumasi", region: "Ashanti", lat: 6.6666, lng: -1.6303, tier: 1.4 },
  { city: "Ejisu, Kumasi", region: "Ashanti", lat: 6.7196, lng: -1.4738, tier: 0.75 },
  { city: "Kuntanase", region: "Ashanti", lat: 6.5383, lng: -1.4892, tier: 0.6 },
  { city: "Aburi", region: "Eastern", lat: 5.8481, lng: -0.1744, tier: 1.2 },
  { city: "Koforidua", region: "Eastern", lat: 6.0941, lng: -0.2591, tier: 0.65 },
  { city: "Akosombo", region: "Eastern", lat: 6.2673, lng: 0.0459, tier: 0.7 },
  { city: "Tamale", region: "Northern", lat: 9.4433, lng: -0.8983, tier: 0.4 },
  { city: "Wa", region: "Upper West", lat: 10.0602, lng: -2.5019, tier: 0.3 },
  { city: "Ho", region: "Volta", lat: 6.6113, lng: 0.4724, tier: 0.45 },
  { city: "Takoradi", region: "Western", lat: 4.9016, lng: -1.7831, tier: 0.9 },
  { city: "Ada Foah", region: "Greater Accra", lat: 5.7847, lng: 0.6337, tier: 0.85 },
];

const LAND_STATUSES = ["developed", "semi-developed", "greenfield", "undeveloped"] as const;

const STATUS_BLURB: Record<(typeof LAND_STATUSES)[number], string> = {
  developed:
    "The estate is fully serviced — tarred roads, drainage, water and electricity are already in place, so you can start building the day the papers are signed.",
  "semi-developed":
    "Access roads are graded and utilities have reached the boundary; interior services are being extended block by block.",
  greenfield:
    "A clean, newly-opened parcel with an approved layout — buy in early at the best price and watch the neighbourhood grow around you.",
  undeveloped:
    "Raw land held under a registered title. Perfect for buyers who want acreage at the lowest entry cost and are happy to develop at their own pace.",
};

const TITLE_SHAPES = [
  (c: CityInfo, size: string) => `${size} serviced plot at ${c.city}`,
  (c: CityInfo, size: string) => `Titled ${size} land, ${c.city}`,
  (c: CityInfo, size: string) => `${size} residential plot — ${c.city}`,
  (c: CityInfo, size: string) => `Prime ${size} parcel near ${c.city}`,
  (c: CityInfo, size: string) => `${size} walled land at ${c.city}`,
];

const SELLER_ROTATION = ["u-seller-1", "u-seller-2", "u-seller-3", "u-seller-4", "u-seller-5"];
const SELLER_TYPE: Record<string, Listing["sellerType"]> = {
  "u-seller-1": "developer",
  "u-seller-2": "agent",
  "u-seller-3": "developer",
  "u-seller-4": "owner",
  "u-seller-5": "agent",
};

function baseAttributes(land: Listing["landStatus"], plots: number): Listing["attributes"] {
  return {
    dimensions: "100 ft × 70 ft per plot",
    lotSize: `${plots} plot${plots > 1 ? "s" : ""} (≈ ${(plots * 0.16).toFixed(2)} acres)`,
    elevation: "65–90 m above sea level",
    topography:
      land === "undeveloped" ? "Gently undulating with light shrub cover" : "Level, graded terrain",
    titleType: "Registered leasehold (99 years)",
    boundaryStatus: "Pillared by a licensed surveyor",
    zoning: "Residential",
    soil: "Sandy loam — good bearing capacity for standard foundations",
    environmental: "Outside flood-prone zones per Hydrological Authority maps",
    naturalFeatures: land === "greenfield" ? ["Mature shade trees", "Seasonal stream at boundary"] : ["Open savannah grassland"],
  };
}

const SALES_AGREEMENT = `This Sales & Purchase Agreement ("Agreement") is entered into between the Vendor and the Purchaser upon acceptance of an offer on the RealEstate platform.

1. The Vendor warrants that they hold a valid, registered interest in the land described in the schedule and that it is free from encumbrances, adverse claims and pending litigation.
2. The purchase price shall be paid into the RealEstate escrow account. Funds are released to the Vendor only after (a) execution of the indenture, (b) delivery of the approved site plan, and (c) confirmation of title transfer at the Lands Commission.
3. The Vendor shall deliver vacant possession within 14 days of completion.
4. Ground rent and statutory charges accrued prior to completion remain the Vendor's responsibility.
5. This Agreement is governed by the laws of the Republic of Ghana.`;

const TERMS = `• A 10% commitment fee reserves the plot for 30 days; the balance is due within that window.
• All payments must pass through the RealEstate escrow service — never pay a seller directly.
• Site visits are free and can be booked through the platform.
• Documentation (indenture, site plan, title transfer) is processed within 4–6 weeks of full payment.
• Refunds: commitment fees are fully refundable within 14 days if verification uncovers any defect in title.`;

function makeListing(partial: Partial<Listing> & Pick<Listing, "id" | "title" | "price" | "region" | "city" | "sellerId">): Listing {
  const plots = partial.plotsTotal ?? 1;
  return {
    type: "land",
    landStatus: "semi-developed",
    negotiable: true,
    address: `${partial.city}, ${partial.region}`,
    coords: { lat: 5.6, lng: -0.2 },
    sizeAcres: +(plots * 0.16).toFixed(2),
    plotsTotal: plots,
    plotsAvailable: plots,
    images: landImages(partial.id),
    description: "",
    amenities: AMENITIES.slice(0, 5),
    verification: "verified",
    sellerType: SELLER_TYPE[partial.sellerId] ?? "owner",
    views: 100,
    saves: 10,
    leads: 3,
    status: "active",
    attributes: baseAttributes(partial.landStatus ?? "semi-developed", plots),
    documents: [],
    salesAgreement: SALES_AGREEMENT,
    terms: TERMS,
    createdAt: daysAgo(30),
    ...partial,
  };
}

/** Hand-crafted flagship listings (the three map estates + notable singles). */
const heroListings: Listing[] = [
  makeListing({
    id: "lst-001",
    title: "Oyibi Hillcrest Gardens — gated estate plots",
    price: 85000,
    region: "Greater Accra",
    city: "Oyibi",
    address: "Adenta–Dodowa Rd, Oyibi",
    coords: { lat: 5.8265, lng: -0.0866 },
    sellerId: "u-seller-1",
    estateId: "oyibi-hillcrest",
    landStatus: "developed",
    plotsTotal: 72,
    plotsAvailable: 39,
    sizeAcres: 11.5,
    description:
      "Oyibi Hillcrest Gardens is a fully-surveyed, gated estate on the fast-growing Adenta–Dodowa corridor, 35 minutes from Accra CBD. Every plot is pillared, the layout is approved by the Lands Commission, and roads, drainage, water and electricity are already in. Pick your exact plot on the satellite map and buy with escrow protection." ,
    amenities: AMENITIES.slice(0, 8),
    verification: "verified",
    views: 4820,
    saves: 342,
    leads: 57,
    documents: docsFor("lst-001", 4, true, 60),
    createdAt: daysAgo(88),
  }),
  makeListing({
    id: "lst-002",
    title: "Ejisu Royal Meadows — serviced plots near Kumasi",
    price: 48000,
    region: "Ashanti",
    city: "Ejisu, Kumasi",
    address: "Ejisu, off the Accra–Kumasi highway",
    coords: { lat: 6.7196, lng: -1.4738 },
    sellerId: "u-seller-2",
    estateId: "ejisu-royal",
    landStatus: "semi-developed",
    plotsTotal: 64,
    plotsAvailable: 38,
    sizeAcres: 10.1,
    description:
      "Fifteen minutes from Kumasi city centre, Ejisu Royal Meadows offers registered, pillared plots with graded access roads and utilities at the boundary. The layout plan is approved and every sale closes through escrow with full documentation.",
    amenities: [AMENITIES[0], AMENITIES[2], AMENITIES[4], AMENITIES[8], AMENITIES[9]],
    verification: "verified",
    views: 3105,
    saves: 221,
    leads: 43,
    documents: docsFor("lst-002", 4, true, 95),
    createdAt: daysAgo(120),
  }),
  makeListing({
    id: "lst-003",
    title: "Sagnarigu Greenfields — affordable Tamale plots",
    price: 26000,
    region: "Northern",
    city: "Tamale",
    address: "Sagnarigu, Tamale",
    coords: { lat: 9.4433, lng: -0.8983 },
    sellerId: "u-seller-3",
    estateId: "sagnarigu-green",
    landStatus: "greenfield",
    plotsTotal: 48,
    plotsAvailable: 30,
    sizeAcres: 7.6,
    description:
      "Sagnarigu Greenfields opens up Tamale's fastest-growing suburb with clean, affordable plots on a freshly approved layout. Ideal for first-time buyers — flexible payment plans and full escrow protection on every plot.",
    amenities: [AMENITIES[0], AMENITIES[2], AMENITIES[8]],
    verification: "verified",
    views: 1980,
    saves: 143,
    leads: 25,
    documents: docsFor("lst-003", 3, true, 45),
    createdAt: daysAgo(52),
  }),
  makeListing({
    id: "lst-004",
    title: "2-acre titled family land, Aburi ridge",
    price: 320000,
    region: "Eastern",
    city: "Aburi",
    address: "Aburi ridge, near the botanical gardens",
    coords: { lat: 5.8481, lng: -0.1744 },
    sellerId: "u-seller-4",
    landStatus: "undeveloped",
    plotsTotal: 12,
    plotsAvailable: 12,
    sizeAcres: 2.0,
    description:
      "A rare 2-acre parcel on the cool Aburi ridge with sweeping views toward Accra. Held under a registered family title with a recent surveyor's report; sold as a single block or in halves. Verification is in progress with our documents team.",
    amenities: [AMENITIES[2], AMENITIES[8]],
    verification: "pending",
    views: 1544,
    saves: 190,
    leads: 22,
    documents: docsFor("lst-004", 2, false, 6),
    createdAt: daysAgo(9),
    attributes: {
      ...baseAttributes("undeveloped", 12),
      elevation: "370–410 m above sea level",
      topography: "Ridge-top with a gentle southern slope and morning mist",
      naturalFeatures: ["Panoramic valley views", "Mature mango and avocado trees"],
    },
  }),
  makeListing({
    id: "lst-005",
    title: "East Legon Hills premium corner plot",
    price: 450000,
    region: "Greater Accra",
    city: "East Legon Hills",
    address: "Phase 2, East Legon Hills",
    coords: { lat: 5.7174, lng: -0.0963 },
    sellerId: "u-seller-5",
    landStatus: "developed",
    plotsTotal: 1,
    plotsAvailable: 1,
    sizeAcres: 0.17,
    description:
      "A premium corner plot in the heart of East Legon Hills Phase 2 — walled, gated neighbourhood with tarred roads, street lights and 24/7 security. Title certificate in hand; transfer completes in under 6 weeks through escrow.",
    amenities: AMENITIES,
    verification: "verified",
    views: 6230,
    saves: 512,
    leads: 74,
    documents: docsFor("lst-005", 4, true, 30),
    createdAt: daysAgo(34),
  }),
  makeListing({
    id: "lst-006",
    title: "Commercial frontage plot, Tema Community 25",
    price: 610000,
    region: "Greater Accra",
    city: "Tema Community 25",
    address: "Main boulevard, Community 25, Tema",
    coords: { lat: 5.7161, lng: -0.0432 },
    sellerId: "u-seller-5",
    type: "commercial",
    landStatus: "developed",
    plotsTotal: 2,
    plotsAvailable: 2,
    sizeAcres: 0.34,
    description:
      "High-visibility commercial frontage on the main Community 25 boulevard — ideal for retail, banking or a fuel-station franchise. Zoned commercial with utilities on site and title certificate available for inspection.",
    amenities: [AMENITIES[0], AMENITIES[1], AMENITIES[2], AMENITIES[6]],
    verification: "verified",
    views: 2870,
    saves: 164,
    leads: 31,
    documents: docsFor("lst-006", 4, true, 21),
    createdAt: daysAgo(41),
    attributes: { ...baseAttributes("developed", 2), zoning: "Commercial (C2)" },
  }),
];

/** Factory-generated breadth across all regions. */
function generatedListings(): Listing[] {
  const rand = mulberry32(2026);
  const out: Listing[] = [];
  for (let i = 0; i < 38; i++) {
    const n = i + 7; // lst-007 …
    const id = `lst-${String(n).padStart(3, "0")}`;
    const c = CITIES[Math.floor(rand() * CITIES.length)];
    const land = LAND_STATUSES[Math.floor(rand() * LAND_STATUSES.length)];
    const plots = [1, 1, 2, 2, 3, 4, 6][Math.floor(rand() * 7)];
    const sellerId = SELLER_ROTATION[Math.floor(rand() * SELLER_ROTATION.length)];
    const seller = users.find((u) => u.id === sellerId)!;
    const price = Math.round((38000 * c.tier * (0.85 + rand() * 0.5)) / 500) * 500;
    const sizeLabel = plots === 1 ? "1-plot" : `${plots}-plot`;
    const title = TITLE_SHAPES[Math.floor(rand() * TITLE_SHAPES.length)](c, sizeLabel);
    const verified = seller.verified ? rand() < 0.75 : rand() < 0.2;
    const verification = verified ? "verified" : rand() < 0.5 ? "pending" : "unverified";
    const ageDays = Math.floor(rand() * 140) + 1;
    const amenities = AMENITIES.filter(() => rand() < 0.45);
    const views = Math.floor(rand() * 3200) + 60;

    out.push(
      makeListing({
        id,
        title,
        price,
        region: c.region,
        city: c.city,
        address: `${c.city}, ${c.region}`,
        coords: {
          lat: +(c.lat + (rand() - 0.5) * 0.02).toFixed(5),
          lng: +(c.lng + (rand() - 0.5) * 0.02).toFixed(5),
        },
        sellerId,
        landStatus: land,
        plotsTotal: plots,
        plotsAvailable: Math.max(1, plots - Math.floor(rand() * plots * 0.5)),
        description: `${STATUS_BLURB[land]} Located at ${c.city} in the ${c.region} Region, this parcel is sold with a registered indenture and a licensed surveyor's site plan, and every payment is protected by RealEstate escrow. ${
          amenities.length > 2 ? `The neighbourhood already enjoys ${amenities.slice(0, 3).join(", ").toLowerCase()}.` : ""
        }`,
        amenities: amenities.length ? amenities : AMENITIES.slice(0, 3),
        verification,
        views,
        saves: Math.floor(views * (0.04 + rand() * 0.06)),
        leads: Math.floor(views * 0.012),
        documents: docsFor(id, verification === "verified" ? 4 : 2, verification === "verified", ageDays),
        createdAt: daysAgo(ageDays),
        negotiable: rand() < 0.6,
      }),
    );
  }

  // a couple of moderation-relevant lifecycles for the admin screens
  out[5] = { ...out[5], status: "pending-review", verification: "pending" };
  out[11] = { ...out[11], status: "flagged" };
  out[17] = { ...out[17], status: "paused" };
  return out;
}

/* ------------------------------------------------------------------ */
/* conversations & messages                                            */
/* ------------------------------------------------------------------ */

function conv(
  id: string,
  a: string,
  b: string,
  listingId: string | undefined,
  listingTitle: string | undefined,
  msgs: Array<[string, string, number]>, // senderId, body, minutesAgo
  unreadFor?: string,
): { conversation: Conversation; messages: Message[] } {
  const messages: Message[] = msgs.map(([senderId, body, mins], i) => ({
    id: `${id}-m${i + 1}`,
    conversationId: id,
    senderId,
    body,
    sentAt: minutesAgo(mins),
  }));
  const last = messages[messages.length - 1];
  const pa = users.find((u) => u.id === a)!;
  const pb = users.find((u) => u.id === b)!;
  return {
    conversation: {
      id,
      participantIds: [a, b],
      participants: [pa, pb].map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl, role: p.role })),
      listingId,
      listingTitle,
      lastMessage: last.body,
      lastMessageAt: last.sentAt,
      unreadBy: unreadFor ? { [unreadFor]: 2 } : {},
    },
    messages,
  };
}

function buildConversations() {
  const parts = [
    conv(
      "conv-1",
      "u-buyer-1",
      "u-seller-1",
      "lst-001",
      "Oyibi Hillcrest Gardens — gated estate plots",
      [
        ["u-buyer-1", "Hi Selorm, are plots OY-041 and OY-042 still available? I'm looking at the map now.", 2880],
        ["u-seller-1", "Good afternoon Kwame! Yes, both are available — corner pair near the estate entrance.", 2860],
        ["u-buyer-1", "Great. Is the ₵85,000 per plot negotiable if I take both?", 2845],
        ["u-seller-1", "For a pair we can do ₵82,500 each. Documentation and escrow fees are already included.", 2790],
        ["u-buyer-1", "That works. What documents do I get at handover?", 1500],
        ["u-seller-1", "Registered indenture, approved site plan and the title transfer — all tracked in your escrow timeline.", 1460],
        ["u-seller-1", "You can also book a free site visit this weekend if you'd like to walk the land first.", 1455],
      ],
      "u-buyer-1",
    ),
    conv(
      "conv-2",
      "u-buyer-1",
      "u-seller-2",
      "lst-002",
      "Ejisu Royal Meadows — serviced plots near Kumasi",
      [
        ["u-buyer-1", "Hello, does Ejisu Royal Meadows have any plots backing the green belt?", 8700],
        ["u-seller-2", "Yes — the EJ-050 block faces the reserved green strip. Very popular with families.", 8640],
        ["u-buyer-1", "Perfect, I'll shortlist two and come back to you.", 8620],
      ],
    ),
    conv(
      "conv-3",
      "u-buyer-1",
      "u-seller-5",
      "lst-005",
      "East Legon Hills premium corner plot",
      [
        ["u-seller-5", "Hi Kwame — following up on the East Legon Hills corner plot you saved. Happy to arrange a viewing.", 4300],
        ["u-buyer-1", "Thanks Nana. Is the title certificate available for my lawyer to inspect?", 4260],
        ["u-seller-5", "Absolutely, it's uploaded under the listing's documents tab and verified by the platform.", 4210],
      ],
    ),
    conv(
      "conv-4",
      "u-buyer-2",
      "u-seller-1",
      "lst-001",
      "Oyibi Hillcrest Gardens — gated estate plots",
      [
        ["u-buyer-2", "Good morning. Do you offer payment plans on Hillcrest Gardens?", 300],
        ["u-seller-1", "Good morning Esi — yes, 30% down and the balance over 6 months. Escrow still applies.", 260],
        ["u-buyer-2", "That's helpful. Which plots qualify?", 45],
      ],
      "u-seller-1",
    ),
    conv(
      "conv-5",
      "u-buyer-3",
      "u-seller-1",
      "lst-001",
      "Oyibi Hillcrest Gardens — gated estate plots",
      [
        ["u-buyer-3", "Is the estate walled all round? And how far is the nearest school?", 5100],
        ["u-seller-1", "Fully walled with one gated entrance. The international school at Oyibi is 5 minutes away.", 5060],
      ],
    ),
  ];
  return {
    conversations: parts.map((p) => p.conversation),
    messages: parts.flatMap((p) => p.messages),
  };
}

/* ------------------------------------------------------------------ */
/* purchases                                                           */
/* ------------------------------------------------------------------ */

const purchases: Purchase[] = [
  {
    id: "pur-001",
    receiptNo: "RE-2025-04412",
    buyerId: "u-buyer-1",
    plots: [
      {
        parcelId: "ejisu-royal-021",
        plotNumber: "EJ-021",
        estateId: "ejisu-royal",
        estateName: "Ejisu Royal Meadows",
        areaSqm: 655.4,
        price: 47500,
      },
    ],
    totalAreaSqm: 655.4,
    amount: 47500,
    fees: 950,
    paymentMethod: "mtn-momo",
    status: "completed",
    escrow: [
      { key: "funds-held", label: "Funds held in escrow", description: "Payment received and locked", status: "complete", date: daysAgo(64) },
      { key: "documents-transfer", label: "Documents transfer", description: "Indenture & site plan executed", status: "complete", date: daysAgo(48) },
      { key: "title-handover", label: "Title handover", description: "Transfer registered at Lands Commission", status: "complete", date: daysAgo(21) },
      { key: "released", label: "Funds released", description: "Seller paid out — plot is yours", status: "complete", date: daysAgo(20) },
    ],
    monitored: true,
    documents: [
      { name: "Receipt RE-2025-04412.pdf", type: "receipt" },
      { name: "Registered indenture — EJ-021.pdf", type: "indenture" },
      { name: "Site plan — EJ-021.pdf", type: "site-plan" },
      { name: "Title certificate — EJ-021.pdf", type: "title-certificate" },
    ],
    createdAt: daysAgo(64),
  },
];

/* ------------------------------------------------------------------ */
/* verification cases                                                  */
/* ------------------------------------------------------------------ */

const verificationCases: VerificationCase[] = [
  {
    id: "vc-001",
    listingId: "lst-004",
    listingTitle: "2-acre titled family land, Aburi ridge",
    sellerId: "u-seller-4",
    sellerName: "Efua Baidoo",
    status: "under-review",
    documents: docsFor("vc-001", 3, false, 6),
    timeline: [
      { status: "submitted", date: daysAgo(6), note: "Indenture, site plan and ID submitted" },
      { status: "under-review", date: daysAgo(4), note: "Assigned to documents team" },
    ],
    checks: [
      { label: "Indenture matches Lands Commission records", passed: true },
      { label: "Site plan signed by a licensed surveyor", passed: true },
      { label: "No pending litigation on the parcel", passed: null },
      { label: "Seller identity verified", passed: null },
    ],
    submittedAt: daysAgo(6),
  },
  {
    id: "vc-002",
    listingId: "lst-012",
    listingTitle: "Factory listing — awaiting first review",
    sellerId: "u-seller-5",
    sellerName: "Nana Kweku Duncan",
    status: "submitted",
    documents: docsFor("vc-002", 2, false, 1),
    timeline: [{ status: "submitted", date: daysAgo(1), note: "Documents uploaded by seller" }],
    checks: [
      { label: "Indenture matches Lands Commission records", passed: null },
      { label: "Site plan signed by a licensed surveyor", passed: null },
      { label: "No pending litigation on the parcel", passed: null },
      { label: "Seller identity verified", passed: null },
    ],
    submittedAt: daysAgo(1),
  },
  {
    id: "vc-003",
    listingId: "lst-002",
    listingTitle: "Ejisu Royal Meadows — serviced plots near Kumasi",
    sellerId: "u-seller-2",
    sellerName: "Kofi Owusu-Ansah",
    status: "verified",
    documents: docsFor("vc-003", 4, true, 95),
    timeline: [
      { status: "submitted", date: daysAgo(100) },
      { status: "under-review", date: daysAgo(98) },
      { status: "verified", date: daysAgo(95), note: "All checks passed — badge issued" },
    ],
    checks: [
      { label: "Indenture matches Lands Commission records", passed: true },
      { label: "Site plan signed by a licensed surveyor", passed: true },
      { label: "No pending litigation on the parcel", passed: true },
      { label: "Seller identity verified", passed: true },
    ],
    submittedAt: daysAgo(100),
  },
  {
    id: "vc-004",
    listingId: "lst-020",
    listingTitle: "Factory listing — docs requested",
    sellerId: "u-seller-4",
    sellerName: "Efua Baidoo",
    status: "docs-requested",
    documents: docsFor("vc-004", 1, false, 12),
    timeline: [
      { status: "submitted", date: daysAgo(14) },
      { status: "under-review", date: daysAgo(13) },
      { status: "docs-requested", date: daysAgo(12), note: "Surveyor's report missing — please upload" },
    ],
    checks: [
      { label: "Indenture matches Lands Commission records", passed: true },
      { label: "Site plan signed by a licensed surveyor", passed: false },
      { label: "No pending litigation on the parcel", passed: null },
      { label: "Seller identity verified", passed: true },
    ],
    submittedAt: daysAgo(14),
  },
  {
    id: "vc-005",
    listingId: "lst-018",
    listingTitle: "Factory listing — rejected",
    sellerId: "u-seller-4",
    sellerName: "Efua Baidoo",
    status: "rejected",
    documents: docsFor("vc-005", 2, false, 30),
    timeline: [
      { status: "submitted", date: daysAgo(34) },
      { status: "under-review", date: daysAgo(32) },
      { status: "rejected", date: daysAgo(30), note: "Indenture conflicts with an existing registration on the same parcel" },
    ],
    checks: [
      { label: "Indenture matches Lands Commission records", passed: false },
      { label: "Site plan signed by a licensed surveyor", passed: true },
      { label: "No pending litigation on the parcel", passed: false },
      { label: "Seller identity verified", passed: true },
    ],
    submittedAt: daysAgo(34),
    adminNote: "Duplicate registration found. Seller advised to resolve at the Lands Commission before relisting.",
  },
];

/* ------------------------------------------------------------------ */
/* service providers                                                   */
/* ------------------------------------------------------------------ */

const providers: ServiceProvider[] = [
  { id: "sp-01", userId: "u-provider-1", name: "Precision Geo Surveys", category: "surveyor", services: ["Boundary surveys", "Site plans", "Pillaring", "Topographic maps"], region: "Greater Accra", city: "Accra", rating: 4.9, reviewsCount: 52, avatarUrl: avatar(8), verified: true, description: "Licensed surveyors producing Lands-Commission-ready site plans in 5 working days.", startingPrice: 1800, jobsDone: 210, yearsActive: 9 },
  { id: "sp-02", name: "Golden Gate Property Managers", category: "property-manager", services: ["Land caretaking", "Encroachment monitoring", "Tenant management"], region: "Greater Accra", city: "Tema", rating: 4.7, reviewsCount: 38, avatarUrl: avatar(33), verified: true, description: "We watch your land while you're away — monthly photo reports and instant encroachment alerts.", startingPrice: 350, jobsDone: 145, yearsActive: 6 },
  { id: "sp-03", name: "Ashanti BuildRight Developers", category: "developer", services: ["Turnkey builds", "Foundations", "Estate development"], region: "Ashanti", city: "Kumasi", rating: 4.6, reviewsCount: 44, avatarUrl: avatar(51), verified: true, description: "Design-and-build contractors delivering 2–4 bedroom homes from foundation to keys.", startingPrice: 95000, jobsDone: 78, yearsActive: 11 },
  { id: "sp-04", name: "ColourCraft Painting Co.", category: "painter", services: ["Interior painting", "Exterior painting", "Decorative finishes"], region: "Greater Accra", city: "Accra", rating: 4.5, reviewsCount: 29, avatarUrl: avatar(17), verified: false, description: "Premium finishes with dust-free spraying and a 2-year warranty on exterior work.", startingPrice: 2500, jobsDone: 96, yearsActive: 5 },
  { id: "sp-05", name: "Volta Spark Electricals", category: "electrician", services: ["New wiring", "ECG meter processing", "Solar installation"], region: "Volta", city: "Ho", rating: 4.8, reviewsCount: 21, avatarUrl: avatar(61), verified: true, description: "Certified electricians for complete wiring, meters and backup solar systems.", startingPrice: 1200, jobsDone: 130, yearsActive: 8 },
  { id: "sp-06", name: "AquaFlow Plumbing Works", category: "plumber", services: ["Borehole connection", "Full plumbing", "Poly tank installation"], region: "Ashanti", city: "Kumasi", rating: 4.4, reviewsCount: 18, avatarUrl: avatar(3), verified: false, description: "From boreholes to bathrooms — clean installations with genuine fittings.", startingPrice: 900, jobsDone: 88, yearsActive: 7 },
  { id: "sp-07", name: "SkyLens Property Media", category: "photographer", services: ["Drone aerial shoots", "Listing photography", "Video tours"], region: "Greater Accra", city: "Accra", rating: 4.9, reviewsCount: 34, avatarUrl: avatar(28), verified: true, description: "4K drone footage and photography that makes listings sell twice as fast.", startingPrice: 800, jobsDone: 240, yearsActive: 4 },
  { id: "sp-08", name: "Northern Compass Surveys", category: "surveyor", services: ["Boundary surveys", "Site plans", "Litigation surveys"], region: "Northern", city: "Tamale", rating: 4.6, reviewsCount: 15, avatarUrl: avatar(56), verified: true, description: "Tamale's trusted survey team for documentation and dispute resolution.", startingPrice: 1400, jobsDone: 95, yearsActive: 6 },
  { id: "sp-09", name: "HomeShield Property Care", category: "property-manager", services: ["Caretaking", "Short-let management", "Renovation supervision"], region: "Eastern", city: "Koforidua", rating: 4.3, reviewsCount: 12, avatarUrl: avatar(40), verified: false, description: "Property caretaking across the Eastern Region with monthly written reports.", startingPrice: 300, jobsDone: 54, yearsActive: 3 },
  { id: "sp-10", name: "Coastline Builders & Co.", category: "developer", services: ["Beach homes", "Commercial builds", "Renovations"], region: "Western", city: "Takoradi", rating: 4.5, reviewsCount: 26, avatarUrl: avatar(65), verified: true, description: "Coastal construction specialists — salt-resistant materials, on-time delivery.", startingPrice: 120000, jobsDone: 41, yearsActive: 10 },
  { id: "sp-11", name: "BrightVolt Systems", category: "electrician", services: ["Wiring", "CCTV & smart security", "Generator changeovers"], region: "Greater Accra", city: "Kasoa", rating: 4.7, reviewsCount: 23, avatarUrl: avatar(9), verified: true, description: "Smart-home ready electrical work with certified load balancing.", startingPrice: 1500, jobsDone: 112, yearsActive: 6 },
  { id: "sp-12", name: "PurePipe Plumbing", category: "plumber", services: ["Water heaters", "Drainage", "Bathroom fit-outs"], region: "Greater Accra", city: "Accra", rating: 4.6, reviewsCount: 31, avatarUrl: avatar(70), verified: true, description: "Fast, tidy plumbing crews for new builds and emergency repairs.", startingPrice: 750, jobsDone: 176, yearsActive: 9 },
];

/* ------------------------------------------------------------------ */
/* reviews                                                             */
/* ------------------------------------------------------------------ */

const REVIEW_TEXTS = [
  "Professional from start to finish — documents were exactly as promised.",
  "Responsive and honest. Walked the land with us and answered every question.",
  "The escrow process made me feel safe as a first-time buyer. Highly recommend.",
  "Great communication, though scheduling the site visit took two attempts.",
  "Delivered ahead of schedule and the workmanship is excellent.",
  "Fair pricing and no hidden charges. Will definitely use again.",
  "Knows the area inside out and negotiated a better price for us.",
  "Paperwork was flawless — our lawyer was impressed.",
];

function buildReviews(): Review[] {
  const rand = mulberry32(777);
  const targets: Array<[string, Review["targetType"]]> = [
    ["u-seller-1", "agent"], ["u-seller-1", "agent"], ["u-seller-1", "agent"],
    ["u-seller-2", "agent"], ["u-seller-2", "agent"],
    ["u-seller-3", "agent"], ["u-seller-5", "agent"], ["u-seller-5", "agent"],
    ...providers.map((p) => [p.id, "provider"] as [string, Review["targetType"]]),
    ...providers.slice(0, 6).map((p) => [p.id, "provider"] as [string, Review["targetType"]]),
  ];
  const authors = [
    ["u-buyer-1", "Kwame Mensah", avatar(12)],
    ["u-buyer-2", "Esi Nkrumah", avatar(47)],
    ["u-buyer-3", "Daniel Tetteh", avatar(53)],
  ] as const;
  return targets.map(([targetId, targetType], i) => {
    const a = authors[Math.floor(rand() * authors.length)];
    return {
      id: `rev-${String(i + 1).padStart(3, "0")}`,
      targetId,
      targetType,
      authorId: a[0],
      authorName: a[1],
      authorAvatarUrl: a[2],
      rating: rand() < 0.65 ? 5 : rand() < 0.7 ? 4 : 3,
      body: REVIEW_TEXTS[Math.floor(rand() * REVIEW_TEXTS.length)],
      createdAt: daysAgo(Math.floor(rand() * 180) + 2),
    };
  });
}

/* ------------------------------------------------------------------ */
/* notifications, leads, reports                                       */
/* ------------------------------------------------------------------ */

const notifications: AppNotification[] = [
  { id: "ntf-001", userId: "u-buyer-1", type: "message", title: "New message from Selorm Agbeko", body: "You can also book a free site visit this weekend…", href: "/dashboard/messages", read: false, createdAt: minutesAgo(1455) },
  { id: "ntf-002", userId: "u-buyer-1", type: "price-drop", title: "Price drop on a saved listing", body: "Titled 2-plot land, Kasoa is now ₵61,500 (was ₵68,000).", href: "/listings", read: false, createdAt: minutesAgo(2100) },
  { id: "ntf-003", userId: "u-buyer-1", type: "escrow", title: "Escrow update — EJ-021", body: "Title handover confirmed. Funds released to seller.", href: "/dashboard/purchases", read: true, createdAt: daysAgo(20) },
  { id: "ntf-004", userId: "u-buyer-1", type: "verification", title: "A listing you saved is now Verified", body: "Sagnarigu Greenfields passed all document checks.", href: "/property/lst-003", read: true, createdAt: daysAgo(45) },
  { id: "ntf-005", userId: "u-seller-1", type: "listing", title: "New lead on Oyibi Hillcrest Gardens", body: "Esi Nkrumah asked about payment plans.", href: "/seller/leads", read: false, createdAt: minutesAgo(45) },
  { id: "ntf-006", userId: "u-seller-1", type: "verification", title: "Verification reminder", body: "2 of your listings still need documents to earn the Verified badge.", href: "/seller/verification", read: false, createdAt: daysAgo(2) },
  { id: "ntf-007", userId: "u-admin-1", type: "system", title: "New abuse report", body: "A listing was flagged as a possible duplicate sale.", href: "/admin/reports", read: false, createdAt: minutesAgo(160) },
];

const leads: Lead[] = [
  { id: "lead-01", listingId: "lst-001", listingTitle: "Oyibi Hillcrest Gardens", buyerId: "u-buyer-2", buyerName: "Esi Nkrumah", buyerAvatarUrl: avatar(47), kind: "message", note: "Asked about payment plans", status: "new", createdAt: minutesAgo(45) },
  { id: "lead-02", listingId: "lst-001", listingTitle: "Oyibi Hillcrest Gardens", buyerId: "u-buyer-1", buyerName: "Kwame Mensah", buyerAvatarUrl: avatar(12), kind: "offer", note: "Offered ₵82,500/plot for OY-041 + OY-042", status: "qualified", createdAt: minutesAgo(2790) },
  { id: "lead-03", listingId: "lst-001", listingTitle: "Oyibi Hillcrest Gardens", buyerId: "u-buyer-3", buyerName: "Daniel Tetteh", buyerAvatarUrl: avatar(53), kind: "site-visit", note: "Requested Saturday site visit", status: "contacted", createdAt: daysAgo(3) },
  { id: "lead-04", listingId: "lst-006", listingTitle: "Commercial frontage plot, Tema", buyerId: "u-buyer-3", buyerName: "Daniel Tetteh", buyerAvatarUrl: avatar(53), kind: "call-request", status: "new", createdAt: daysAgo(1) },
  { id: "lead-05", listingId: "lst-005", listingTitle: "East Legon Hills premium corner plot", buyerId: "u-buyer-1", buyerName: "Kwame Mensah", buyerAvatarUrl: avatar(12), kind: "message", note: "Asked for title certificate", status: "contacted", createdAt: daysAgo(3) },
  { id: "lead-06", listingId: "lst-001", listingTitle: "Oyibi Hillcrest Gardens", buyerId: "u-buyer-2", buyerName: "Esi Nkrumah", buyerAvatarUrl: avatar(47), kind: "site-visit", note: "Family viewing for 4 people", status: "closed", createdAt: daysAgo(12) },
];

const reports: AbuseReport[] = [
  { id: "rep-01", targetType: "listing", targetId: "lst-018", targetLabel: "Titled land near Kasoa (factory listing)", reporterName: "Anonymous buyer", reason: "Possible double sale", detail: "The same parcel appears on another platform under a different seller's name.", status: "open", createdAt: minutesAgo(160) },
  { id: "rep-02", targetType: "listing", targetId: "lst-014", targetLabel: "Residential plot listing", reporterName: "Daniel Tetteh", reason: "Misleading photos", detail: "Photos show a tarred road but the site visit revealed no road access.", status: "investigating", createdAt: daysAgo(2) },
  { id: "rep-03", targetType: "user", targetId: "u-seller-4", targetLabel: "Efua Baidoo", reporterName: "Esi Nkrumah", reason: "Unresponsive after deposit request", detail: "Seller asked for a direct deposit outside escrow, then stopped replying.", status: "resolved", createdAt: daysAgo(20) },
  { id: "rep-04", targetType: "listing", targetId: "lst-009", targetLabel: "Prime parcel listing", reporterName: "Anonymous", reason: "Spam / duplicate", detail: "Same listing posted three times with different prices.", status: "dismissed", createdAt: daysAgo(30) },
];

/* ------------------------------------------------------------------ */
/* assembled seed                                                      */
/* ------------------------------------------------------------------ */

export function buildSeedDb(): DbShape {
  const { conversations, messages } = buildConversations();
  const listings = [...heroListings, ...generatedListings()];

  // Give the two "factory" verification cases their real listing titles.
  for (const vc of verificationCases) {
    const l = listings.find((x) => x.id === vc.listingId);
    if (l) vc.listingTitle = l.title;
  }

  return {
    users: structuredClone(users),
    listings,
    conversations: structuredClone(conversations),
    messages: structuredClone(messages),
    purchases: structuredClone(purchases),
    verificationCases: structuredClone(verificationCases),
    reviews: buildReviews(),
    providers: structuredClone(providers),
    notifications: structuredClone(notifications),
    leads: structuredClone(leads),
    reports: structuredClone(reports),
    parcelOverrides: { "ejisu-royal-021": "sold" },
    customEstates: [],
    customParcels: {},
    materialOrders: [],
    customMaterials: supplierMaterials(),
  };
}

/** A couple of products already listed by the demo seller (u-seller-1). */
function supplierMaterials() {
  const supplierName = users.find((u) => u.id === "u-seller-1")?.company ?? "Adom Lands & Estates Ltd";
  const base = {
    supplierId: "u-seller-1",
    supplierName,
    region: "Greater Accra",
    rating: 4.6,
    reviewsCount: 12,
    inStock: true,
  };
  return [
    {
      ...base,
      id: "mat-sup-001",
      name: "Precast concrete fence post",
      category: "blocks" as const,
      brand: "Adom Precast",
      price: 85,
      unit: "piece",
      description: "Ready-made reinforced fence post for quick, durable perimeter walls.",
      deliveryDays: 3,
      popular: true,
    },
    {
      ...base,
      id: "mat-sup-002",
      name: "Interlocking paving block",
      category: "tiles" as const,
      brand: "Adom Precast",
      price: 4.2,
      unit: "piece",
      description: "Heavy-duty interlocking paver for driveways and compounds.",
      deliveryDays: 4,
    },
  ];
}
