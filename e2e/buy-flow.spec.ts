import { expect, test, type Page } from "@playwright/test";

/**
 * Smoke test of the signature flow (runs in mock mode — see playwright.config.ts):
 * sign in as a buyer → select plots on the satellite map → buy via MoMo →
 * see the purchase land in the escrow tracker.
 *
 * Requires browsers: `npx playwright install chromium`
 */

async function selectPlots(page: Page, wanted: number) {
  const canvas = page.locator(".maplibregl-canvas");
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(4000); // let tiles + parcel layers paint

  const box = await canvas.boundingBox();
  if (!box) throw new Error("map canvas not laid out");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // probe a coarse grid across the estate until enough available plots are selected
  const offsets: Array<[number, number]> = [];
  for (let dy = -100; dy <= 100; dy += 40) {
    for (let dx = -160; dx <= 160; dx += 40) {
      offsets.push([dx, dy]);
    }
  }
  for (const [dx, dy] of offsets) {
    await page.mouse.click(cx + dx, cy + dy);
    await page.waitForTimeout(600);
    const header = page.getByText(/Your selection \((\d+)\)/);
    if (await header.isVisible().catch(() => false)) {
      const text = await header.textContent();
      const count = Number(text?.match(/\((\d+)\)/)?.[1] ?? 0);
      if (count >= wanted) return;
    }
  }
  throw new Error(`could not select ${wanted} available plots`);
}

test("buyer can pick plots on the map and buy with MoMo escrow", async ({ page }) => {
  // 1. sign in through the real login form (mock backend returns a buyer session)
  await page.goto("/login");
  await page.getByLabel("Email").fill("buyer@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Password123");
  await page.getByRole("main").getByRole("button", { name: /^Sign in$/ }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  // 2. select two available plots on the satellite map
  await page.goto("/map");
  await selectPlots(page, 2);
  await expect(page.getByText("Total selections")).toBeVisible();
  await expect(page.getByText("Total land area")).toBeVisible();

  // 3. buy → checkout review → payment
  await page.getByRole("button", { name: /Buy \d+ plots?/ }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await page.getByRole("button", { name: /continue to payment/i }).click();
  await expect(page.getByText("MTN MoMo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /pay .* into escrow/i }).click();

  // 4. sandbox gateway resolves → success screen → escrow tracker
  await expect(page.getByText(/payment locked in escrow/i)).toBeVisible({ timeout: 15_000 });
  await page.getByText(/open escrow tracker/i).click();
  await expect(page).toHaveURL(/\/dashboard\/purchase\//);
  await expect(page.getByText("Funds held in escrow")).toBeVisible();

  // 5. the purchase is listed under owned plots
  await page.goto("/dashboard/purchases");
  await expect(page.getByText(/RE-\d{4}-\d{5}/).first()).toBeVisible();
});
