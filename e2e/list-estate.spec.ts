import { expect, test } from "@playwright/test";

/**
 * Seller flow for the signature feature (runs in mock mode — see playwright.config.ts):
 * open the listing wizard → define plots by uploading a GeoJSON of surveyed parcels
 * (the production flow — no drawing/pins) → publish → the new estate opens on /map.
 *
 * A seller session is injected directly so the test focuses on the wizard, not auth.
 */

const SELLER_SESSION = JSON.stringify({
  state: {
    session: {
      user: {
        id: "u-seller-1",
        name: "Test Seller",
        email: "seller@e2e.test",
        phone: "+233200000000",
        role: "seller",
        region: "Greater Accra",
        verified: true,
        joinedAt: new Date().toISOString(),
      },
      token: "mock-e2e",
      createdAt: new Date().toISOString(),
    },
  },
  version: 0,
});

// One surveyed parcel near Oyibi — becomes a single selectable plot.
const PLOTS_GEOJSON = JSON.stringify({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { plotNumber: "TS-001", price: 60000 },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-0.0872, 5.8260],
            [-0.0862, 5.8260],
            [-0.0862, 5.8268],
            [-0.0872, 5.8268],
            [-0.0872, 5.8260],
          ],
        ],
      },
    },
  ],
});

test("seller can publish a plotted estate via the wizard (GeoJSON upload)", async ({ page }) => {
  await page.addInitScript((s) => window.localStorage.setItem("realestate:session", s), SELLER_SESSION);

  await page.goto("/seller/listings/new");

  // step 1 — location + define plots by uploading a surveyor's GeoJSON
  await page.getByLabel("Region").click();
  await page.getByRole("option", { name: "Greater Accra" }).click();
  await page.getByLabel("Town / city").fill("Oyibi");
  await page.getByLabel("Address / nearest landmark").fill("Test ridge, off the Dodowa road");
  await page.getByRole("button", { name: /Upload GeoJSON\/KML/ }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "plots.geojson", mimeType: "application/geo+json", buffer: Buffer.from(PLOTS_GEOJSON) });
  await expect(page.getByText(/plots? ready/i)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 2 — description
  await page.getByLabel("Listing title").fill("Playwright Test Gardens — selectable plots");
  await page
    .getByLabel("Description")
    .fill("A surveyed layout uploaded as GeoJSON for the e2e suite to publish and open on the map.");
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 3 — key features (prefilled defaults pass validation)
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 4 — photos: drop one fake image through the hidden input
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "site-photo.png", mimeType: "image/png", buffer: Buffer.from("fake-image-bytes") });
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 5 — documents (optional) and step 6 — terms (prefilled)
  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 7 — publish
  await page.getByRole("button", { name: /publish listing/i }).click({ force: true, noWaitAfter: true });

  // lands on the map focused on the new estate
  await expect(page).toHaveURL(/\/map\?estate=est-/, { timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Playwright Test Gardens/ })).toBeVisible();
});
