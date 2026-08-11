import { expect, test } from "@playwright/test";

/**
 * Read-only production smoke test — safe to run against a LIVE server (makes only
 * GET requests, no sign-in, no writes, no data pollution). Verifies the public
 * surface renders end to end against whatever backend the server is wired to.
 *
 * Run against a running server:  PW_BASE_URL=http://localhost:3001 npx playwright test smoke
 */

test("home page renders the hero and primary nav", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Land Check" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Materials/ }).first()).toBeVisible();
});

test("listings page loads results or a clean empty state", async ({ page }) => {
  await page.goto("/listings");
  const cards = page.locator('a[href^="/property/"]');
  const empty = page.getByText(/no (listings|results)/i);
  await expect(cards.first().or(empty.first())).toBeVisible({ timeout: 20_000 });
});

test("a property detail page renders from a listing", async ({ page }) => {
  await page.goto("/listings");
  const first = page.locator('a[href^="/property/"]').first();
  if (await first.isVisible().catch(() => false)) {
    await first.click();
    await expect(page).toHaveURL(/\/property\//, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("materials shop shows products with category images", async ({ page }) => {
  await page.goto("/materials");
  await expect(page.getByRole("button", { name: /add to cart/i }).first()).toBeVisible({ timeout: 20_000 });
  // every product resolves an image; category art lives under /materials/
  await expect(page.locator("img").first()).toBeVisible();
});

test("land check runs the built-in example instantly", async ({ page }) => {
  await page.goto("/land-check");
  await expect(page.getByRole("heading", { name: "Land Check" })).toBeVisible();
  await page.getByRole("button", { name: /try an example/i }).click();
  await expect(page.getByText(/conflict detected/i)).toBeVisible({ timeout: 15_000 });
});

test("map page mounts the satellite canvas", async ({ page }) => {
  await page.goto("/map");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 20_000 });
});

test("login form validates before submitting", async ({ page }) => {
  await page.goto("/login");
  // the header also has a "Sign in" link — target the form's submit button
  await page.getByRole("main").getByRole("button", { name: /^Sign in$/ }).click();
  await expect(page.getByRole("alert").first()).toBeVisible({ timeout: 10_000 });
});

test("marketing pages render", async ({ page }) => {
  for (const path of ["/pricing", "/faq", "/about"]) {
    await page.goto(path);
    await expect(page.getByRole("heading").first()).toBeVisible();
  }
});
