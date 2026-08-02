import { catalogApi, locationId } from "@/lib/square/client";
import {
  type SquareCatalogCategory,
  isTopLevelCategory,
} from "@/lib/square/types";
import type { CatalogObject } from "square";

// ---------------------------------------------------------------------------
// Pure data transforms (exported for use by Route Handlers and components)
// ---------------------------------------------------------------------------

/** Slugify a Square category name the same way the NavBar does. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Convert a Square price amount (in smallest currency unit) to dollars.
 * Square sends amounts in cents; some items may legitimately have price 0
 * (e.g. free digital goods), so 0 is a valid return value.
 */
export function normalizePrice(
  amountInSmallestUnit: bigint | null | undefined
): number {
  if (amountInSmallestUnit === undefined || amountInSmallestUnit === null)
    return 0;
  return Number(amountInSmallestUnit) / 100;
}

/** Fetch ALL Square catalog categories (top-level + subcategories) in one call. */
async function fetchAllCategories(): Promise<SquareCatalogCategory[]> {
  const response = await catalogApi.search({
    objectTypes: ["CATEGORY"],
    includeDeletedObjects: false,
  });
  const objects =
    (response as { objects?: SquareCatalogCategory[] }).objects ?? [];
  return objects
    .filter(
      (cat: SquareCatalogCategory): cat is SquareCatalogCategory =>
        cat.type === "CATEGORY" && !!cat.categoryData
    )
    .filter((cat) => {
      // Subcategories always pass through (filtered at consumer level via isTopLevelCategory)
      if (cat.categoryData.parentCategoryId) return true;
      // Top-level categories must be in the allowlist
      return ALLOWED_CATEGORY_IDS.includes(cat.id);
    });
}

/**
 * Square category IDs that are allowed as top-level categories.
 * Only Miniatures and Hobby Supplies are currently allowlisted.
 * All other top-level Square categories are filtered out.
 */
const ALLOWED_CATEGORY_IDS: string[] = [
  "ZCZJWQX6WREDLATZFW3U7OCJ", // Miniatures
  "62G7JSXJDS4U574NW4XS4WKV", // Hobby Supplies
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SquareCategory {
  title: string;
  slug: string;
  image: string;
  href: string;
}

export interface SquareSubCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SquareProduct {
  title: string;
  category: string;
  categorySlug: string;
  /** The subcategory this product belongs to, if any */
  subCategory?: string;
  subCategorySlug?: string;
  price: number;
  image: string;
  gradient: string;
}

// ---------------------------------------------------------------------------
// Public API – categories
// ---------------------------------------------------------------------------

/**
 * Fetch all top-level Square categories.
 *
 * @deprecated Use `fetch("/api/catalog/categories")` from Server Components
 *   instead. This direct SDK call bypasses Route Handlers, which violates
 *   Constitution Principle II. Kept for backward compatibility during migration.
 */
export async function getSquareCategories(): Promise<SquareCategory[]> {
  try {
    const objects = await fetchAllCategories();

    return objects
      .filter(isTopLevelCategory)
      .map((cat) => ({
        title: cat.categoryData.name,
        slug: slugify(cat.categoryData.name),
        image: "/category-cards/warhammer-category-card.png",
        href: `/categories/${slugify(cat.categoryData.name)}`,
      }));
  } catch {
    console.error("Failed to fetch categories from Square catalog");
    return [];
  }
}

/**
 * Look up a single top-level Square category by its slug.
 *
 * @deprecated Use `fetch("/api/catalog/products?slug={slug}")` from Server
 *   Components instead. This direct SDK call bypasses Route Handlers, which
 *   violates Constitution Principle II. Kept for backward compatibility.
 */
export async function getSquareCategoryBySlug(
  slug: string
): Promise<SquareCategory | null> {
  try {
    const objects = await fetchAllCategories();

    const found = objects
      .filter(isTopLevelCategory)
      .find((cat) => slugify(cat.categoryData.name) === slug);

    if (!found) return null;

    return {
      title: found.categoryData.name,
      slug,
      image: "/category-cards/warhammer-category-card.png",
      href: `/categories/${slug}`,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch subcategories for a given parent category slug.
 *
 * @deprecated Use `fetch("/api/catalog/products?slug={slug}")` from Server
 *   Components and extract subcategory info from the response. This direct
 *   SDK call bypasses Route Handlers. Kept for backward compatibility.
 */
export async function getSquareSubcategories(
  parentSlug: string
): Promise<SquareSubCategory[]> {
  try {
    const allCats = await fetchAllCategories();

    // Find the parent category ID
    const parent = allCats
      .filter(isTopLevelCategory)
      .find((cat) => slugify(cat.categoryData.name) === parentSlug);

    if (!parent) return [];

    const parentId = parent.id;

    // Find children whose parentCategoryId matches
    return allCats
      .filter(
        (cat) =>
          !isTopLevelCategory(cat) &&
          cat.categoryData.parentCategoryId === parentId
      )
      .map((cat) => ({
        id: cat.id,
        name: cat.categoryData.name,
        slug: slugify(cat.categoryData.name),
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API – products
// ---------------------------------------------------------------------------

/**
 * Fetch items that belong to a specific top-level Square category AND all
 * of its subcategories.
 *
 * 1. Finds the parent category ID and all subcategory IDs for the given slug.
 * 2. Uses `searchItems` with ALL those category IDs.
 * 3. Annotates each product with its subcategory info when applicable.
 *
 * @deprecated Use `fetch("/api/catalog/products?slug={slug}")` from Server
 *   Components instead. The new Route Handler provides the same data through
 *   the proper architecture (Constitution II). Kept for backward compatibility.
 */
export async function getSquareProductsByCategorySlug(
  slug: string
): Promise<SquareProduct[] | null> {
  try {
    const allCats = await fetchAllCategories();

    // ── Step 1: resolve slug → parent category + subcategories ──────────
    const parent = allCats
      .filter(isTopLevelCategory)
      .find((cat) => slugify(cat.categoryData.name) === slug);

    if (!parent) return null;

    const parentId = parent.id;
    const parentName = parent.categoryData.name;

    // Build a map of category ID → subcategory info for annotation
    const subCategoryMap = new Map<string, SquareSubCategory>();
    for (const cat of allCats) {
      if (
        !isTopLevelCategory(cat) &&
        cat.categoryData.parentCategoryId === parentId
      ) {
        subCategoryMap.set(cat.id, {
          id: cat.id,
          name: cat.categoryData.name,
          slug: slugify(cat.categoryData.name),
        });
      }
    }

    // Collect all category IDs to search: parent + all subcategories
    const allCategoryIds = [parentId, ...subCategoryMap.keys()];

    // ── Step 2: search items with cursor-based pagination ──────────────
    const allItems: CatalogObject[] = [];
    let cursor: string | undefined;

    do {
      const { items, cursor: nextCursor } = await catalogApi.searchItems({
        categoryIds: allCategoryIds,
        enabledLocationIds: [locationId],
        cursor,
        limit: 100,
      });

      if (items) {
        allItems.push(...items);
      }

      cursor = nextCursor;
    } while (cursor);

    return allItems
      .filter(
        (item): item is CatalogObject.Item =>
          item.type === "ITEM" && !!(item as unknown as Record<string, unknown>).itemData
      )
      .map((item) => {
        const raw = item as unknown as Record<string, unknown>;
        const itemData = raw.itemData as Record<string, unknown> | undefined;
        const name = (itemData?.name as string) ?? "Untitled";
        const variations = (itemData?.variations as Record<string, unknown>[]) ?? [];
        const firstVariation = variations[0];
        const varData = firstVariation?.itemVariationData as Record<string, unknown> | undefined;
        const priceMoney = varData?.priceMoney as { amount?: bigint; currency?: string } | undefined;

        // Determine which subcategory (if any) this product belongs to
        let subCategory: string | undefined;
        let subCategorySlug: string | undefined;

        const categories = itemData?.categories as { id?: string }[] | undefined;
        if (categories) {
          for (const catRef of categories) {
            if (catRef.id && subCategoryMap.has(catRef.id)) {
              const sub = subCategoryMap.get(catRef.id)!;
              subCategory = sub.name;
              subCategorySlug = sub.slug;
              break;
            }
          }
        }

        return {
          title: name,
          category: parentName,
          categorySlug: slug,
          subCategory,
          subCategorySlug,
          price: normalizePrice(priceMoney?.amount),
          image: "",
          gradient: "from-zeeks-purple to-zeeks-purple-dark",
        };
      });
  } catch {
    return null;
  }
}
