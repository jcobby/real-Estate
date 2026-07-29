// Seeds the live backend with realistic Ghana data: sellers, land listings with
// clickable plots, building materials, service providers and reviews.
//
//   node scripts/seed-backend.mjs
//
// Config via env:
//   API_BASE_URL   backend base (defaults to the current dev tunnel)
//   FRONTEND_URL   where images are served from (defaults to http://localhost:3000)
//
// Images: any files you drop in public/seed/ are used; otherwise the 9 curated
// photos in public/lands/ are used. Re-run once — it creates fresh rows each time.
import { readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.API_BASE_URL || "https://698zp0x7-3001.uks1.devtunnels.ms").replace(/\/+$/, "");
const FRONTEND = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
const H = { "X-Tunnel-Skip-AntiPhishing-Page": "true", "Content-Type": "application/json" };

/* ------------------------------------------------------------------ images */
function imageUrls() {
  const seedDir = resolve(root, "public/seed");
  if (existsSync(seedDir)) {
    const files = readdirSync(seedDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    if (files.length) return files.map((f) => `${FRONTEND}/seed/${f}`);
  }
  return Array.from({ length: 9 }, (_, i) => `${FRONTEND}/lands/land-${String(i + 1).padStart(2, "0")}.jpg`);
}
const IMAGES = imageUrls();
const pickImages = (n, offset) => Array.from({ length: n }, (_, i) => IMAGES[(offset + i) % IMAGES.length]);

/* -------------------------------------------------------------------- http */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, path, { body, token, _try = 0 } = {}) {
  const headers = { ...H };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 429 && _try < 6) {
    await sleep(4000);
    return req(method, path, { body, token, _try: _try + 1 });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json.error || {};
    throw new Error(`${method} ${path} → ${res.status} ${e.code || ""} ${JSON.stringify(e.fieldErrors || e.message || "")}`);
  }
  return json.data;
}

/** Register (or log in if the email already exists), returning a token + user. */
async function account({ name, email, role }) {
  await sleep(700); // pace auth calls to stay under the rate limit
  const password = "Password123";
  try {
    await req("POST", "/v1/auth/register", {
      body: { name, email, password, phone: "+233200000000", role, region: "Greater Accra" },
    });
  } catch {
    /* already exists — fall through to login */
  }
  const data = await req("POST", "/v1/auth/login", { body: { email, password } });
  return { token: data.accessToken, user: data.user };
}

/* ------------------------------------------------------------------- plots */
function plotsAround(center, count, price, prefix, owner) {
  const size = 0.0004; // ~44 m sides
  const gap = 0.00046;
  const cols = Math.ceil(Math.sqrt(count));
  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const lng = center.lng + (c - cols / 2) * gap;
    const lat = center.lat + (r - cols / 2) * gap;
    const ring = [[lng, lat], [lng + size, lat], [lng + size, lat + size], [lng, lat + size], [lng, lat]];
    const status = i % 6 === 0 ? "sold" : i % 5 === 0 ? "reserved" : "available";
    return {
      type: "Feature",
      properties: { plotNumber: `${prefix}-${String(i + 1).padStart(3, "0")}`, owner, status, price, areaSqm: 1900 },
      geometry: { type: "Polygon", coordinates: [ring] },
    };
  });
}

/* -------------------------------------------------------------------- data */
const SELLERS = [
  { name: "Adom Lands & Estates", email: "adom.lands@realestate.gh", type: "developer" },
  { name: "Kwabena Owusu", email: "kwabena.owusu@realestate.gh", type: "agent" },
  { name: "GreenAcre Ghana", email: "greenacre@realestate.gh", type: "developer" },
];

const LISTINGS = [
  { t: "Serviced plots at Oyibi Hillcrest — titled & walled", ls: "semi-developed", price: 48000, region: "Greater Accra", city: "Oyibi", addr: "Off the Adenta–Dodowa road", lat: 5.826, lng: -0.087, acres: 4.5, plots: 8, prefix: "OY", am: ["Road access", "Water", "Electricity", "Titled", "Walled"] },
  { t: "Adenta Ridge residential plots", ls: "developed", price: 92000, region: "Greater Accra", city: "Adenta", addr: "Near Adenta SSNIT flats", lat: 5.708, lng: -0.148, acres: 3, plots: 6, prefix: "AR", am: ["Road access", "Water", "Electricity", "Titled"] },
  { t: "Kasoa Millennium City — affordable plots", ls: "greenfield", price: 36000, region: "Central", city: "Kasoa", addr: "Millennium City phase 3", lat: 5.534, lng: -0.417, acres: 6, plots: 10, prefix: "KM", am: ["Road access", "Electricity", "Documented"] },
  { t: "Tema Community 25 prime land", ls: "developed", price: 135000, region: "Greater Accra", city: "Tema", addr: "Community 25 main road", lat: 5.68, lng: -0.01, acres: 2, plots: 4, prefix: "TC", am: ["Road access", "Water", "Electricity", "Titled", "Drainage"] },
  { t: "Ejisu Gardens — Kumasi outskirts", ls: "greenfield", price: 42000, region: "Ashanti", city: "Ejisu", addr: "Ejisu-Besease road", lat: 6.72, lng: -1.47, acres: 5, plots: 8, prefix: "EJ", am: ["Road access", "Electricity", "Documented"] },
  { t: "Oduom serviced plots near KNUST", ls: "semi-developed", price: 68000, region: "Ashanti", city: "Kumasi", addr: "Oduom, near KNUST", lat: 6.68, lng: -1.55, acres: 3, plots: 6, prefix: "OD", am: ["Road access", "Water", "Electricity", "Titled"] },
  { t: "Tamale Vitting Estate plots", ls: "greenfield", price: 28000, region: "Northern", city: "Tamale", addr: "Vitting, off the Bolga road", lat: 9.44, lng: -0.86, acres: 7, plots: 10, prefix: "VT", am: ["Road access", "Electricity"] },
  { t: "Koforidua Adweso hillside plots", ls: "semi-developed", price: 40000, region: "Eastern", city: "Koforidua", addr: "Adweso estate", lat: 6.1, lng: -0.26, acres: 4, plots: 6, prefix: "AD", am: ["Road access", "Water", "Electricity", "Documented"] },
  { t: "Cape Coast Abura greenfield land", ls: "greenfield", price: 34000, region: "Central", city: "Cape Coast", addr: "Abura, near the university", lat: 5.12, lng: -1.26, acres: 5, plots: 8, prefix: "AB", am: ["Road access", "Electricity"] },
  { t: "Takoradi Kwesimintsim developed plots", ls: "developed", price: 98000, region: "Western", city: "Takoradi", addr: "Kwesimintsim junction", lat: 4.9, lng: -1.77, acres: 2, plots: 4, prefix: "KW", am: ["Road access", "Water", "Electricity", "Titled"] },
  { t: "Aburi Hills view land — cool climate", ls: "greenfield", price: 72000, region: "Eastern", city: "Aburi", addr: "Aburi, near the botanical gardens", lat: 5.85, lng: -0.17, acres: 3, plots: 5, prefix: "AH", am: ["Road access", "Water", "Scenic view", "Documented"] },
  { t: "Dodowa Forest Edge large parcels", ls: "undeveloped", price: 30000, region: "Greater Accra", city: "Dodowa", addr: "Dodowa forest edge", lat: 5.88, lng: -0.1, acres: 8, plots: 12, prefix: "DF", am: ["Road access", "Documented"] },
];

const SUPPLIERS = [
  { name: "BuildRight Supplies", email: "buildright@realestate.gh" },
  { name: "AshantiMat Depot", email: "ashantimat@realestate.gh" },
];

const MATERIALS = [
  ["Ghacem Portland Cement 50kg", "cement", "Ghacem", 95, "bag", 2],
  ["Diamond Cement 50kg", "cement", "Diamond", 90, "bag", 2],
  ["Dangote Cement 50kg", "cement", "Dangote", 92, "bag", 3],
  ["Supacem 50kg", "cement", "Supacem", 88, "bag", 3],
  ["6-inch Hollow Block", "blocks", "Local", 6, "piece", 2],
  ["5-inch Hollow Block", "blocks", "Local", 5, "piece", 2],
  ["4-inch Solid Block", "blocks", "Local", 5.5, "piece", 2],
  ["Precast Concrete Fence Post", "blocks", "Adom Precast", 45, "piece", 4],
  ["IBR Aluzinc Roofing Sheet", "roofing", "Aluworks", 120, "12m length", 3],
  ["Corrugated Roofing Sheet", "roofing", "Domod", 85, "sheet", 3],
  ["Aluminium Ridge Cap", "roofing", "Aluworks", 60, "piece", 3],
  ["Roofing Nails (umbrella head)", "roofing", "Local", 25, "kg", 2],
  ["12mm Iron Rod", "steel", "Tema Steel", 78, "12m length", 3],
  ["16mm Iron Rod", "steel", "Tema Steel", 135, "12m length", 3],
  ["10mm Iron Rod", "steel", "Tema Steel", 55, "12m length", 3],
  ["BRC Mesh A142", "steel", "Tema Steel", 320, "sheet", 4],
  ["Binding Wire", "steel", "Local", 30, "kg", 2],
  ["Trip of Sand (tipper)", "aggregates", "Local", 900, "trip", 1],
  ["Trip of Chippings", "aggregates", "Local", 1100, "trip", 1],
  ["Trip of Gravel", "aggregates", "Local", 850, "trip", 1],
  ["Quarry Dust", "aggregates", "Local", 700, "trip", 1],
  ["2x4 Wawa Timber", "timber", "Local", 40, "12ft length", 2],
  ["Plywood 18mm", "timber", "Ayensu", 220, "sheet", 3],
  ["Marine Board 18mm", "timber", "Ayensu", 380, "sheet", 4],
  ["PVC Pipe 4-inch", "plumbing", "Duraplast", 90, "6m length", 2],
  ["PPR Hot/Cold Pipe", "plumbing", "Duraplast", 45, "4m length", 2],
  ["Water Closet Set", "plumbing", "Twyford", 750, "set", 4],
  ["Poly Water Tank 1000L", "plumbing", "Duraplast", 950, "piece", 3],
  ["2.5mm Electrical Cable", "electrical", "Nexans", 480, "roll", 2],
  ["Double Socket Outlet", "electrical", "MK", 35, "piece", 2],
  ["LED Bulb 12W", "electrical", "Philips", 20, "piece", 1],
  ["Distribution Board (8-way)", "electrical", "Schneider", 260, "piece", 3],
  ["Emulsion Paint 4L", "paint", "Coral", 180, "bucket", 2],
  ["Gloss Paint 4L", "paint", "Azar", 210, "bucket", 2],
  ["Wall Putty 20kg", "paint", "Coral", 140, "bag", 3],
  ["Wheelbarrow", "tools", "Local", 320, "piece", 2],
  ["Bricklayer's Trowel", "tools", "Local", 55, "piece", 2],
  ["Spirit Level 60cm", "tools", "Stanley", 120, "piece", 2],
  ["Flush Door", "doors-windows", "Local", 450, "piece", 4],
  ["Aluminium Sliding Window", "doors-windows", "Aluworks", 680, "piece", 5],
  ["Security Metal Door", "doors-windows", "Local", 1800, "piece", 6],
  ["60x60 Floor Tile", "tiles", "Keda", 95, "box", 3],
  ["30x60 Wall Tile", "tiles", "Keda", 75, "box", 3],
  ["Tile Adhesive 20kg", "tiles", "Fixit", 85, "bag", 2],
];

const PROVIDERS = [
  { name: "Precision Geo Surveys", category: "surveyor", region: "Greater Accra", city: "Accra", desc: "Licensed land surveyors — boundary surveys, site plans and cadastral work across southern Ghana.", services: ["Boundary survey", "Site plan", "Cadastral"], start: 500, jobs: 340, years: 12 },
  { name: "Kumasi Survey Co", category: "surveyor", region: "Ashanti", city: "Kumasi", desc: "Ashanti-region surveyors with fast turnaround on demarcation and title site plans.", services: ["Demarcation", "Site plan"], start: 400, jobs: 210, years: 8 },
  { name: "Adom Developers Ltd", category: "developer", region: "Greater Accra", city: "Tema", desc: "Estate developers delivering serviced plots and turnkey homes.", services: ["Estate development", "Turnkey homes"], start: 15000, jobs: 65, years: 15 },
  { name: "SafeHands Property Mgmt", category: "property-manager", region: "Greater Accra", city: "Accra", desc: "We manage and monitor land and rentals for diaspora owners — regular photo updates.", services: ["Plot monitoring", "Rentals", "Caretaking"], start: 300, jobs: 480, years: 9 },
  { name: "BrightSpark Electricals", category: "electrician", region: "Greater Accra", city: "Accra", desc: "Certified electricians for wiring, ECG connection and solar backup.", services: ["House wiring", "ECG connection", "Solar"], start: 250, jobs: 620, years: 7 },
  { name: "FlowMaster Plumbing", category: "plumber", region: "Ashanti", city: "Kumasi", desc: "Plumbing installations, poly-tank stands and borehole connections.", services: ["Plumbing", "Poly-tank", "Borehole"], start: 200, jobs: 390, years: 6 },
  { name: "TrueColours Painters", category: "painter", region: "Greater Accra", city: "Adenta", desc: "Interior and exterior painting, texture coating and screeding.", services: ["Painting", "Texture coat", "Screeding"], start: 180, jobs: 540, years: 10 },
  { name: "LandLens Media", category: "photographer", region: "Greater Accra", city: "Accra", desc: "Drone and ground photography for land, estates and property listings.", services: ["Drone photography", "Listing photos"], start: 350, jobs: 260, years: 5 },
];

const REVIEW_BODIES = [
  "Very professional and delivered on time. Highly recommend.",
  "Clear communication throughout and fair pricing. Will use again.",
  "Did exactly what was promised — the documents were spot on.",
  "Responsive and knowledgeable. Made the whole process easy.",
  "Great work and follow-up. Trustworthy team.",
];

/* -------------------------------------------------------------------- run */
async function main() {
  console.log(`Seeding ${BASE}\nImages from: ${IMAGES[0].replace(/[^/]+$/, "")} (${IMAGES.length} files)\n`);
  let ok = 0, fail = 0, skip = 0;
  const done = (label) => { ok++; console.log("  ✓ " + label); };
  const skipped = (label) => { skip++; console.log("  · exists, skipped: " + label); };
  const oops = (label, e) => { fail++; console.log("  ✗ " + label + " — " + e.message); };

  // existing rows → idempotent re-runs
  const existTitles = new Set(((await req("GET", "/v1/listings?pageSize=100")).items || []).map((l) => l.title));
  const existMaterials = new Set(((await req("GET", "/v1/materials?pageSize=100")).items || []).map((m) => m.name));
  const existProviders = new Set(((await req("GET", "/v1/providers?pageSize=100")).items || []).map((p) => p.name));

  // sellers → listings + estates
  console.log("Sellers & listings…");
  const sellers = [];
  for (const s of SELLERS) sellers.push({ ...s, ...(await account({ name: s.name, email: s.email, role: "seller" })) });

  for (let i = 0; i < LISTINGS.length; i++) {
    const l = LISTINGS[i];
    if (existTitles.has(l.t)) { skipped(l.city + " listing"); continue; }
    const seller = sellers[i % sellers.length];
    try {
      const created = await req("POST", "/v1/listings", {
        token: seller.token,
        body: {
          title: l.t, type: "land", landStatus: l.ls, price: l.price, negotiable: true,
          region: l.region, city: l.city, address: l.addr, coords: { lat: l.lat, lng: l.lng },
          sizeAcres: l.acres, plotsTotal: l.plots, plotsAvailable: l.plots,
          images: pickImages(3, i * 2), amenities: l.am, sellerType: seller.type, status: "active",
          description: `${l.plots} serviced plots at ${l.city}, ${l.region}. ${l.addr}. Documented land with ${l.am.join(", ").toLowerCase()}. Buy the exact plots you want on the map and pay into escrow until the title is in your name.`,
        },
      });
      const listing = created.listing;
      await req("POST", "/v1/estates", {
        token: seller.token,
        body: {
          listingId: listing.id, name: l.t.split(" — ")[0], region: l.region, city: l.city,
          center: { lat: l.lat, lng: l.lng }, zoom: 16,
          description: `${l.city} estate`, parcels: plotsAround({ lat: l.lat, lng: l.lng }, l.plots, l.price, l.prefix, seller.name),
        },
      });
      done(`${l.city}: ${l.t.slice(0, 40)}… (${l.plots} plots)`);
    } catch (e) { oops(l.t, e); }
  }

  // suppliers → materials
  console.log("Suppliers & materials…");
  const suppliers = [];
  for (const s of SUPPLIERS) suppliers.push({ ...s, ...(await account({ name: s.name, email: s.email, role: "seller" })) });
  for (let i = 0; i < MATERIALS.length; i++) {
    const [name, category, brand, price, unit, deliveryDays] = MATERIALS[i];
    if (existMaterials.has(name)) { skip++; continue; }
    const sup = suppliers[i % suppliers.length];
    try {
      await req("POST", "/v1/materials", {
        token: sup.token,
        body: { name, category, brand, price: Math.round(price), unit, region: "Greater Accra", inStock: true, deliveryDays,
          description: `${brand !== "Local" ? brand + " " : ""}${name} — trade quality, delivered to your site.`, supplierName: sup.name },
      });
      done(name);
    } catch (e) { oops(name, e); }
  }

  // providers
  console.log("Service providers…");
  for (let i = 0; i < PROVIDERS.length; i++) {
    const p = PROVIDERS[i];
    if (existProviders.has(p.name)) { skipped(p.name); continue; }
    const prov = await account({ name: p.name, email: `provider${i + 1}@realestate.gh`, role: "provider" });
    try {
      await req("POST", "/v1/providers", {
        token: prov.token,
        body: { name: p.name, category: p.category, region: p.region, city: p.city, description: p.desc,
          services: p.services, startingPrice: p.start, jobsDone: p.jobs, yearsActive: p.years,
          avatarUrl: `https://i.pravatar.cc/200?u=${encodeURIComponent(p.name)}` },
      });
      done(p.name);
    } catch (e) { oops(p.name, e); }
  }

  // a buyer leaves a few reviews (backend allows one per target — re-runs 409 harmlessly)
  console.log("Reviews…");
  const buyer = await account({ name: "Ama Serwaa", email: "ama.buyer@realestate.gh", role: "buyer" });
  const provs = ((await req("GET", "/v1/providers?pageSize=100")).items || []).slice(0, 6);
  for (let i = 0; i < provs.length; i++) {
    try {
      await req("POST", "/v1/reviews", { token: buyer.token, body: { targetId: provs[i].id, targetType: "provider", rating: 4 + (i % 2), body: REVIEW_BODIES[i % REVIEW_BODIES.length] } });
      ok++;
    } catch { /* already reviewed */ }
  }

  console.log(`\nDone. ~${ok} created, ${skip} skipped, ${fail} failed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
