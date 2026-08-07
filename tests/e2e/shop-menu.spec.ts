import { test, expect } from "@playwright/test";

test("Shop menu — desktop megamenu journey", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  // The Shop item is present in the nav.
  await expect(page.getByRole("button", { name: /shop/i })).toBeVisible();

  // Open the megamenu and verify a category column appears.
  await page.getByRole("button", { name: /shop/i }).click();
  await expect(page.getByRole("link", { name: "Miniatures" })).toBeVisible();

  // Navigate via a Shop All link.
  await page.getByRole("link", { name: /shop all miniatures/i }).click();
  await expect(page).toHaveURL(/\/categories\/miniatures/);
});

test("Shop menu — mobile drilldown journey", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: /shop/i })).toBeVisible();
  await page.getByRole("button", { name: /shop/i }).click();

  // Drawer opens with top-level categories.
  await expect(page.getByRole("dialog", { name: "Shop menu" })).toBeVisible();

  // Drill into a category with subcategories (Miniatures) if present.
  const miniatures = page.getByText("Miniatures", { exact: true });
  if ((await miniatures.count()) > 0) {
    await miniatures.first().click();
    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
  }
});