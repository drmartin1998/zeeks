import { catalogApi, locationId } from "@/lib/square/client";
import { isSandbox } from "@/lib/env";
import {
  type NavCategoryNode,
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
 * In production, only top-level categories in `PRODUCTION_ALLOWED_CATEGORY_IDS`
 * are returned (their subcategories pass through). In sandbox, every valid
 * category is returned so the full catalog is visible for testing.
 * Consumers filter by top-level (via `isTopLevelCategory`) or build nested
 * trees as needed (e.g. `buildNavCategoryTree` for the Shop menu).
 */
export async function fetchAllCategories(): Promise<SquareCatalogCategory[]> {
  const response = await catalogApi.search({
    objectTypes: ["CATEGORY"],
    includeDeletedObjects: false,
  });

  const objects =
    (response as { objects?: SquareCatalogCategory[] }).objects ?? [];
  return objects
    .filter(
      (cat: SquareCatalogCategory): cat is SquareCatalogCategory =>
        cat.type === "CATEGORY" &&
        !!cat.categoryData &&
        // Exclude categories not visible online.
        (cat.categoryData.channels?.includes(process.env.SQUARE_CHANNEL_ID || "") ?? false)
    )
    .filter((cat) => {
      // In production, only allow the configured top-level categories
      // (subcategories always pass through).
      if (cat.categoryData.parentCategory?.id) return true;
      return PRODUCTION_ALLOWED_CATEGORY_IDS.includes(cat.id);
    });
}

/**
 * Square category IDs allowed as top-level categories in production.
 * Only the Games Workshop top-level category is currently allowed.
 */
const PRODUCTION_ALLOWED_CATEGORY_IDS: string[] = [
  "YG55V2TDWX5B4FM552DSPELU",
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
 * Build a nav-category tree (`NavCategoryNode[]`) from a flat Square
 * category list, for the Shop menu.
 *
 * Every top-level category becomes a root node whose `children` are its
 * nested subcategories (recursively). Subcategory hrefs use the
 * `/categories/<parent-slug>?sub=<slug>` query-parameter scheme. A leaf node
 * has an empty `children` array and `hasChildren === false` (renders as a
 * direct link).
 */
export function buildNavCategoryTree(
  allCats: SquareCatalogCategory[]
): NavCategoryNode[] {
  const childrenByParent = new Map<string, SquareCatalogCategory[]>();
  for (const cat of allCats) {
    const pid = cat.categoryData.parentCategory?.id;
    if (!pid) continue;
    const siblings = childrenByParent.get(pid) ?? [];
    siblings.push(cat);
    childrenByParent.set(pid, siblings);
  }

  const slugifyName = (name: string): string =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  // Build a subcategory node. `parentSlug` is the top-level category slug so
  // subcategory links use `/categories/<parent-slug>?sub=<this-slug>`.
  const buildNode = (
    cat: SquareCatalogCategory,
    parentSlug: string
  ): NavCategoryNode => {
    const slug = slugifyName(cat.categoryData.name);
    const children = (childrenByParent.get(cat.id) ?? []).map((child) =>
      buildNode(child, parentSlug)
    );
    return {
      label: cat.categoryData.name,
      href: `/categories/${parentSlug}?sub=${slug}`,
      children,
      hasChildren: children.length > 0,
    };
  };

  return allCats
    .filter(isTopLevelCategory)
    .map((cat) => {
      const slug = slugifyName(cat.categoryData.name);
      const children = (childrenByParent.get(cat.id) ?? []).map((child) =>
        buildNode(child, slug)
      );
      return {
        label: cat.categoryData.name,
        href: `/categories/${slug}`,
        children,
        hasChildren: children.length > 0,
      };
    });
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

    // ── Step 3: resolve product images via batchGet ────────────────────
    // `searchItems` returns `itemData.imageIds` for items that have images,
    // but the URL itself lives on the IMAGE catalog object. Collect every
    // item's image IDs (item-level, with variation-level as a fallback since
    // some products only attach images to a variation), then fetch the IMAGE
    // objects in batches of 100 (Square's batchGet object limit) and build an
    // id → url map. Items with no images simply keep `image: ""` so the
    // GameCard renders its gradient placeholder.
    const imageIdsByItemId = new Map<string, string[]>();
    const imageIdSet = new Set<string>();

    for (const item of allItems) {
      if (item.type !== "ITEM") continue;
      const raw = item as unknown as Record<string, unknown>;
      const itemData = raw.itemData as Record<string, unknown> | undefined;
      if (!itemData) continue;

      const ids: string[] = [];
      const itemImageIds = (itemData.imageIds as string[] | undefined) ?? [];
      ids.push(...itemImageIds);

      // Fallback: images may live only at the variation level.
      const variations =
        (itemData.variations as Record<string, unknown>[] | undefined) ?? [];
      for (const v of variations) {
        const vData = v?.itemVariationData as Record<string, unknown> | undefined;
        const varImageIds = (vData?.imageIds as string[] | undefined) ?? [];
        ids.push(...varImageIds);
      }

      if (ids.length > 0) {
        imageIdsByItemId.set(item.id, ids);
        for (const id of ids) imageIdSet.add(id);
      }
    }

    const imageUrlById = new Map<string, string>();
    const allImageIds = [...imageIdSet];
    for (let i = 0; i < allImageIds.length; i += 100) {
      const chunk = allImageIds.slice(i, i + 100);
      const res = await catalogApi.batchGet({ objectIds: chunk });
      const objects = res.objects ?? [];
      for (const obj of objects) {
        const objRaw = obj as unknown as Record<string, unknown>;
        if (obj.type === "IMAGE" && objRaw.imageData) {
          const imgData = objRaw.imageData as Record<string, unknown>;
          const url = imgData.url as string | undefined;
          if (url) imageUrlById.set(obj.id, url);
        }
      }
    }

    // Resolve the first available URL for an item, preferring item-level
    // imageIds over the variation-level fallback (order preserved above).
    const resolvePrimaryImage = (itemId: string): string => {
      const ids = imageIdsByItemId.get(itemId) ?? [];
      for (const id of ids) {
        const url = imageUrlById.get(id);
        if (url) return url;
      }
      return "";
    };

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
          image: resolvePrimaryImage(item.id),
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
 * Select which of a product's assigned categories should drive its breadcrumb.
 *
 * A Square catalog item can be assigned to MULTIPLE categories, and the first
 * one (`categories[0]`) is not necessarily part of the visible
 * (channel-filtered + allowlisted-top-level) hierarchy. If `categories[0]` is
 * an excluded category, treating it as the primary would make the breadcrumb
 * resolve to "Uncategorized".
 *
 * This picks the MOST SPECIFIC (deepest) category that:
 *  1. exists in the channel-filtered set (`allCats`), AND
 *  2. resolves up its `parentCategory.id` chain to a top-level category in
 *     `ALLOWED_CATEGORY_IDS` (guaranteeing the breadcrumb links to a real
 *     listing page).
 *
 * Returns the chosen category's id, or `undefined` if no assigned category is
 * part of the visible hierarchy.
 */
function selectPrimaryCategoryId(
  itemCategoryIds: string[],
  allCats: SquareCatalogCategory[]
): string | undefined {
  const catById = new Map(allCats.map((o) => [o.id, o]));

  // Resolve a category up its parent chain. Returns the ordered chain from the
  // top-level root down to the given category, or undefined if:
  //  - the category is not in the channel-filtered set, or
  //  - any ancestor is missing from the set, or
  //  - the top-most reachable category is NOT an allowlisted top-level category.
  const resolveToVisibleRoot = (
    id: string
  ): SquareCatalogCategory[] | undefined => {
    const chain: SquareCatalogCategory[] = [];
    const seen = new Set<string>();
    let current = catById.get(id);
    while (current && current.type === "CATEGORY" && !seen.has(current.id)) {
      seen.add(current.id);
      chain.unshift(current);
      const parentId: string | undefined =
        current.categoryData.parentCategory?.id;
      current = parentId ? catById.get(parentId) : undefined;
    }
    if (chain.length === 0) return undefined;
    // The top-most reachable category must be an ALLOWLISTED TOP-LEVEL
    // category (no parent within the visible set). Otherwise it is not part of
    // a fully-visible hierarchy (e.g. its real root is excluded).
    const root = chain[0];
    if (root.categoryData.parentCategory?.id) return undefined;
    if (!PRODUCTION_ALLOWED_CATEGORY_IDS.includes(root.id)) return undefined;
    return chain;
  };

  let bestChain: SquareCatalogCategory[] | undefined;
  for (const id of itemCategoryIds) {
    const chain = resolveToVisibleRoot(id);
    if (!chain) continue;
    // Prefer the deepest/most specific valid category so the breadcrumb is
    // meaningful (e.g. Warhammer 40K over Miniatures directly).
    if (!bestChain || chain.length > bestChain.length) {
      bestChain = chain;
    }
  }
  return bestChain?.[bestChain.length - 1].id;
}

/**
 * Resolve a category breadcrumb from the item's category IDs by walking the
 * full parent chain up to the top-level category.
 *
 * This uses `fetchAllCategories()` (all channel-filtered categories) so we can
 * climb from the product's primary category through every intermediate parent
 * to the root via `parentCategory.id`. The previous implementation could only
 * climb ONE level because it `batchGet`'d only the item's own category IDs,
 * so a product's subcategory link often pointed at a non-top-level slug that
 * 404'd on `/categories/[slug]`.
 *
 * Returns:
 *  - `category`  — the TOP-LEVEL category (e.g. "Miniatures"), so the
 *    breadcrumb's primary link goes to a valid `/categories/<top-slug>` route.
 *  - `subCategory` — the deepest (product's own) subcategory, for backward
 *    compatibility.
 *  - `categoryPath` — the full ordered path from top-level → deepest
 *    (e.g. [Miniatures, Games Workshop, Warhammer 40K]), enabling the
 *    breadcrumb to render every intermediate segment.
 */
async function resolveCategoryBreadcrumb(
  categoryIds: string[],
  primaryCategoryId?: string,
  allCats?: SquareCatalogCategory[]
): Promise<{
  category: CategoryBreadcrumbData;
  subCategory?: CategoryBreadcrumbData;
  categoryPath: CategoryBreadcrumbData[];
}> {
  const fallback: CategoryBreadcrumbData = {
    name: "Uncategorized",
    slug: "uncategorized",
  };
  if (!primaryCategoryId || categoryIds.length === 0) {
    return { category: fallback, categoryPath: [fallback] };
  }

  // Fetch all channel-filtered categories once so we can walk the full parent
  // chain from the product's own category up to the top-level root. The caller
  // may pass them in to avoid a redundant fetch.
  const allCatsResolved = allCats ?? (await fetchAllCategories());
  const catById = new Map(allCatsResolved.map((o) => [o.id, o]));
  const primary = catById.get(primaryCategoryId);

  if (!primary || primary.type !== "CATEGORY") {
    return { category: fallback, categoryPath: [fallback] };
  }

  const toSegment = (cat: SquareCatalogCategory): CategoryBreadcrumbData => {
    const name = cat.categoryData.name ?? "Uncategorized";
    return { name, slug: slugify(name) };
  };

  // Climb from the product's category up to the root (a category with no
  // parent). unshift builds the array root-first.
  const chain: SquareCatalogCategory[] = [];
  const seen = new Set<string>();
  let current: SquareCatalogCategory | undefined = primary;
  while (current && current.type === "CATEGORY" && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    const parentId: string | undefined =
      current.categoryData.parentCategory?.id;
    current = parentId ? catById.get(parentId) : undefined;
  }

  // chain[0] is the top-most reachable category within the channel-filtered set.
  const categoryPath = chain.map(toSegment);
  const category: CategoryBreadcrumbData = categoryPath[0] ?? fallback;
  const subCategory =
    chain.length > 1 ? categoryPath[categoryPath.length - 1] : undefined;

  return { category, subCategory, categoryPath };
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
  // No channel configured (common in sandbox) → allow product detail to load.
  const bypassFilters = !channelId;
  if (!channelId && !bypassFilters) {
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

    // Step 4: Resolve the category breadcrumb + related products in parallel.
    // Both only depend on the item's primary category ID, so we batch the
    // category lookup (a targeted `batchGet` of the item's category IDs, not
    // a full catalog search) concurrently with the related-products query.
    const categories =
      (itemData.categories as { id?: string }[]) ?? [];
    const categoryIds = categories
      .map((c) => c.id)
      .filter((id): id is string => !!id);

    // A Square item can be assigned to MULTIPLE categories, and the first one
    // is not always part of the visible (channel-filtered) hierarchy. Fetch the
    // channel-filtered categories ONCE and pick the deepest category that
    // resolves to an allowlisted top-level category, so the breadcrumb links to
    // a real listing page instead of falling back to "Uncategorized". The same
    // set is reused by `resolveCategoryBreadcrumb` to avoid a second fetch.
    const allCats = await fetchAllCategories();
    const primaryCategoryId = selectPrimaryCategoryId(categoryIds, allCats);

    // Run the two independent network calls in parallel, then assemble the
    // related products with breadcrumb labels once both have resolved.
    const [breadcrumbs, relatedRaw] = await Promise.all([
      resolveCategoryBreadcrumb(categoryIds, primaryCategoryId, allCats),
      resolveRelatedProducts(primaryCategoryId, itemId),
    ]);
    const categoryBreadcrumb = breadcrumbs.category;
    const subCategoryBreadcrumb = breadcrumbs.subCategory;
    const categoryPathBreadcrumb = breadcrumbs.categoryPath;
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
      categoryPath: categoryPathBreadcrumb,
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
