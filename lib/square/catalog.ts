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

/**
 * Fetch ALL Square catalog categories (top-level + subcategories) in one call.
 *
 * Filters applied centrally (all consumers inherit automatically):
 * 1. Channel filter — only categories in SQUARE_CHANNEL_ID
 * 2. Allowlist filter — subcategories pass through; top-level must be in ALLOWED_CATEGORY_IDS
 *
 * Centralization: getNavCategories(), getSquareCategoryBySlug(),
 * getSquareSubcategories(), and getSquareProductsByCategorySlug() all
 * call this function and receive channel-filtered data automatically.
 */
export async function fetchAllCategories(): Promise<SquareCatalogCategory[]> {
  const channelId = process.env.SQUARE_CHANNEL_ID;
  if (!channelId) {
    console.warn(
      "SQUARE_CHANNEL_ID not configured; no categories will be returned"
    );
    return [];
  }

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
      // Channel filter: only categories assigned to the target channel
      const channels = cat.categoryData.channels ?? [];
      return channels.includes(channelId);
    })
    .filter((cat) => {
      // Online visibility filter: exclude categories not visible online
      return cat.categoryData.onlineVisibility !== false;
    })
    .filter((cat) => {
      // Subcategories always pass through (filtered at consumer level via isTopLevelCategory)
      if (cat.categoryData.parentCategory?.id) return true;
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

    // Find children whose parentCategory.id matches
    return allCats
      .filter(
        (cat) =>
          !isTopLevelCategory(cat) &&
          cat.categoryData.parentCategory?.id === parentId
      )
      .map((cat) => ({
        id: cat.id,
        name: cat.categoryData.name,
        slug: slugify(cat.categoryData.name),
      }))
      .filter(
        // Deduplicate by slug (Square may have duplicate subcategory names)
        (sub, index, arr) => arr.findIndex((s) => s.slug === sub.slug) === index
      );
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
        cat.categoryData.parentCategory?.id === parentId
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

// ---------------------------------------------------------------------------
// Product Detail – slug-based lookup
// ---------------------------------------------------------------------------

/**
 * Resolve a product slug to full product detail data.
 *
 * Strategy (viable for ~50 products):
 * 1. Fetch all catalog items at the configured location via searchItems
 * 2. Match by slugified item name
 * 3. Retrieve full details (images, variations, categories) via batchGet
 * 4. Resolve category breadcrumb and related products
 *
 * Returns null if no product matches the slug or the product is channel-excluded.
 */
export async function getProductDetailBySlug(
  slug: string
): Promise<import("@/lib/square/types").ProductDetail | null> {
  const channelId = process.env.SQUARE_CHANNEL_ID;
  if (!channelId) {
    console.warn(
      "SQUARE_CHANNEL_ID not configured; product detail unavailable"
    );
    return null;
  }

  try {
    // Step 1: Fetch all catalog items via search (proven method from fetchAllCategories)
    const searchResponse = await catalogApi.search({
      objectTypes: ["ITEM"],
      includeDeletedObjects: false,
    });

    const items =
      (searchResponse as { objects?: CatalogObject[] }).objects ?? [];

    // Step 2: Match by slugified name
    const matched = items.find((item) => {
      if (item.type !== "ITEM") return false;
      const raw = item as unknown as Record<string, unknown>;
      const itemData = raw.itemData as Record<string, unknown> | undefined;
      const name = itemData?.name as string | undefined;
      if (!name) return false;
      return slugify(name) === slug;
    });

    if (!matched || !matched.id) return null;

    const itemId: string = matched.id;

    // Step 3: Retrieve full details with images
    const detailResponse = await catalogApi.batchGet({
      objectIds: [itemId],
      includeRelatedObjects: true,
    });

    const objects = detailResponse.objects ?? [];
    const relatedObjects = detailResponse.relatedObjects ?? [];
    const obj = objects[0];

    if (!obj || obj.type !== "ITEM") return null;

    const raw = obj as unknown as Record<string, unknown>;
    const itemData = raw.itemData as Record<string, unknown> | undefined;
    if (!itemData) return null;

    const title = (itemData.name as string | undefined) ?? "Untitled";
    const description = itemData.description as string | undefined;
    const variationsRaw =
      (itemData.variations as Record<string, unknown>[]) ?? [];

    // Resolve images from related objects
    const imageIds = (itemData.imageIds as string[]) ?? [];
    const images: string[] = [];
    for (const relObj of relatedObjects) {
      const relRaw = relObj as unknown as Record<string, unknown>;
      if (
        relObj.type === "IMAGE" &&
        imageIds.includes(relObj.id) &&
        relRaw.imageData
      ) {
        const imgData = relRaw.imageData as Record<string, unknown>;
        const url = imgData.url as string | undefined;
        if (url) images.push(url);
      }
    }

    // Step 4: Resolve category breadcrumb
    const categories =
      (itemData.categories as { id?: string }[]) ?? [];
    const primaryCategoryId = categories[0]?.id;

    let categoryBreadcrumb = { name: "Uncategorized", slug: "uncategorized" };
    let subCategoryBreadcrumb:
      | { name: string; slug: string }
      | undefined;

    if (primaryCategoryId) {
      const allCats = await fetchAllCategories();
      const cat = allCats.find((c) => c.id === primaryCategoryId);
      if (cat) {
        categoryBreadcrumb = {
          name: cat.categoryData.name,
          slug: slugify(cat.categoryData.name),
        };

        if (cat.categoryData.parentCategory?.id) {
          const parentCat = allCats.find(
            (c) => c.id === cat.categoryData.parentCategory!.id
          );
          if (parentCat) {
            subCategoryBreadcrumb = categoryBreadcrumb;
            categoryBreadcrumb = {
              name: parentCat.categoryData.name,
              slug: slugify(parentCat.categoryData.name),
            };
          }
        }
      }
    }

    // Step 5: Build variations with inventory counts
    const variations = variationsRaw.map((v) => {
      const varData =
        (v as Record<string, unknown>).itemVariationData as
          | Record<string, unknown>
          | undefined;
      const varPriceMoney = varData?.priceMoney as
        | { amount?: bigint; currency?: string }
        | undefined;
      const varLocationOverrides =
        varData?.locationOverrides as Record<string, unknown>[] | undefined;
      const locationOverride = varLocationOverrides?.[0];
      return {
        id: (v as Record<string, unknown>).id as string,
        name: (varData?.name as string) ?? (v as Record<string, unknown>).id as string,
        sku: varData?.sku as string | undefined,
        price: normalizePrice(varPriceMoney?.amount),
        imageUrl: undefined,
        inventoryCount: locationOverride?.stockable
          ? (locationOverride?.stockableQuantity as number | undefined)
          : undefined,
      };
    });

    // Step 6: Related products from same category
    const relatedProducts: import("@/lib/square/types").Product[] = [];
    if (primaryCategoryId) {
      const relatedResponse = await catalogApi.searchItems({
        categoryIds: [primaryCategoryId],
        enabledLocationIds: [locationId],
        limit: 5,
      });
      const relatedItems = relatedResponse.items ?? [];
      for (const relItem of relatedItems) {
        if (relItem.id === itemId) continue;
        if (relItem.type !== "ITEM") continue;
        const relRaw = relItem as unknown as Record<string, unknown>;
        const relData = relRaw.itemData as Record<string, unknown> | undefined;
        if (!relData) continue;
        const relVariations =
          (relData.variations as Record<string, unknown>[]) ?? [];
        const relFirstVar = relVariations[0];
        const relVarData = relFirstVar?.itemVariationData as
          | Record<string, unknown>
          | undefined;
        const relPriceMoney = relVarData?.priceMoney as
          | { amount?: bigint; currency?: string }
          | undefined;
        relatedProducts.push({
          id: relItem.id,
          title: (relData.name as string) ?? "Untitled",
          description: relData.description as string | undefined,
          category: categoryBreadcrumb.name,
          categorySlug: categoryBreadcrumb.slug,
          subCategory: subCategoryBreadcrumb?.name,
          subCategorySlug: subCategoryBreadcrumb?.slug,
          price: normalizePrice(relPriceMoney?.amount),
          currency: (relPriceMoney?.currency as string) ?? "USD",
          imageUrl: undefined,
          gradient: "from-zeeks-purple to-zeeks-purple-dark",
        });
        if (relatedProducts.length >= 4) break;
      }
    }

    // Determine inventory status from first variation
    const firstVariation = variationsRaw[0];
    const firstVarData = firstVariation?.itemVariationData as
      | Record<string, unknown>
      | undefined;
    const locationOverrides =
      firstVarData?.locationOverrides as Record<string, unknown>[] | undefined;
    let inventoryStatus: import("@/lib/square/types").InventoryStatus =
      "UNKNOWN";
    if (locationOverrides && locationOverrides.length > 0) {
      const override = locationOverrides[0];
      const soldOut = override.soldOut as boolean | undefined;
      inventoryStatus = soldOut ? "OUT_OF_STOCK" : "IN_STOCK";
    }

    const firstVarPriceMoney = firstVarData?.priceMoney as
      | { amount?: bigint; currency?: string }
      | undefined;

    return {
      id: itemId,
      title,
      slug,
      description,
      category: categoryBreadcrumb,
      categorySlug: categoryBreadcrumb.slug,
      subCategory: subCategoryBreadcrumb,
      subCategorySlug: subCategoryBreadcrumb?.slug,
      price: normalizePrice(firstVarPriceMoney?.amount),
      currency: firstVarPriceMoney?.currency ?? "USD",
      imageUrl: images[0],
      gradient: "from-zeeks-purple to-zeeks-purple-dark",
      images,
      variations,
      inventoryStatus,
      relatedProducts,
    };
  } catch (error) {
    console.error(
      "[getProductDetailBySlug] Error resolving product:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
