# RealEstate — Ghana's trust-first land marketplace (frontend prototype)

**RealEstate** (*Real*Estate) is a complete, clickable, frontend-only prototype of a land & property
marketplace for Ghana. Buyers shop for land **directly on a live satellite map** — tapping the exact
plots they want — then buy through a simulated **MoMo/card → escrow** flow. Sellers list land through a
guided wizard and earn a **Verified** badge via a document-verification pipeline; admins run the
verification queue, moderation and platform analytics.

> ⚠️ **Everything is simulated.** There is no backend, no real auth, no real payments. All data lives in
> an in-memory mock database persisted to `localStorage`.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (0 errors) |
| `npm test` | Vitest + React Testing Library unit/integration tests |
| `npm run e2e` | Playwright smoke tests: the full buy flow + the seller estate-publishing flow (first run: `npx playwright install chromium`). Boots its own server on port 3117 — if `npm run dev` is already running for this repo, point at it instead: `PW_BASE_URL=http://localhost:<port> npm run e2e` |
| `npm run generate:parcels` | Regenerates the parcel GeoJSON in `src/data/parcels/` (deterministic) |

## Touring the app (no code edits needed)

1. Use the floating **“Demo” role switcher** (bottom-left) to jump between **Buyer / Seller / Provider / Admin**
   personas — or register/login normally (any well-formed credentials work;
   `kwame.mensah@example.com` signs into the seeded buyer).
2. **The signature flow:** switch to *Buyer* → open **Map** → tap 2+ green plots (plot number, owner,
   status, m²/ft², length & breadth appear in the selection panel with running totals) → **Buy** →
   pay with **MTN MoMo** (sandbox) → watch the **escrow tracker** → find the plots under
   **Dashboard → Purchases** with downloadable documents. Tick “simulate a declined payment” at
   checkout to see the failure path.
3. **Seller:** run **Seller → Listings → New listing** (7-step wizard with draw-on-map/GPS/GeoJSON
   location input, autosave and live preview). In step 1, turn on **“Sell as clickable plots on the
   map”** to auto-generate a plot grid (rows × columns of 100 ft × 70 ft plots around your pin) — or
   upload your surveyor's **GeoJSON/KML** and each polygon becomes a selectable plot (its
   `plotNumber`, `price` and `status` properties are honoured). Publishing lands you on the map with
   the new estate live and buyable. Then **Verification → Submit a listing** with drag-and-drop
   documents.
4. **Admin:** open **Admin → Verification**, approve the case you just submitted — the listing's
   badge flips to **Verified** and the seller gets notified. Moderation, users and abuse reports are
   under the other admin tabs.
5. **Build on your land — the materials shop:** open **Materials** (top nav) → browse ~60 building
   products (cement, blocks, roofing, steel, plumbing, electrical, paint, tiles, tools) by category →
   **Add to cart** → open the cart (header 🛒) → **Checkout** → pay by MoMo/card (sandbox) → track the
   delivery under **Dashboard → Material orders** with a status stepper you can advance. Suppliers
   register via **"I supply materials & tools"** and manage products under **Seller → Materials**.
6. **Land conflict checker** (`/land-check`, **Check land** in the top nav): draw or upload a boundary,
   then run a check that overlays **your land (blue)**, any **conflicting registered plot (amber)** and
   the exact **overlap (red)**, listing each clashing plot with owner and overlap area. Free for
   signed-in sellers; guests pay a one-off sandbox fee. Use **"Load example"** to see a conflict over
   the Oyibi estate instantly. Search a town / **"Use my location"** to move the map to your area first.
   After a check, **"Email me this report"** builds a polished HTML report email — press **Preview** to
   open the exact email that would be sent (simulated; swap the send for a provider route to go live).
7. Also try: search & filters with URL-synced state and saved searches (`/listings`), favorites,
   buyer↔seller chat with typing simulation, notifications (bell), the service-provider directory
   with reviews & quote requests, and the affordability calculator on any property page.
   **“Reset demo data”** in the role switcher restores the seed state.

## Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Base UI
primitives) · lucide-react · Framer Motion · Zustand (persisted stores) · TanStack Query ·
React Hook Form + Zod · MapLibre GL JS (Esri satellite + OSM raster) · next-intl (i18n scaffolding,
English complete) · Recharts · Vitest + RTL · Playwright.

## Project structure

```
src/
├─ app/                     # routes (App Router)
│  ├─ (site)/               # public pages + footer: landing, listings, property/[id], materials,
│  │                        # land-check, service-providers, pricing, faq, about, login, register[/role]
│  ├─ map/                  # full-screen satellite plot-picker (signature feature)
│  ├─ checkout/             # simulated MoMo/card → escrow checkout (land)
│  ├─ materials/checkout/   # building-materials cart checkout (delivery + sandbox payment)
│  ├─ dashboard/            # buyer: overview, favorites, messages, purchases, orders, purchase/[id]
│  ├─ seller/               # seller: overview, listings (+wizard/edit), leads, messages, verification
│  ├─ admin/                # admin: analytics, verification queue, moderation, users, reports
│  └─ settings/             # shared profile/notification settings
├─ components/              # ui/ (shadcn) + feature components (map, listings, property, checkout, …)
├─ lib/
│  ├─ api/                  # ★ MOCK SERVICE LAYER — the seam for a real backend
│  └─ mock/                 # seed data + localStorage-backed mock DB
├─ stores/                  # Zustand: session, favorites/saved-searches, map plot selection
├─ data/                    # estates metadata + generated parcel GeoJSON
├─ types/                   # all shared domain types
└─ i18n/ + messages/        # next-intl scaffolding (en complete; add tw/fr here)
```

## Connecting a real backend

The UI **never** touches mock data directly — every read/write goes through the async functions in
**`src/lib/api/*`** (`getListings`, `getListing`, `login`, `startPurchase`, `submitVerification`,
`getMessages`, …), which return the types in `src/types`. To go live:

1. Reimplement each module in `src/lib/api/` with real `fetch`/client calls that resolve the same
   types. TanStack Query and every screen keep working untouched.
2. Delete `src/lib/mock/` (seed + localStorage DB) — it is referenced only by the api modules and the
   dev role switcher.
3. Replace the mock session in `src/stores/session.ts` with your auth provider (the `Session` shape
   is already API-token oriented) and remove the `RoleSwitcher` from `src/app/layout.tsx`.
4. Serve real parcel GeoJSON (same `ParcelCollection` shape as `src/data/parcels/*.json`) from your
   API instead of the static files in `src/data/estates.ts`.

## Testing

- **Vitest** (`npm test`): mock-service behaviour (filtering/sorting, purchase→escrow→parcel-sold),
  formatting utils, the selection store, and `<ListingCard/>` rendering — 19 tests.
- **Playwright** (`npm run e2e`): a full smoke test — role-switch to buyer, select 2 plots on the
  satellite map, checkout with MoMo, verify the escrow tracker and the purchases list.

## Notes & credits

- Satellite imagery: Esri World Imagery tiles; streets: © OpenStreetMap contributors.
- Placeholder photos: picsum.photos; avatars: i.pravatar.cc.
- Parcel geometry is generated (`scripts/generate-parcels.mjs`) around three real localities:
  Oyibi (Greater Accra), Ejisu (Ashanti) and Sagnarigu (Northern) — plot sizes follow the standard
  Ghanaian 100 ft × 70 ft residential plot.
