<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RealEstate (frontend prototype)

Land & property marketplace for Ghana — frontend-only, all data/payments simulated. See README.md
for the full tour, structure and backend-swap notes.

## Commands
- `npm run dev` — dev server
- `npm run build` / `npm run lint` / `npm test` — must all pass before calling work done
- `npm run e2e` — Playwright smoke test (boots its own server on port 3117; port 3000 may be used by other local apps)

## Key conventions
- UI never touches mock arrays — all data access goes through `src/lib/api/*` (async, typed via `src/types`).
- Mock DB (`src/lib/mock/db.ts`) persists to localStorage; `resetDb()` reseeds.
- shadcn/ui here is the Base UI variant: polymorphism uses the `render` prop (not `asChild`);
  the local `Button` auto-sets `nativeButton={false}` when `render` is present.
- Parcel GeoJSON is generated — edit `scripts/generate-parcels.mjs`, then `npm run generate:parcels`.
- Session/role guard is client-side (`RequireRole`); role home routes live in `src/stores/session.ts`.
- Chart colors are CVD-validated hexes in `globals.css` (`--chart-*`) — don't swap them casually.
