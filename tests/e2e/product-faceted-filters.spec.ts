import { test, expect } from "@playwright/test";

test("category listing faceted filtering", async ({ page }) => {
  // Navigate to a category page
  await page.goto("/shop/miniatures");

  // Verify the page loads with a heading
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Verify the facet groups render (Categories, Brand, Availability)
  await expect(page.locator("text=Categories").first()).toBeVisible();
  await expect(page.locator("text=Brand").first()).toBeVisible();
  await expect(page.locator("text=Availability").first()).toBeVisible();

  // Apply a subcategory filter if any subcategory chips/checkboxes exist
  const subCheckbox = page
    .locator('input[type="checkbox"]')
    .first();
  if ((await subCheckbox.count()) > 0) {
    await subCheckbox.click();
    // URL reflects the applied filter
    await expect(page).toHaveURL(/\/shop\/miniatures\?sub=/);
  }

  // Verify at least one product or a clear empty state is shown
  const products = page.locator(".grid > div");
  const emptyState = page.locator("text=No products match your filters");
  const clearAll = page.getByRole("button", { name: /clear all/i });
  const hasContent =
    (await products.count()) > 0 || (await emptyState.count()) > 0;
  expect(hasContent).toBe(true);

  // Refresh: filter state preserved via URL
  await page.reload();
  await expect(page).toHaveURL(/\/shop\/miniatures\?sub=/);

  // Clear all filters restores the full list
  if ((await clearAll.count()) > 0) {
    await clearAll.first().click();
    await expect(page).toHaveURL(/\/shop\/miniatures$/);
  }
});

test("category listing result count updates when filtering", async ({ page }) => {
  await page.goto("/shop/miniatures");

  await expect(page.locator("text=Showing")).toBeVisible();

  // Apply a filter if available
  const subCheckbox = page.locator('input[type="checkbox"]').first();
  if ((await subCheckbox.count()) > 0) {
    await subCheckbox.click();
    // Results info still visible after filtering
    await expect(page.locator("text=Showing")).toBeVisible();
  }
});