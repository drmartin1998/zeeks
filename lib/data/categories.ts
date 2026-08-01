import {
  type NavCategory,
  type SquareCatalogCategory,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";
import { catalogApi } from "@/lib/square/client";

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
