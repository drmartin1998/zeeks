import { test, expect } from "@playwright/test";

test("navigation search typeahead suggests products while typing", async ({
  page,
}) => {
  // Navigate to the homepage
  await page.goto("/");

  // Find the search input (combobox)
  const searchInput = page.getByRole("combobox");
  await expect(searchInput).toBeVisible();

  // Type a query and wait for suggestions
  await searchInput.fill("war");
  await page.waitForSelector("[role='listbox']");

  // Verify the results header and suggestion rows appear
  await expect(page.locator("[role='listbox']")).toBeVisible();
  await expect(page.locator("text=Products").first()).toBeVisible();

  // Select the first suggestion if any appear (depends on catalog data)
  const options = page.locator("[role='option']");
  const optionCount = await options.count();
  if (optionCount > 0) {
    await options.first().click();
    // Should navigate to a product detail page
    await expect(page).toHaveURL(/\/products\/.+/);
  }
});

test("navigation search still navigates to the results page on submit", async ({
  page,
}) => {
  await page.goto("/");

  const searchInput = page.getByRole("combobox");
  await searchInput.fill("warhammer");
  await searchInput.press("Enter");

  // Submitting navigates to the search results page
  await expect(page).toHaveURL(/\/search\?q=warhammer/);
});