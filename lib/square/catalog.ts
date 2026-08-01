import { catalogApi } from "@/lib/square/client";
import {
  type SquareCatalogCategory,
  isTopLevelCategory,
} from "@/lib/square/types";
import type { CatalogObject } from "square";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Slugify a Square category name the same way the NavBar does */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Minimum price in dollars we'll show.
 * Square sends amounts in smallest currency units (cents), and some items
 * may legitimately have price 0 (e.g. free digital goods).  We keep 0 as
 * valid so those items still appear.
 */
function normalizePrice(amountInSmallestUnit: bigint | null | undefined): number {
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
  return objects.filter(
    (cat: SquareCatalogCategory): cat is SquareCatalogCategory =>
      cat.type === "CATEGORY" && !!cat.categoryData
  );
}

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
 * Returns an empty array on error (no mock data fallback).
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
 * Returns `null` when the category cannot be found or the API errors out.
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
 * Returns an empty array on error or if no subcategories exist.
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
 * Returns `null` on any error.
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

    // ── Step 2: search items by all those category IDs ───────────────────
    const itemResponse = await catalogApi.searchItems({
      categoryIds: allCategoryIds,
    });

    const items =
      (itemResponse as { items?: CatalogObject[] }).items ?? [];

    return items
      .filter(
        (item): item is CatalogObject.Item =>
          item.type === "ITEM" && !!item.itemData
      )
      .map((item) => {
        const itemData = item.itemData!;
        const firstVariation = itemData.variations?.[0];
        const priceMoney =
          firstVariation?.type === "ITEM_VARIATION"
            ? firstVariation.itemVariationData?.priceMoney
            : undefined;

        // Determine which subcategory (if any) this product belongs to
        let subCategory: string | undefined;
        let subCategorySlug: string | undefined;

        if (itemData.categories) {
          for (const catRef of itemData.categories) {
            if (catRef.id && subCategoryMap.has(catRef.id)) {
              const sub = subCategoryMap.get(catRef.id)!;
              subCategory = sub.name;
              subCategorySlug = sub.slug;
              break;
            }
          }
        }

        return {
          title: itemData.name ?? "Untitled",
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
