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
 * Square custom attribute definition key that holds a product's brand value.
 * Read from `itemData.customAttributeValues[BRAND_KEY].stringValue`.
 */
export const BRAND_KEY = "brand";

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

/**
 * A node in the hierarchical subcategory tree. Mirrors `SquareSubCategory`
 * but adds a recursive `children` list so the facet can render a drill-down
 * (parent → child) hierarchy. `children` is empty for leaf nodes.
 */
export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryTreeNode[];
}

/**
 * The slug path for a product's subcategory, ordered from the nearest
 * top-level-child ancestor down to the product's own (deepest) category.
 * e.g. ["games-workshop", "warhammer-40k", "space-marines"].
 */
export interface SubcategoryPath {
  /** Category ID → slug path from the top-level child down to that category. */
  slugPathByCategoryId: Map<string, string[]>;
}

export interface SquareProduct {
  title: string;
  category: string;
  categorySlug: string;
  /** The subcategory this product belongs to, if any */
  subCategory?: string;
  subCategorySlug?: string;
  /**
   * The ordered slug path of the product's subcategory, from the nearest
   * top-level-child ancestor down to the product's own (deepest) category.
   * Enables drill-down filtering by a grandchild subcategory. Optional for
   * backward compatibility with products that only carry `subCategorySlug`.
   */
  subCategorySlugs?: string[];
  price: number;
  minPrice?: number;
  maxPrice?: number;
  image: string;
  gradient: string;
  catalogObjectId?: string;
  variationId?: string;
  hasVariations?: boolean;
  /** Manufacturer brand from the item's brand custom attribute, if any */
  brand?: string;
  /** Availability at the listing location; in stock if any variation is available */
  availability: "IN_STOCK" | "OUT_OF_STOCK";
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
 * Recursively resolve the category subtree rooted at `parentId` from a flat
 * Square category list.
 *
 * Returns two structures:
 * - `descendantIds`: every category ID that is a descendant of `parentId`
 *   (any depth — direct children, grandchildren, great-grandchildren, ...).
 * - `subByDescendantId`: maps EVERY descendant category ID to the nearest
 *   ancestor that is a DIRECT child of `parentId` (the "facet subcategory").
 *
 * This is what makes deep (2+ level) category hierarchies work: a product
 * assigned to a sub-subcategory under "Games Workshop" gets annotated as
 * belonging to the "Games Workshop" facet (its nearest top-level child),
 * even though the product is not directly assigned to "Games Workshop".
 */
export function buildSubcategoryTree(
  allCats: SquareCatalogCategory[],
  parentId: string
): {
  descendantIds: string[];
  subByDescendantId: Map<string, SquareSubCategory>;
} {
  // Build adjacency: parentId -> direct child ids
  const childrenByParent = new Map<string, string[]>();
  for (const cat of allCats) {
    const pid = cat.categoryData.parentCategory?.id;
    if (!pid) continue;
    const siblings = childrenByParent.get(pid) ?? [];
    siblings.push(cat.id);
    childrenByParent.set(pid, siblings);
  }

  const subInfoByCatId = new Map<string, SquareSubCategory>();
  const directChildren = childrenByParent.get(parentId) ?? [];

  // For each direct child of the parent, walk its full subtree and assign
  // the child as the facet subcategory for the child AND every descendant.
  for (const childId of directChildren) {
    const child = allCats.find((c) => c.id === childId);
    if (!child) continue;
    const sub: SquareSubCategory = {
      id: childId,
      name: child.categoryData.name,
      slug: slugify(child.categoryData.name),
    };
    // Depth-first walk; the first (most top-level) assignment wins, so a
    // nested category is attributed to its nearest top-level child ancestor.
    const stack = [childId];
    while (stack.length) {
      const id = stack.pop()!;
      if (subInfoByCatId.has(id)) continue;
      subInfoByCatId.set(id, sub);
      for (const grandChild of childrenByParent.get(id) ?? []) {
        stack.push(grandChild);
      }
    }
  }

  return {
    descendantIds: [...subInfoByCatId.keys()],
    subByDescendantId: subInfoByCatId,
  };
}

/**
 * Build a nested category tree rooted at the DIRECT children of `parentId`.
 *
 * Each returned node is a direct child of `parentId` with its own `children`
 * recursively populated (grandchildren, great-grandchildren, ...). This is the
 * data structure the subcategory facet needs to render a drill-down
 * (parent → child) hierarchy: selecting a parent reveals its children.
 *
 * The tree is a pure function of the flat category list, so it is fully
 * unit-testable without any network dependency.
 */
export function buildCategoryTree(
  allCats: SquareCatalogCategory[],
  parentId: string
): CategoryTreeNode[] {
  // Build adjacency: parentId -> direct child categories.
  const childrenByParent = new Map<string, SquareCatalogCategory[]>();
  for (const cat of allCats) {
    const pid = cat.categoryData.parentCategory?.id;
    if (!pid) continue;
    const siblings = childrenByParent.get(pid) ?? [];
    siblings.push(cat);
    childrenByParent.set(pid, siblings);
  }

  const buildNode = (cat: SquareCatalogCategory): CategoryTreeNode => ({
    id: cat.id,
    name: cat.categoryData.name,
    slug: slugify(cat.categoryData.name),
    children: (childrenByParent.get(cat.id) ?? []).map(buildNode),
  });

  return (childrenByParent.get(parentId) ?? []).map(buildNode);
}

/**
 * Flatten a category tree into a slug-path lookup.
 *
 * For every category ID present in the tree (direct children, grandchildren,
 * ...), map it to the ordered slug path from its nearest top-level-child
 * ancestor down to that category. This is what lets a product be filtered by a
 * grandchild subcategory: a product is "under" facet node X iff X's slug
 * appears in the product's path.
 */
export function flattenCategoryTree(
  rootNodes: CategoryTreeNode[]
): SubcategoryPath {
  const slugPathByCategoryId = new Map<string, string[]>();

  const walk = (node: CategoryTreeNode, ancestors: string[]) => {
    const path = [...ancestors, node.slug];
    slugPathByCategoryId.set(node.id, path);
    for (const child of node.children) {
      walk(child, path);
    }
  };

  for (const root of rootNodes) {
    walk(root, []);
  }

  return { slugPathByCategoryId };
}

/**
 * Fetch the full subcategory tree for a top-level category slug.
 *
 * Unlike `getSquareSubcategories` (which returns only DIRECT children for the
 * flat facet), this returns the nested tree — each direct child with all of
 * its descendants (children, grandchildren, ...) — so the client can render a
 * drill-down subcategory facet.
 */
export async function getCategoryTree(
  slug: string
): Promise<CategoryTreeNode[]> {
  try {
    const allCats = await fetchAllCategories();

    const parent = allCats
      .filter(isTopLevelCategory)
      .find((cat) => slugify(cat.categoryData.name) === slug);

    if (!parent) return [];

    return buildCategoryTree(allCats, parent.id);
  } catch {
    return [];
  }
}

/**
 * Fetch items that belong to a specific top-level Square category AND all
 * of its subcategories (recursively, at any depth).
 *
 * 1. Finds the parent category ID and recursively resolves ALL descendant
 *    subcategory IDs (direct children, grandchildren, ...).
 * 2. Uses `searchItems` with ALL those category IDs so products in deeply
 *    nested subcategories (e.g., a sub-subcategory under "Games Workshop")
 *    are fetched.
 * 3. Annotates each product with its nearest top-level-child ancestor so a
 *    product in a nested subcategory rolls up to the visible facet option.
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

    // Recursively resolve the full subtree below the parent. This captures
    // subcategories at any nesting depth and maps every descendant category
    // to its nearest top-level-child ancestor for facet annotation.
    const { descendantIds, subByDescendantId } = buildSubcategoryTree(
      allCats,
      parentId
    );

    // Build the nested tree + slug-path lookup so products can also be
    // annotated with their full subcategory path (top child → deepest). This
    // is what enables drill-down filtering by a grandchild subcategory.
    const categoryTree = buildCategoryTree(allCats, parentId);
    const { slugPathByCategoryId } = flattenCategoryTree(categoryTree);

    // Collect all category IDs to search: parent + ALL descendants (any depth)
    const allCategoryIds = [parentId, ...descendantIds];

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

        let minPrice: number | undefined;
        let maxPrice: number | undefined;
        if (variations.length > 1) {
          const prices = variations
            .map((v) => {
              const vData = v?.itemVariationData as Record<string, unknown> | undefined;
              const vPrice = vData?.priceMoney as { amount?: bigint; currency?: string } | undefined;
              return normalizePrice(vPrice?.amount);
            })
            .filter((p) => p > 0);
          if (prices.length > 0) {
            minPrice = Math.min(...prices);
            maxPrice = Math.max(...prices);
          }
        }

        // Determine which subcategory (if any) this product belongs to
        let subCategory: string | undefined;
        let subCategorySlug: string | undefined;
        let subCategorySlugs: string[] | undefined;

        const categories = itemData?.categories as { id?: string }[] | undefined;
        if (categories) {
          for (const catRef of categories) {
            if (catRef.id && subByDescendantId.has(catRef.id)) {
              const sub = subByDescendantId.get(catRef.id)!;
              subCategory = sub.name;
              subCategorySlug = sub.slug;
              // The full slug path (top child → deepest) for drill-down filtering.
              subCategorySlugs =
                slugPathByCategoryId.get(catRef.id) ?? [sub.slug];
              break;
            }
          }
        }

        // Brand: read from the item's custom attribute value (STRING type)
        const customAttributeValues =
          (itemData?.customAttributeValues as Record<string, unknown> | undefined) ??
          {};
        const brandValue = customAttributeValues[BRAND_KEY] as
          | { stringValue?: string | null }
          | undefined;
        const brand = brandValue?.stringValue ?? undefined;

        // Availability: in stock if ANY variation is available at the location
        const availability: "IN_STOCK" | "OUT_OF_STOCK" = variations.some(
          (v) => {
            const vData = v?.itemVariationData as Record<string, unknown> | undefined;
            const overrides =
              (vData?.locationOverrides as Record<string, unknown>[] | undefined) ?? [];
            const override = overrides.find((o) => o.locationId === locationId) ?? overrides[0];
            return !(override?.soldOut as boolean | undefined);
          }
        )
          ? "IN_STOCK"
          : "OUT_OF_STOCK";

        return {
          title: name,
          category: parentName,
          categorySlug: slug,
          subCategory,
          subCategorySlug,
          subCategorySlugs,
          price: normalizePrice(priceMoney?.amount),
          minPrice,
          maxPrice,
          image: "",
          gradient: "from-zeeks-purple to-zeeks-purple-dark",
          catalogObjectId: item.id,
          variationId: (firstVariation?.id as string | undefined) ?? item.id,
          hasVariations: variations.length > 1,
          brand,
          availability,
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

type CategoryBreadcrumbData = { name: string; slug: string };

/**
 * Resolve a category breadcrumb from the item's category IDs using a targeted
 * `batchGet` of only those categories (instead of fetching the entire catalog
 * of categories). Returns the deepest category as the subCategory and its
 * parent (if any) as the top-level category.
 */
async function resolveCategoryBreadcrumb(
  categoryIds: string[],
  primaryCategoryId?: string
): Promise<{ category: CategoryBreadcrumbData; subCategory?: CategoryBreadcrumbData }> {
  const fallback: CategoryBreadcrumbData = {
    name: "Uncategorized",
    slug: "uncategorized",
  };
  if (!primaryCategoryId || categoryIds.length === 0) {
    return { category: fallback };
  }

  const catResponse = await catalogApi.batchGet({ objectIds: categoryIds });
  const catObjects = catResponse.objects ?? [];
  const catById = new Map(catObjects.map((o) => [o.id, o]));
  const primary = catById.get(primaryCategoryId);

  if (!primary || primary.type !== "CATEGORY") {
    return { category: fallback };
  }

  const primaryData = primary.categoryData as {
    name?: string;
    parentCategory?: { id?: string };
  };
  const category: CategoryBreadcrumbData = {
    name: primaryData.name ?? "Uncategorized",
    slug: slugify(primaryData.name ?? "Uncategorized"),
  };

  const parentId = primaryData.parentCategory?.id;
  if (parentId && catById.has(parentId)) {
    const parent = catById.get(parentId);
    const parentRaw = parent as unknown as Record<string, unknown>;
    const parentData = parentRaw.categoryData as
      | { name?: string }
      | undefined;
    return {
      category: {
        name: parentData?.name ?? category.name,
        slug: slugify(parentData?.name ?? category.name),
      },
      subCategory: category,
    };
  }

  return { category };
}

interface RelatedProductData {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl: undefined;
  gradient: string;
}

/**
 * Fetch up to 5 items in the same primary category (excluding the current
 * item) to use as related products. Returns raw product data; breadcrumb
 * labels are applied by the caller after category resolution completes.
 */
async function resolveRelatedProducts(
  primaryCategoryId?: string,
  itemId?: string
): Promise<RelatedProductData[]> {
  if (!primaryCategoryId) return [];

  const relatedResponse = await catalogApi.searchItems({
    categoryIds: [primaryCategoryId],
    enabledLocationIds: [locationId],
    limit: 5,
  });
  const relatedItems = relatedResponse.items ?? [];

  const related: RelatedProductData[] = [];
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
    related.push({
      id: relItem.id,
      title: (relData.name as string) ?? "Untitled",
      description: relData.description as string | undefined,
      price: normalizePrice(relPriceMoney?.amount),
      currency: (relPriceMoney?.currency as string) ?? "USD",
      imageUrl: undefined,
      gradient: "from-zeeks-purple to-zeeks-purple-dark",
    });
    if (related.length >= 4) break;
  }
  return related;
}

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
    // Step 1: Find the item by slug with a targeted text search instead of
    // paginating the entire catalog. The slug is derived from the item name,
    // so reverse it back to a space-separated query. `textFilter` also serves
    // as the required filter for `searchItems` (it returns zero results with
    // only `enabledLocationIds`), so this both fixes correctness and narrows
    // the server-side result set to a handful of candidates.
    const nameQuery = slug.replace(/-/g, " ").trim();
    const searchResponse = await catalogApi.searchItems({
      textFilter: nameQuery,
      enabledLocationIds: [locationId],
      limit: 100,
    });

    // Step 2: Match by slugified name in the (small) candidate set
    const searchResults = searchResponse.items ?? [];
    const matched = searchResults.find((item) => {
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

    // Step 4: Resolve category breadcrumb + related products in parallel.
    // Both only depend on the item's primary category ID, so we batch the
    // category lookup (a targeted `batchGet` of the item's category IDs, not
    // a full catalog search) concurrently with the related-products query.
    const categories =
      (itemData.categories as { id?: string }[]) ?? [];
    const primaryCategoryId = categories[0]?.id;
    const categoryIds = categories
      .map((c) => c.id)
      .filter((id): id is string => !!id);

    // Run the two independent network calls in parallel, then assemble the
    // related products with breadcrumb labels once both have resolved.
    const [breadcrumbs, relatedRaw] = await Promise.all([
      resolveCategoryBreadcrumb(categoryIds, primaryCategoryId),
      resolveRelatedProducts(primaryCategoryId, itemId),
    ]);
    const categoryBreadcrumb = breadcrumbs.category;
    const subCategoryBreadcrumb = breadcrumbs.subCategory;
    const relatedProducts: import("@/lib/square/types").Product[] =
      relatedRaw.map((rel) => ({
        ...rel,
        category: categoryBreadcrumb.name,
        categorySlug: categoryBreadcrumb.slug,
        subCategory: subCategoryBreadcrumb?.name,
        subCategorySlug: subCategoryBreadcrumb?.slug,
      }));

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
        isSoldOut: (locationOverride?.soldOut as boolean | undefined) ?? false,
      };
    });

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

// ---------------------------------------------------------------------------
// Product Search
// ---------------------------------------------------------------------------

/**
 * Search Square catalog products by text query.
 * Returns DisplayProduct[] suitable for product listing pages.
 */
export async function searchProductsByQuery(
  q: string
): Promise<import("@/lib/square/types").DisplayProduct[]> {
  if (!q || q.trim().length === 0) return [];

  try {
    const result = await catalogApi.searchItems({
      textFilter: q.trim(),
      enabledLocationIds: [locationId],
      limit: 100,
    });

    const items = result.items ?? [];

    return items
      .filter(
        (item): item is CatalogObject.Item =>
          item.type === "ITEM" &&
          !!(item as unknown as Record<string, unknown>).itemData
      )
      .map((item) => {
        const raw = item as unknown as Record<string, unknown>;
        const itemData = raw.itemData as Record<string, unknown> | undefined;
        const name = (itemData?.name as string) ?? "Untitled";
        const variations =
          (itemData?.variations as Record<string, unknown>[]) ?? [];
        const firstVariation = variations[0];
        const varData = firstVariation?.itemVariationData as
          | Record<string, unknown>
          | undefined;
        const priceMoney = varData?.priceMoney as
          | { amount?: bigint; currency?: string }
          | undefined;

        let minPrice: number | undefined;
        let maxPrice: number | undefined;
        if (variations.length > 1) {
          const prices = variations
            .map((v) => {
              const vData = v?.itemVariationData as Record<string, unknown> | undefined;
              const vPrice = vData?.priceMoney as { amount?: bigint; currency?: string } | undefined;
              return normalizePrice(vPrice?.amount);
            })
            .filter((p) => p > 0);
          if (prices.length > 0) {
            minPrice = Math.min(...prices);
            maxPrice = Math.max(...prices);
          }
        }

        return {
          slug: slugify(name),
          title: name,
          category: "Search Results",
          price: normalizePrice(priceMoney?.amount),
          image: undefined,
          gradient: "from-zeeks-purple to-zeeks-purple-dark",
          catalogObjectId: item.id,
          variationId: (firstVariation?.id as string | undefined) ?? item.id,
          hasVariations: variations.length > 1,
          minPrice,
          maxPrice,
          brand: ((itemData?.customAttributeValues as Record<string, unknown> | undefined)?.[BRAND_KEY] as { stringValue?: string | null } | undefined)?.stringValue ?? undefined,
          availability: variations.some((v) => {
            const vData = v?.itemVariationData as Record<string, unknown> | undefined;
            const overrides =
              (vData?.locationOverrides as Record<string, unknown>[] | undefined) ?? [];
            const override = overrides.find((o) => o.locationId === locationId) ?? overrides[0];
            return !(override?.soldOut as boolean | undefined);
          })
            ? "IN_STOCK"
            : "OUT_OF_STOCK",
        };
      });
  } catch (error) {
    console.error(
      "[searchProductsByQuery] Error:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}
