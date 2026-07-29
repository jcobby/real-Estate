import { expect, test } from "@playwright/test";

/**
 * Seller flow for the signature feature:
 * run the wizard with "Sell as clickable plots" on → publish →
 * the new estate opens on /map and its plots are selectable.
 */
test("seller can publish a clickable-plot estate via the wizard", async ({ page }) => {
  // sign in as the seeded seller
  await page.goto("/");
  await page.getByRole("button", { name: /open demo role switcher/i }).click();
  await expect(page.getByText(/switch role/i)).toBeVisible();
  await page.getByRole("button", { name: /Seller \/ Agent/ }).click();
  await expect(page).toHaveURL(/\/seller/, { timeout: 15_000 });

  await page.goto("/seller/listings/new");

  // step 1 — location, then "let buyers pick exact plots" via an auto grid
  await page.getByLabel("Region").click();
  await page.getByRole("option", { name: "Greater Accra" }).click();
  await page.getByLabel("Town / city").fill("Oyibi");
  await page.getByLabel("Address / nearest landmark").fill("Test ridge, off the Dodowa road");
  await page.getByRole("button", { name: /Let buyers pick exact plots/ }).click();
  await page.getByRole("tab", { name: /Auto grid/ }).click();
  await page.getByLabel("Plot prefix").fill("TS");
  await expect(page.getByText(/Generates ≈ 20 plots/)).toBeVisible(); // 4 × 5 default grid
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 2 — description
  await page.getByLabel("Listing title").fill("Playwright Test Gardens — selectable plots");
  await page
    .getByLabel("Description")
    .fill("Twenty pillared plots on a fresh layout with graded access roads, ready for the e2e suite to buy.");
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 3 — features (prefilled defaults pass validation)
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 4 — photos: drop one fake image through the hidden input
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "site-photo.png", mimeType: "image/png", buffer: Buffer.from("fake-image-bytes") });
  await expect(page.getByText(/1 file added/i)).toBeVisible();
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 5 — documents (optional) and step 6 — terms (prefilled)
  await page.getByRole("button", { name: /^Continue$/ }).click();
  await page.getByRole("button", { name: /^Continue$/ }).click();

  // step 7 — price & publish; plot counts are fixed by the grid
  await expect(page.getByLabel("Total plots")).toBeDisabled();
  await expect(page.getByText("20 generated grid").or(page.getByText("4 × 5 generated grid"))).toBeVisible();
  // force: skips the stability wait (the button swaps to a "Publishing…" spinner
  // on press) while still dispatching a real, trusted click
  await page.getByRole("button", { name: /publish listing/i }).click({ force: true, noWaitAfter: true });

  // lands on the map focused on the new estate…
  await expect(page).toHaveURL(/\/map\?estate=est-/, { timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Playwright Test Gardens/ })).toBeVisible();

  // …where its plots are selectable
  const canvas = page.locator(".maplibregl-canvas");
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(4000);
  const box = (await canvas.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  // the grid's central access road can sit exactly at the centre — probe around it
  for (const [dx, dy] of [[0, 0], [0, -35], [0, 35], [-45, -35], [45, 35], [-45, 35], [45, -35]]) {
    await page.mouse.click(cx + dx, cy + dy);
    await page.waitForTimeout(500);
    if (await page.getByText(/Your selection \(\d+\)/).isVisible().catch(() => false)) break;
  }
  await expect(page.getByText(/Your selection \(\d+\)/)).toBeVisible();
  await expect(page.getByText(/TS-\d{3}/).first()).toBeVisible();
});
