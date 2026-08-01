import { test, expect } from "@playwright/test";

test("subcategory browsing and filtering", async ({ page }) => {
  // Navigate to a category page
  await page.goto("/categories/board-games");

  // Verify heading
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Verify filter chips are rendered (All + subcategories)
  // These may vary based on Square data, but "All" should always be present if subcategories exist
  // At minimum the page should load without errors
  await expect(page.locator("text=All")).toBeVisible();

  // Click a subcategory chip if available
  const chipButtons = page.locator("button", {
    hasText: /^(?!All$).+/,
  });
  const chipCount = await chipButtons.count();

  if (chipCount > 0) {
    // Click the first subcategory chip
    await chipButtons.first().click();

    // Verify URL updated with ?sub= parameter
    await expect(page).toHaveURL(/\/categories\/board-games\?sub=/);

    // Verify products are still visible (or empty state shown)
    const products = page.locator(".grid > div");
    const emptyState = page.locator("text=No products");

    // Either products are shown or empty state message
    const hasContent =
      (await products.count()) > 0 || (await emptyState.count()) > 0;
    expect(hasContent).toBe(true);
  }

  // Navigate back to All
  await page.locator("button", { hasText: "All" }).click();
  await expect(page).toHaveURL(/\/categories\/board-games$/);
});

test("category page returns 404 for non-existent category", async ({
  page,
}) => {
  const response = await page.goto("/categories/nonexistent-category");
  // Should return 404 or show not-found page
  expect(response?.status()).toBe(404);
});

test("shop category page loads with subcategory filters", async ({ page }) => {
  await page.goto("/shop/board-games");

  // Verify the page loads
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Verify subcategory filter chips exist in FilterBar
  const filterBar = page.locator("text=Filters:");
  await expect(filterBar).toBeVisible();
});
