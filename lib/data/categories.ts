import {
  type NavCategory,
  type SquareCatalogCategory,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";
import { fetchAllCategories } from "@/lib/square/catalog";

/**
 * Static navigation links that are informational pages — NOT Square-managed
 * catalog categories. These are always shown alongside Square categories.
 */
const STATIC_NAV_CATEGORIES: NavCategory[] = [
  { label: "About Us", href: "/about" },
  { label: "Locations", href: "/locations" },
];

/**
 * Fetches navigation categories from the Square Catalog API.
 *
 * Uses the shared fetchAllCategories() which applies the channel filter
 * and allowlist filter centrally. Returns only top-level categories.
 *
 * On Square API failure, returns ONLY the static nav items — never
 * falls back to mock data for Square-managed categories.
 */
export async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const objects = await fetchAllCategories();

    const squareCategories: NavCategory[] = objects
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
