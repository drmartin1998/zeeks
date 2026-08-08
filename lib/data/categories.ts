import {
  type NavCategory,
  type NavCategoryNode,
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
} from "@/lib/square/types";
import { buildNavCategoryTree, fetchAllCategories } from "@/lib/square/catalog";

/**
 * Static navigation links that are informational pages — NOT Square-managed
 * catalog categories. These are always shown alongside Square categories.
 */
const STATIC_NAV_CATEGORIES: NavCategory[] = [
  { label: "About Us", href: "/about" },
  { label: "Local Events", href: "/events" },
  { label: "VIP Program", href: "/vip-program" },
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

/**
 * Builds the hierarchical category tree for the Shop menu directly from the
 * Square catalog.
 *
 * Uses the shared `fetchAllCategories()` (applies the channel filter and
 * allowlist centrally) and `buildNavCategoryTree()` to assemble nesting. This
 * mirrors how `getNavCategories()` fetches nav data directly via the server
 * SDK — Square tokens never leave the server (Constitution II).
 *
 * Returns `source: "square"` on success. On failure returns `source: "empty"`
 * with an empty `root` — the Shop menu is then not rendered. No fabricated
 * categories are ever substituted (Constitution VII).
 */
export async function getNavCategoryTree(): Promise<{
  root: NavCategoryNode[];
  source: "square" | "empty";
}> {
  try {
    const objects = await fetchAllCategories();
    return { root: buildNavCategoryTree(objects), source: "square" };
  } catch (error) {
    console.error(
      "getNavCategoryTree: failed to fetch category tree:",
      error instanceof Error ? error.message : error
    );
    return { root: [], source: "empty" };
  }
}
