import {
  type NavCategory,
  type SquareCatalogCategory,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";
import { catalogApi } from "@/lib/square/client";

/**
 * Hardcoded categories that are NOT pulled from Square.
 * "About Us" and "Locations" are informational pages.
 * "Sale" is a marketing promo category.
 */
const STATIC_NAV_CATEGORIES: NavCategory[] = [
  { label: "About Us", href: "/about" },
  { label: "Locations", href: "/locations" },
  { label: "Sale", href: "/categories/sale", highlight: true },
];

/**
 * Fallback categories used when Square API is unreachable.
 * Mirrors the original hardcoded NAV_CATEGORIES from lib/data.ts.
 */
const FALLBACK_NAV_CATEGORIES: NavCategory[] = [
  { label: "Miniatures", href: "/categories/miniatures" },
  { label: "Board Games", href: "/categories/board-games" },
  { label: "Card Games", href: "/categories/card-games" },
  { label: "Supplies", href: "/categories/supplies" },
  ...STATIC_NAV_CATEGORIES,
];

/**
 * Fetches navigation categories from the Square Catalog API.
 *
 * Returns Square-managed categories with "About Us", "Locations",
 * and "Sale" appended at the end. Falls back to static data when
 * the Square API is unreachable.
 *
 * Uses `fetch` with ISR revalidation to cache catalog data.
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
      "Failed to fetch categories from Square, using fallback:",
      error instanceof Error ? error.message : error
    );
    return FALLBACK_NAV_CATEGORIES;
  }
}
