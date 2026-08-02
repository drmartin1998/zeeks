import {
  type NavCategory,
  type SquareCatalogCategory,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";
import { catalogApi } from "@/lib/square/client";

/**
 * Square category IDs that are allowed as top-level categories.
 * Mirrors ALLOWED_CATEGORY_IDS in lib/square/catalog.ts.
 */
const ALLOWED_CATEGORY_IDS = [
  "ZCZJWQX6WREDLATZFW3U7OCJ", // Miniatures
  "62G7JSXJDS4U574NW4XS4WKV", // Hobby Supplies
];

/**
 * Static navigation links that are informational pages — NOT Square-managed
 * catalog categories. These are always shown alongside Square categories.
 */
const STATIC_NAV_CATEGORIES: NavCategory[] = [
  { label: "About Us", href: "/about" },
  { label: "Locations", href: "/locations" },
  { label: "Sale", href: "/categories/sale", highlight: true },
];

/**
 * Fetches navigation categories from the Square Catalog API.
 *
 * Returns Square-managed categories with "About Us", "Locations",
 * and "Sale" appended at the end.
 *
 * On Square API failure, returns ONLY the static nav items — never
 * falls back to mock data for Square-managed categories.
 */
export async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const response = await catalogApi.search({
      objectTypes: ["CATEGORY"],
      includeDeletedObjects: false,
    });

    const objects = (response as { objects?: SquareCatalogCategory[] }).objects ?? [];

    const squareCategories: NavCategory[] = objects
      .filter(
        (obj: SquareCatalogCategory): obj is SquareCatalogCategory =>
          obj.type === "CATEGORY" && !!obj.categoryData
      )
      .filter((cat) => {
        // Subcategories always pass through
        if (cat.categoryData.parentCategoryId) return true;
        // Top-level categories must be in the allowlist
        return ALLOWED_CATEGORY_IDS.includes(cat.id);
      })
      .filter(isTopLevelCategory)
      .map(mapSquareCategoryToNavCategory);

    return [...squareCategories, ...STATIC_NAV_CATEGORIES];
  } catch (error) {
    console.error(
      "Failed to fetch categories from Square:",
      error instanceof Error ? error.message : error
    );
    return STATIC_NAV_CATEGORIES;
  }
}
